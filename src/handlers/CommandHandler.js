class CommandHandler {
	constructor(app) {
		this.app = app
		this.spamCooldown = new Set()
		this.prefix = app.config.prefix
	}

	async handle(message) {
		const prefix = message.channel.guild ? await this.app.common.getPrefix(message.channel.guild.id) : this.prefix

		if (!message.content.toLowerCase().startsWith(prefix)) return

		const args = message.content.slice(prefix.length).split(/ +/)
		const commandName = args.shift().toLowerCase()
		const command = this.app.commands.find(cmd => cmd.name === commandName || (cmd.aliases.length && cmd.aliases.includes(commandName)))

		// no command was found
		if (!command) { return }

		// makes sure command wasn't used in DM's
		else if (!message.channel.guild) { return message }

		// check if bot should ignore guild entirely
		else if (this.app.config.ignoredGuilds.includes(message.channel.guild.id)) { return }

		// check if user is banned from bot
		else if (await this.app.cd.getCD(message.author.id, 'banned')) { return }

		// makes sure bot has all permissions from config (prevents permission-related errors)
		else if (!this.botHasPermissions(message)) { return }

		// check if user has spam cooldown
		else if (this.spamCooldown.has(message.author.id)) {
			const botMsg = await message.channel.createMessage('⏱ **You\'re talking too fast, I can\'t understand! Please slow down...** `2 seconds`')
			setTimeout(() => {
				botMsg.delete()
			}, 2000)

			return
		}

		else if (this.app.sets.disabledCommands.has(command.name)) {
			return message.channel.createMessage('❌ That command has been disabled to prevent issues! Sorry about that...')
		}

		const blindedCD = await this.app.cd.getCD(message.author.id, 'blinded')

		// check if user is under effects of 40mm_smoke_grenade
		if (blindedCD && command.category !== 'admin' && command.category !== 'moderation') {
			const smokedEmbed = new this.app.Embed()
				.setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
				.setDescription(`❌ You are blinded by a ${this.app.itemdata['40mm_smoke_grenade'].icon}\`40mm_smoke_grenade\`!`)
				.setColor(16734296)
				.setFooter(`The smoke will clear in ${blindedCD}.`)

			return message.channel.createMessage(smokedEmbed)
		}

		// chcek if user is admin before running admin command
		else if (command.category === 'admin' && !this.app.sets.adminUsers.has(message.author.id)) { return }

		// ignore mod command if user is not a moderator or admin
		else if (command.category === 'moderation' && (!await this.app.cd.getCD(message.author.id, 'mod') && !this.app.sets.adminUsers.has(message.author.id))) { return }

		const account = await this.app.player.getRow(message.author.id)

		// check if player leveled up
		if (account) await this.app.player.checkLevelXP(message, account)

		if (Math.random() <= 0.02) this.app.eventHandler.initEvent(message, { prefix })

		// check if command requires an account at all, create new account for player if command requires it.
		if (command.requiresAcc && !account) await this.app.player.createAccount(message.author.id)

		// check if player meets the minimum level required to run the command
		if (command.levelReq && ((account ? account.level : 1) < command.levelReq)) { return message.channel.createMessage(`❌ You must be at least level \`${command.levelReq}\` to use that command!`) }

		// check if command requires an active account (player would be elligible to be attacked) in the server
		else if (command.requiresAcc && command.requiresActive && !await this.app.player.isActive(message.author.id, message.channel.guild.id)) { return message.channel.createMessage(`❌ You need to activate before using that command here! Use \`${prefix}activate\` to activate.`) }

		// check if command is patrons only
		else if (command.patronTier1Only && !await this.app.patreonHandler.isPatron(message.author.id) && !this.app.sets.adminUsers.has(message.author.id)) {
			return message.channel.createMessage(`❌ \`${command.name}\` is exclusive for patreon donators. Support Lootcord on patreon to get access: https://www.patreon.com/lootcord`)
		}
		else if (command.patronTier2Only && !await this.app.patreonHandler.isPatron(message.author.id, 2) && !this.app.sets.adminUsers.has(message.author.id)) {
			return message.channel.createMessage(`❌ \`${command.name}\` is exclusive for **Loot Hoarder**+ patreon donators. Support Lootcord on patreon to get access: https://www.patreon.com/lootcord`)
		}

		// check if user has manage server permission before running guildModsOnly command
		else if (command.guildModsOnly && !message.member.permission.has('manageGuild')) { return message.channel.createMessage('❌ You need the `Manage Server` permission to use this command!') }

		// execute command
		try {
			this.app.cache.incr('commands')
			this.app.query(`UPDATE scores SET lastActive = NOW() WHERE userId = ${message.author.id}`)

			command.execute(this.app, message, { args, prefix })
			console.log(`${message.author.username}#${message.author.discriminator} (${message.author.id}) ran command: ${command.name} in guild: ${message.channel.guild.name} (${message.channel.guild.id})`)

			// dont add spamCooldown if in debug mode or user is admin
			if (this.app.config.debug || this.app.sets.adminUsers.has(message.author.id)) return

			let spamCD = 2000
			this.spamCooldown.add(message.author.id)
			if (await this.app.patreonHandler.isPatron(message.author.id)) spamCD = 1000

			setTimeout(() => {
				this.spamCooldown.delete(message.author.id)
			}, spamCD)
		}
		catch (err) {
			console.error(err)
			message.channel.createMessage('Command failed to execute!')
		}
	}

	// check that bot has all permissions specificed in config before running a command.
	botHasPermissions(message) {
		const botPerms = message.channel.permissionsOf(this.app.bot.user.id)
		const neededPerms = []

		for (const perm of Object.keys(this.app.config.requiredPerms)) {
			if (!botPerms.has(perm)) {
				neededPerms.push(this.app.config.requiredPerms[perm])
			}
		}

		if (neededPerms.length) {
			const permsString = neededPerms.map(perm => neededPerms.length > 1 && neededPerms.indexOf(perm) === (neededPerms.length - 1) ? `or \`${perm}\`` : `\`${perm}\``).join(', ')
			if (!neededPerms.includes('Send Messages')) message.channel.createMessage(`I don't have permission to ${permsString}... Please reinvite me or give me those permissions :(`)

			return false
		}

		return true
	}
}

module.exports = CommandHandler
