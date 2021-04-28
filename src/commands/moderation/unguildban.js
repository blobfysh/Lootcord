exports.command = {
	name: 'unguildban',
	aliases: ['guildunban', 'unbanguild'],
	description: 'Unbans a guild.',
	long: 'Unbans a guild, allowing the bot to be invited.',
	args: {
		'Guild ID': 'ID of guild to unban.'
	},
	examples: ['unguildban 497302646521069568'],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		const guildID = args[0]

		if (message.channel.id !== app.config.modChannel) {
			return message.reply('❌ You must be in the moderator channel to use this command.')
		}
		else if (!guildID) {
			return message.reply('❌ You forgot to include a guild ID.')
		}
		else if (!await app.cd.getCD(guildID, 'guildbanned')) {
			return message.reply('❌ Guild is not banned.')
		}

		await app.query(`DELETE FROM bannedguilds WHERE guildId ="${guildID}"`)
		await app.cd.clearCD(guildID, 'guildbanned')

		message.reply(`Successfully unbanned guild \`${guildID}\`.`)
	}
}
