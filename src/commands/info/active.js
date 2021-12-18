const usersPerPage = 10

exports.command = {
	name: 'active',
	aliases: ['players'],
	description: 'Displays all active users on the server.',
	long: 'Displays all active users on the server.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const guildUsers = []
		const clans = []
		let clanRows = []
		let userRows

		if (serverSideGuildId) {
			clanRows = await app.query(`SELECT DISTINCT server_clans.name FROM (
				SELECT server_scores.clanId
				FROM userguilds
				INNER JOIN server_scores
				ON userguilds.userId = server_scores.userId
				WHERE userguilds.guildId = ${message.channel.guild.id} AND server_scores.guildId = "${message.channel.guild.id}"
			) c
			INNER JOIN server_clans
			ON c.clanId = server_clans.clanId`)

			userRows = await app.query(`SELECT server_scores.userId, badge
				FROM server_scores
				INNER JOIN userguilds
				ON server_scores.userId = userguilds.userId
				WHERE userguilds.guildId = "${message.channel.guild.id}" AND server_scores.guildId = "${message.channel.guild.id}"
				ORDER BY LOWER(server_scores.userId)`)
		}
		else {
			clanRows = await app.query(`SELECT DISTINCT clans.name FROM (
				SELECT scores.clanId
				FROM userguilds
				INNER JOIN scores
				ON userguilds.userId = scores.userId
				WHERE userguilds.guildId = ${message.channel.guild.id}
			) c
			INNER JOIN clans
			ON c.clanId = clans.clanId`)

			userRows = await app.query(`SELECT scores.userId, badge
				FROM scores
				INNER JOIN userguilds
				ON scores.userId = userguilds.userId
				WHERE guildId = "${message.channel.guild.id}"
				ORDER BY LOWER(scores.userId)`)
		}

		for (let i = 0; i < userRows.length; i++) {
			try {
				const member = await app.common.fetchMember(message.channel.guild, userRows[i].userId)

				guildUsers.push(`${app.player.getBadge(userRows[i].badge)} ${member.nick || member.username}`)
			}
			catch (err) {
				// continue
			}
		}
		for (let i = 0; i < clanRows.length; i++) {
			clans.push(clanRows[i].name)
		}

		if (guildUsers.length > usersPerPage) {
			const pages = []

			// max page is based off of active users because there will never be more active clans than there are active users
			const maxPage = Math.ceil(guildUsers.length / usersPerPage)

			for (let i = 1; i < maxPage + 1; i++) {
				// create each page for pagination
				const page = getEmbedPage(app, guildUsers, clans, i, usersPerPage)

				if (message.channel.guild.iconURL) page.setThumbnail(message.channel.guild.iconURL)
				pages.push(page)
			}

			app.btnCollector.paginate(message, pages)
		}
		else {
			const page = getEmbedPage(app, guildUsers, clans, 1, usersPerPage)

			if (message.channel.guild.iconURL) page.setThumbnail(message.channel.guild.iconURL)
			message.channel.createMessage(page)
		}
	}
}

function getEmbedPage (app, guildUserList, guildClanList, pageNum, perPage) {
	const indexFirst = (perPage * pageNum) - perPage
	const indexLast = perPage * pageNum

	const newEmbed = new app.Embed()
		.setColor('#ADADAD')
		.addField(`**Active Players** (${guildUserList.length})`, guildUserList.map((user, index) => `${index + 1}. **${user}**`).slice(indexFirst, indexLast).join('\n'))

	if (guildClanList.length) newEmbed.addField(`**Active Clans** (${guildClanList.length})`, guildClanList.map((clan, index) => `${index + 1}. \`${clan}\``).slice(indexFirst, indexLast).join('\n') || '\u200b')

	return newEmbed
}
