const { BUTTONS } = require('../../resources/constants')

exports.command = {
	name: 'guildban',
	aliases: ['banguild'],
	description: 'Bans a guild.',
	long: 'Bans a guild from using the bot, makes the bot leave and prevent joining back.',
	args: {
		'Guild ID': 'ID of guild to ban.',
		'reason': 'Reason for banning this guild.'
	},
	examples: ['guildban 497302646521069568 Farming airdrops'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const guildID = args[0]
		const reason = args.slice(1).join(' ')

		if (message.channel.id !== app.config.modChannel) {
			return message.reply('❌ You must be in the moderator channel to use this command.')
		}
		else if (!guildID) {
			return message.reply('❌ You forgot to include a guild ID.')
		}
		else if (!reason) {
			return message.reply('❌ You need to specify a reason for banning this guild.')
		}
		else if (await app.cd.getCD(guildID, 'guildbanned')) {
			return message.reply('❌ Guild is already banned.')
		}

		const fetchedGuildInfo = await app.common.fetchGuild(guildID)

		if (!fetchedGuildInfo) return message.reply('❌ I am not in a guild with that ID.')

		const botMessage = await message.reply({
			content: `Ban and remove Lootcord from **${fetchedGuildInfo.name}**?`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				try {
					await app.query('INSERT INTO bannedguilds (guildId, reason, date) VALUES (?, ?, ?)', [guildID, reason, new Date().getTime()])
					await app.cache.setNoExpire(`guildbanned|${guildID}`, 'Banned perma')

					app.ipc.broadcast('removeGuild', {
						guildId: guildID
					})

					await confirmed.respond({
						content: `Successfully banned guild **${fetchedGuildInfo.name}**.`,
						components: []
					})
				}
				catch (err) {
					await confirmed.respond({
						content: `Error banning guild: \`\`\`js\n${err}\`\`\``,
						components: []
					})
				}
			}
			else {
				botMessage.delete()
			}
		}
		catch (err) {
			await botMessage.edit({
				content: '❌ Command timed out.',
				components: []
			})
		}
	}
}
