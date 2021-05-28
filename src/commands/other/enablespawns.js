const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'enablespawns',
	aliases: ['enablebounty', 'enablespawn'],
	description: 'Lure strong enemies to your server.',
	long: 'Lure strong enemies to randomly spawn in this channel. Defeat them to steal their items and scrap!\nUser **MUST** have the Manage Server permission.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: true,
	premiumCmd: true,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: true,
	patronTier1Only: true,

	async execute (app, message, { args, prefix, guildInfo }) {
		const userSpawns = await app.mysql.select('spawnchannels', 'userId', message.author.id, true)
		const tier3Patron = await app.patreonHandler.isPatron(message.author.id, 3)
		const tier2Patron = await app.cd.getCD(message.author.id, 'patron2')

		if (!app.sets.adminUsers.has(message.author.id)) {
			if (userSpawns.length >= 1 && !tier3Patron && !tier2Patron) return reply(message, '❌ You already have spawns active!\n\nYou are limited to **1** spawn channel. If you would like to disable your active spawns, use `disablespawns`.')
			else if (userSpawns.length >= 2 && !tier3Patron) return reply(message, '❌ You already have spawns active!\n\nYou are limited to **2** spawn channels. If you would like to disable your active spawns, use `disablespawns`.')
			else if (userSpawns.length >= 3) return reply(message, '❌ You already have spawns active!\n\nYou are limited to **3** spawn channels. If you would like to disable your active spawns, use `disablespawns`.')
		}

		const channelSpawns = await app.mysql.select('spawnchannels', 'channelId', message.channel.id, true)
		if (channelSpawns.length > 0) return reply(message, '❌ There are already spawns active in this channel.\n\nYou **CAN** call multiple spawns per server, they just have to be in different channels.')

		const guildSpawns = await app.mysql.select('spawnchannels', 'guildId', message.channel.guild.id, true)
		if (guildSpawns.length > 0 && !await app.patreonHandler.isPatron(message.author.id)) return reply(message, '❌ You can only set 1 spawn channel per guild without being a patron. Consider supporting Lootcord on Patreon: https://www.patreon.com/lootcord')

		await app.query('INSERT INTO spawnchannels (channelId, guildId, userId) VALUES (?, ?, ?)', [message.channel.id, message.channel.guild.id, message.author.id])

		await app.monsters.initSpawn(message.channel.id)

		await reply(message, `✅ Enemies will soon spawn here... You can use \`${prefix}enemy\` to get spawn information.`)
	}
}
