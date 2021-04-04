module.exports = {
	name: 'leaderboard',
	aliases: ['lb'],
	description: 'Show the best players overall or in the current server.',
	long: 'Displays a leaderboard of all players with the highest level and amount of money.',
	args: { g: '**OPTIONAL** Will show the global leaderboard' },
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		if (args[0] === 'g' || args[0] === 'global') {
			const leaders = await getGlobalLB(app)

			const embedLeader = new app.Embed()
				.setTitle('Global Leaderboard')
				.setColor('#000000')
				.addField('Richest - Lootcoin', leaders.moneyLB.join('\n'), true)
				.addField('Richest - Scrap', leaders.scrapLB.join('\n'), true)
				.addField('Level', leaders.levelLB.join('\n'))
				.addField('Kills', leaders.killLB.join('\n'))
				.addField('Richest Clans', leaders.clanLB.join('\n'))
				.setFooter('Top 5 | Refreshes every 6 hours')

			return message.channel.createMessage(embedLeader)
		}

		const leaders = []
		const levelLeaders = []
		const killLeaders = []
		const scrapLeaders = []

		const moneyRows = await app.query(`SELECT scores.userId, money, badge
            FROM userGuilds
            INNER JOIN scores
            ON userGuilds.userId = scores.userId
            WHERE userGuilds.guildId ="${message.channel.guild.id}"
            ORDER BY money DESC LIMIT 3`)
		const scrapRows = await app.query(`SELECT scores.userId, scrap, badge
            FROM userGuilds
            INNER JOIN scores
            ON userGuilds.userId = scores.userId
            WHERE userGuilds.guildId ="${message.channel.guild.id}"
            ORDER BY scrap DESC LIMIT 3`)
		const levelRows = await app.query(`SELECT scores.userId, level, badge
            FROM userGuilds
            INNER JOIN scores
            ON userGuilds.userId = scores.userId
            WHERE userGuilds.guildId ="${message.channel.guild.id}"
            ORDER BY level DESC LIMIT 3`)
		const killRows = await app.query(`SELECT scores.userId, kills, badge
            FROM userGuilds
            INNER JOIN scores
            ON userGuilds.userId = scores.userId
            WHERE userGuilds.guildId ="${message.channel.guild.id}"
            ORDER BY kills DESC LIMIT 3`)

		for (const key in moneyRows) {
			try {
				const member = await app.common.fetchMember(message.channel.guild, moneyRows[key].userId)
				leaders.push(`${app.player.getBadge(moneyRows[key].badge)} ${`${member.username}#${member.discriminator}`} - ${app.common.formatNumber(moneyRows[key].money)}`)
			}
			catch (err) {
				console.log(err)
			}
		}
		for (const key in scrapRows) {
			try {
				const member = await app.common.fetchMember(message.channel.guild, scrapRows[key].userId)
				scrapLeaders.push(`${app.player.getBadge(scrapRows[key].badge)} ${`${member.username}#${member.discriminator}`} - ${app.common.formatNumber(scrapRows[key].scrap, false, true)}`)
			}
			catch (err) {
				// continue
			}
		}
		for (const key in levelRows) {
			try {
				const member = await app.common.fetchMember(message.channel.guild, levelRows[key].userId)
				levelLeaders.push(`${app.player.getBadge(levelRows[key].badge)} ${`${member.username}#${member.discriminator}`} - Level ${levelRows[key].level}`)
			}
			catch (err) {
				// continue
			}
		}
		for (const key in killRows) {
			try {
				const member = await app.common.fetchMember(message.channel.guild, killRows[key].userId)
				killLeaders.push(`${app.player.getBadge(killRows[key].badge)} ${`${member.username}#${member.discriminator}`} - ${killRows[key].kills} kills`)
			}
			catch (err) {
				// continue
			}
		}

		const embedLeader = new app.Embed()
			.setTitle('Server Leaderboard')
			.setColor('#e6b8e9')
			.setFooter(`Top ${leaders.length}`)

		if (leaders.length) {
			embedLeader.addField('Richest - Lootcoin', leaders.join('\n'))
			embedLeader.addField('Richest - Scrap', scrapLeaders.join('\n'))
			embedLeader.addField('Level', levelLeaders.join('\n'))
			embedLeader.addField('Kills', killLeaders.join('\n'))
		}
		else {
			embedLeader.setDescription('Where is everyone?! :(')
		}

		if (message.channel.guild.iconURL) embedLeader.setThumbnail(message.channel.guild.iconURL)
		message.channel.createMessage(embedLeader)
	}
}

async function getGlobalLB(app) {
	const cacheLB = await app.cache.get('leaderboard')

	if (!cacheLB) {
		try {
			const leaders = await app.leaderboard.getLB()

			app.cache.setNoExpire('leaderboard', JSON.stringify(leaders))
			return leaders
		}
		catch (err) {
			console.log(err)
		}
	}
	else {
		console.log('searched cache for LB!')
		return JSON.parse(cacheLB)
	}
}
