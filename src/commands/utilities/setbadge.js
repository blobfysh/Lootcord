const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'setbadge',
	aliases: [],
	description: 'Sets a badge to display.',
	long: 'Sets your display badge. This badge will be displayed next to your name on the leaderboard, active player list, clan member list, random attack selection list, and more.',
	args: { badge: 'Badge to display' },
	examples: ['setbadge loot_fiend'],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const playerBadges = await app.itm.getBadges(message.author.id, serverSideGuildId)
		const badgeToSet = app.parse.badges(args)[0]

		if (args[0] && args[0].toLowerCase() === 'none') {
			if (serverSideGuildId) {
				await app.query(`UPDATE server_scores SET badge = 'none' WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)
			}
			else {
				await app.query(`UPDATE scores SET badge = 'none' WHERE userId = ${message.author.id}`)
			}

			return reply(message, '✅ Successfully cleared your display badge!')
		}
		else if (!badgeToSet) {
			return reply(message, '❌ I don\'t recognize that badge.')
		}
		else if (!playerBadges.includes(badgeToSet)) {
			return reply(message, '❌ You don\'t own that badge!')
		}

		if (serverSideGuildId) {
			await app.query(`UPDATE server_scores SET badge = '${badgeToSet}' WHERE userId = ${message.author.id} AND guildId = ${serverSideGuildId}`)
		}
		else {
			await app.query(`UPDATE scores SET badge = '${badgeToSet}' WHERE userId = ${message.author.id}`)
		}

		await reply(message, `✅ Successfully made ${app.badgedata[badgeToSet].icon}\`${badgeToSet}\` your display badge!`)
	}
}
