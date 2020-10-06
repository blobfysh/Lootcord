module.exports = {
	name: 'disablespawns',
	aliases: ['disablebounty', 'disablespawn'],
	description: 'Stop your active spawn channels.',
	long: 'Stop all active spawn channels you created. Using this will not cause any existing enemies to leave, only prevent future spawns.',
	args: {},
	examples: [],
	ignoreHelp: false,
	premiumCmd: true,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,
	patronTier1Only: false,

	async execute(app, message, { args, prefix }) {
		const userSpawns = await app.mysql.select('spawnChannels', 'userId', message.author.id, true)
		if (userSpawns.length === 0) return message.reply('❌ You don\'t have any active spawn channels. You can spawn enemies with `enablespawns`.')

		for (let i = 0; i < userSpawns.length; i++) {
			await app.cd.clearCD(userSpawns[i].channelId, 'spawnCD')
			await app.query('DELETE FROM spawnChannels WHERE channelId = ?', [userSpawns[i].channelId])
		}

		message.reply(`✅ Successfully stopped \`${userSpawns.length}\` active spawn channels.`)
	}
}
