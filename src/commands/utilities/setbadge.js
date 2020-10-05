module.exports = {
	name: 'setbadge',
	aliases: [''],
	description: 'Sets a badge to display.',
	long: 'Sets your display badge. This badge will be displayed next to your name on the leaderboard, active player list, clan member list, random attack selection list, and more.',
	args: { badge: 'Badge to display' },
	examples: ['setbadge loot_fiend'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message) {
		const playerBadges = await app.itm.getBadges(message.author.id)
		const badgeToSet = app.parse.badges(message.args)[0]

		if (message.args[0] && message.args[0].toLowerCase() === 'none') {
			await app.query(`UPDATE scores SET badge = 'none' WHERE userId = ${message.author.id}`)

			return message.reply('✅ Successfully cleared your display badge!')
		}
		else if (!badgeToSet) {
			return message.reply('❌ I don\'t recognize that badge.')
		}
		else if (!playerBadges.includes(badgeToSet)) {
			return message.reply('❌ You don\'t own that badge!')
		}

		await app.query(`UPDATE scores SET badge = '${badgeToSet}' WHERE userId = ${message.author.id}`)

		message.reply(`✅ Successfully made ${app.badgedata[badgeToSet].icon}\`${badgeToSet}\` your display badge!`)
	}
}
