module.exports = {
	name: 'enablespawns',
	aliases: ['enablebounty', 'enablespawn'],
	description: 'Lure strong enemies to your server.',
	long: 'Lure strong enemies to randomly spawn in this channel. Defeat them to steal their items and Lootcoin!\nUser **MUST** have the Manage Server permission.',
	args: {},
	examples: [],
	ignoreHelp: false,
	premiumCmd: true,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: true,
	patronTier1Only: false,

	async execute(app, message) {
		const userSpawns = await app.mysql.select('spawnChannels', 'userId', message.author.id, true)
		const tier3Patron = await app.patreonHandler.isPatron(message.author.id, 3)
		const tier2Patron = await app.cd.getCD(message.author.id, 'patron2')

		if (!app.sets.adminUsers.has(message.author.id)) {
			if (userSpawns.length >= 1 && !tier3Patron && !tier2Patron) return message.reply('❌ You already have spawns active!\n\nYou are limited to **1** spawn channel. If you would like to disable your active spawns, use `disablespawns`.')
			else if (userSpawns.length >= 2 && !tier3Patron) return message.reply('❌ You already have spawns active!\n\nYou are limited to **2** spawn channels. If you would like to disable your active spawns, use `disablespawns`.')
			else if (userSpawns.length >= 3) return message.reply('❌ You already have spawns active!\n\nYou are limited to **3** spawn channels. If you would like to disable your active spawns, use `disablespawns`.')
		}

		const channelSpawns = await app.mysql.select('spawnChannels', 'channelId', message.channel.id, true)
		if (channelSpawns.length > 0) return message.reply('❌ There are already spawns active in this channel.\n\nYou **CAN** call multiple spawns per server, they just have to be in different channels.')

		const guildSpawns = await app.mysql.select('spawnChannels', 'guildId', message.channel.guild.id, true)
		if (guildSpawns.length > 0 && !await app.patreonHandler.isPatron(message.author.id)) return message.reply('❌ You can only set 1 spawn channel per guild without being a patron. Consider supporting Lootcord on Patreon: https://www.patreon.com/lootcord')

		await app.query('INSERT INTO spawnChannels (channelId, guildId, userId) VALUES (?, ?, ?)', [message.channel.id, message.channel.guild.id, message.author.id])

		await app.monsters.initSpawn(message.channel.id)

		message.reply(`✅ Enemies will soon spawn here... You can use \`${message.prefix}enemy\` to get spawn information.`)
	}
}
