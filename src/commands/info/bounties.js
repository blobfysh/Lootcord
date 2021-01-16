const usersPerPage = 10

module.exports = {
	name: 'bounties',
	aliases: ['bountys', 'bountylist'],
	description: 'Displays users with bounties in the server.',
	long: 'Displays users with bounties in the server. A player with a bounty can be killed to claim the bounty money, making them worthwhile targets. Bounties expire every week on sunday.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const bounties = []
		const bountyRows = await app.query(`SELECT scores.userId, badge, SUM(bounties.money) AS hit
        FROM scores
        INNER JOIN userGuilds
        ON scores.userId = userGuilds.userId
        INNER JOIN bounties
        ON scores.userId = bounties.userId
        WHERE guildId = "${message.channel.guild.id}"
        GROUP BY userId`)

		for (let i = 0; i < bountyRows.length; i++) {
			try {
				const member = await app.common.fetchMember(message.channel.guild, bountyRows[i].userId)

				bounties.push(`${app.player.getBadge(bountyRows[i].badge)} ${member.nick || member.username} - ${app.common.formatNumber(bountyRows[i].hit)}`)
			}
			catch (err) {
				// continue
			}
		}

		if (bounties.length > usersPerPage) {
			const pages = []

			const maxPage = Math.ceil(bounties.length / usersPerPage)

			for (let i = 1; i < maxPage + 1; i++) {
				// create each page for pagination
				const page = getEmbedPage(app, bounties, i, usersPerPage)

				if (message.channel.guild.iconURL) page.setThumbnail(message.channel.guild.iconURL)
				pages.push(page)
			}

			app.react.paginate(message, pages)
		}
		else {
			const page = getEmbedPage(app, bounties, 1, usersPerPage)

			if (message.channel.guild.iconURL) page.setThumbnail(message.channel.guild.iconURL)
			message.channel.createMessage(page)
		}
	}
}

function getEmbedPage(app, bountyList, pageNum, perPage) {
	const indexFirst = (perPage * pageNum) - perPage
	const indexLast = perPage * pageNum

	const newEmbed = new app.Embed()
		.setColor(13451564)

	if (bountyList.length) {
		const date = new Date()
		const converted = new Date(date.toLocaleString('en-US', {
			timeZone: 'America/New_York'
		}))
		const sunday = new Date(converted)
		sunday.setHours(24, 0, 0, 0)
		sunday.setDate(sunday.getDate() + ((0 + (7 - sunday.getDay())) % 7))
		const timeUntilSunday = sunday.getTime() - converted.getTime()


		newEmbed.setDescription(`**${app.icons.death_skull} Kill any of these players to claim their bounty!**\n(\`${app.cd.convertTime(timeUntilSunday)}\` until bounties expire)\n\nPlace your own bounties using the \`placebounty\` command.`)
		newEmbed.addField(`**Bounties Available** (${bountyList.length})`, bountyList.map((user, index) => `${index + 1}. **${user}**`).slice(indexFirst, indexLast).join('\n'))
	}
	else {
		newEmbed.setDescription(`**${app.icons.death_skull} There are no activated players with bounties in this server!**\n\nIf you'd like to place a bounty on someone, use the \`placebounty\` command.`)
	}

	return newEmbed
}
