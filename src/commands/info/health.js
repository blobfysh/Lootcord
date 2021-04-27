module.exports = {
	name: 'health',
	aliases: ['hp'],
	description: 'Displays current health.',
	long: 'Displays your current health and your maximum possible health.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)

		let healthStr = `You currently have: ${app.player.getHealthIcon(row.health, row.maxHealth)} **${row.health} / ${row.maxHealth}** HP (Gain more with the \`upgrade\` command)\n\n__**Effects**__`

		if (row.bleed > 0) {
			healthStr += `\n🩸 Bleeding: **${row.bleed}** (-5 HP per 5 mins)`
		}
		if (row.burn > 0) {
			healthStr += `\n🔥 Burning: **${row.burn}** (-3 HP per 5 mins)`
		}

		if (row.bleed === 0 && row.burn === 0) {
			healthStr += '\nNone, effects such as bleeding or burning will show here.'
		}

		message.reply(healthStr)
	}
}
