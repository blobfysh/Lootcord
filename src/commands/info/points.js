const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'points',
	aliases: ['xp'],
	description: 'Shows experience towards the next level.',
	long: 'Shows your current experience towards the next level.',
	args: {},
	examples: [],
	permissions: ['sendMessages'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const row = await app.player.getRow(message.author.id, serverSideGuildId)
		const xp = app.common.calculateXP(row.points, row.level)

		await reply(message, `You currently have **${xp.curLvlXp} / ${xp.neededForLvl}** XP towards level **${row.level + 1}**.`)
	}
}
