const LOGS_PER_PAGE = 5

module.exports = {
	name: 'logs',
	aliases: ['log'],
	description: 'Shows logs of a clan.',
	long: 'Shows logs of a clan.',
	args: { 'clan/user': 'Clan or user to search, will default to your own clan if none specified.' },
	examples: [],
	requiresClan: false,
	requiresActive: false,
	minimumRank: 0,

	async execute(app, message, { args, prefix }) {
		const scoreRow = await app.player.getRow(message.author.id)
		const user = app.parse.members(message, args)[0]

		if (!args.length && scoreRow.clanId === 0) {
			return message.reply('You are not a member of any clan! You can look up other clans by searching their name.')
		}
		else if (!args.length) {
			const clanRow = await app.clans.getRow(scoreRow.clanId)
			const logs = await app.query(`SELECT * FROM clan_logs WHERE clanId = ${scoreRow.clanId} ORDER BY logDate DESC LIMIT 50`)

			if (logs.length <= LOGS_PER_PAGE) {
				return message.channel.createMessage(generatePages(app, logs, clanRow.name)[0])
			}

			app.react.paginate(message, generatePages(app, logs, clanRow.name), 30000)
		}
		else if (user) {
			const invitedScoreRow = (await app.query(`SELECT * FROM scores WHERE userId = ${user.id}`))[0]

			if (!invitedScoreRow) {
				return message.reply('❌ The person you\'re trying to search doesn\'t have an account!')
			}
			else if (invitedScoreRow.clanId === 0) {
				return message.reply('❌ That user is not in a clan.')
			}

			const clanRow = await app.clans.getRow(invitedScoreRow.clanId)
			const logs = await app.query(`SELECT * FROM clan_logs WHERE clanId = ${invitedScoreRow.clanId} ORDER BY logDate DESC LIMIT 50`)

			if (logs.length <= LOGS_PER_PAGE) {
				return message.channel.createMessage(generatePages(app, logs, clanRow.name)[0])
			}

			app.react.paginate(message, generatePages(app, logs, clanRow.name), 30000)
		}
		else {
			const clanName = args.join(' ')
			const clanRow = await app.clans.searchClanRow(clanName)

			if (!clanRow) {
				return message.reply('I could not find a clan with that name! Maybe you misspelled it?')
			}

			const logs = await app.query(`SELECT * FROM clan_logs WHERE clanId = ${clanRow.clanId} ORDER BY logDate DESC LIMIT 50`)

			if (logs.length <= LOGS_PER_PAGE) {
				return message.channel.createMessage(generatePages(app, logs, clanRow.name)[0])
			}

			app.react.paginate(message, generatePages(app, logs, clanRow.name), 30000)
		}
	}
}

function generatePages(app, logs, clanName) {
	const maxPage = Math.ceil(logs.length / LOGS_PER_PAGE) || 1
	const pages = []

	for (let i = 1; i < maxPage + 1; i++) {
		const indexFirst = (LOGS_PER_PAGE * i) - LOGS_PER_PAGE
		const indexLast = LOGS_PER_PAGE * i
		const selectedLogs = logs.slice(indexFirst, indexLast)

		const logsEmbed = new app.Embed()
			.setAuthor(clanName, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
			.setTitle('Logs (Newest to Oldest)')
			.setColor(13451564)

		for (const log of selectedLogs) {
			logsEmbed.addField(app.common.getShortDate(log.logTime), `\`\`\`\n${log.details}\`\`\``)
		}

		if (!selectedLogs.length) {
			logsEmbed.setDescription('😟 there\'s nothing to see here')
		}

		pages.push(logsEmbed)
	}

	return pages
}
