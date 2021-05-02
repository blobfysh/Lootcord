const Interaction = require('../structures/Interaction')
const { InteractionType, InteractionResponseType, MessageFlags } = require('slash-commands')

exports.run = async function(packet, id) {
	if (packet.t === 'INTERACTION_CREATE') {
		const interaction = new Interaction(packet.d, this.bot.user.id)
		const command = this.slashCommands.find(cmd => (cmd.guilds && cmd.guilds.includes(interaction.guild_id) && cmd.name === interaction.data.name) || cmd.name === interaction.data.name)

		if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
			return
		}

		else if (!interaction.guild_id) {
			// command was run in DMs
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: '❌ Slash commands don\'t work in DMs.',
					flags: MessageFlags.EPHEMERAL
				}
			})
		}

		else if (interaction.member.user.bot || !command) {
			return
		}

		// check if bot should ignore guild entirely
		else if (this.config.ignoredGuilds.includes(interaction.guild_id)) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: '❌ This server cannot use the bot.',
					flags: MessageFlags.EPHEMERAL
				}
			})
		}

		// check if user is banned from bot
		else if (await this.cd.getCD(interaction.member.user.id, 'banned')) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: '❌ You are banned from the bot. You can appeal here: https://lootcord.com/appeal',
					flags: MessageFlags.EPHEMERAL
				}
			})
		}

		else if (this.sets.disabledCommands.has(command.name)) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: '❌ That command has been disabled to prevent issues! Sorry about that...',
					flags: MessageFlags.EPHEMERAL
				}
			})
		}

		const guildInfo = await this.common.getGuildInfo(interaction.guild_id)
		const serverSideGuildId = guildInfo.serverOnly ? interaction.guild_id : undefined
		const account = await this.player.getRow(interaction.member.user.id, serverSideGuildId)
		const blindedCD = await this.cd.getCD(interaction.member.user.id, 'blinded', { serverSideGuildId })

		// check if user is under effects of 40mm_smoke_grenade
		if (blindedCD) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `❌ You are blinded by a ${this.itemdata['40mm_smoke_grenade'].icon}\`40mm_smoke_grenade\`! The smoke will clear in \`${blindedCD}\`.`,
					flags: MessageFlags.EPHEMERAL
				}
			})
		}

		// check if command requires an account at all, create new account for player if command requires it.
		if (command.requiresAcc && !account) await this.player.createAccount(interaction.member.user.id, serverSideGuildId)

		// check if player meets the minimum level required to run the command
		if (command.levelReq && ((account ? account.level : 1) < command.levelReq)) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `❌ You must be at least level \`${command.levelReq}\` to use that command!`,
					flags: MessageFlags.EPHEMERAL
				}
			})
		}

		// check if command requires an active account (player would be elligible to be attacked) in the server
		else if (command.requiresAcc && command.requiresActive && !await this.player.isActive(interaction.member.user.id, interaction.guild_id)) {
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: '❌ You need to activate before using that command here! Use `t-activate` to activate.',
					flags: MessageFlags.EPHEMERAL
				}
			})
		}


		// execute command
		try {
			await this.cache.incr('commands')

			if (serverSideGuildId) {
				await this.query(`UPDATE server_scores SET lastActive = NOW() WHERE userId = ${interaction.member.user.id} AND guildId = ${serverSideGuildId}`)
			}
			else {
				await this.query(`UPDATE scores SET lastActive = NOW() WHERE userId = ${interaction.member.user.id}`)
			}

			await command.execute(this, interaction, {
				guildInfo,

				// useful property for passing to addItem/addMoney methods so I dont have to do it inside every command
				serverSideGuildId
			})

			console.log(`${interaction.member.user.username}#${interaction.member.user.discriminator} (${interaction.member.user.id}) ran command: ${command.name} in guild: ${interaction.guild_id}`)
		}
		catch (err) {
			console.error(err)
			return interaction.respond({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: '❌ There was an error trying to run that command. If you keep seeing this, notify us in the support server!',
					flags: MessageFlags.EPHEMERAL
				}
			})
		}
	}
}
