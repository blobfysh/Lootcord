exports.command = {
	name: 'getbans',
	aliases: [],
	description: 'Get a list of all banned players.',
	long: 'Get a list of all banned players.',
	args: {
		page: 'Page number.'
	},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo }) {
		const page = (app.parse.numbers(args)[0] || 1) - 1

		try {
			const bannedList = []
			const bans = await app.query('SELECT * FROM banned ORDER BY date DESC LIMIT ?, 10', [page * 10])

			const banMsg = new app.Embed()
				.setAuthor(`Banned Players (Page ${page + 1})`)
				.setDescription(`${app.icons.loading} fetching bans...`)
				.setColor(720640)
			const botMessage = await message.channel.createMessage(banMsg)

			for (let i = 0; i < bans.length; i++) {
				const user = await app.common.fetchUser(bans[i].userId, { cacheIPC: false })

				bannedList.push(`${(page * 10) + 1 + i}. ${user.username}#${user.discriminator} (${user.id})`)
			}

			setTimeout(() => {
				banMsg.setDescription(`Sorted newest to oldest:\`\`\`\n${bannedList.join('\n') || 'None'}\`\`\``)
				botMessage.edit(banMsg)
			}, 1000)
		}
		catch (err) {
			message.reply(`Error: \`\`\`${err}\`\`\``)
		}
	}
}
