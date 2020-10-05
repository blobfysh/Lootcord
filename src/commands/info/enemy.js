module.exports = {
	name: 'enemy',
	aliases: ['bounty', 'boss', 'spawn', 'spawns'],
	description: 'Displays the enemy present in the channel, if there is one.',
	long: 'Displays the enemy present in the channel, if there is one.\n\nEnemy spawns are like raid bosses, you can fight them for loot, or die trying.\n\nThe spawn system is exclusive to patreon donators: https://www.patreon.com/lootcord.',
	args: {},
	examples: [],
	ignoreHelp: false,
	premiumCmd: true,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message) {
		const monsterRow = await app.mysql.select('spawnChannels', 'channelId', message.channel.id)
		const monsterSpawn = await app.mysql.select('spawns', 'channelId', message.channel.id)

		if (!monsterRow && !monsterSpawn) { return message.reply('❌ Enemies won\'t spawn in this channel.') }
		else if (monsterRow && !monsterSpawn) {
			return message.reply(`❌ There are no enemies spawned in this channel, but something tells me one may arrive **${await app.cd.getCD(message.channel.id, 'spawnCD', { getEstimate: true })}...**`)
		}

		const mobEmbed = await app.monsters.genMobEmbed(message.channel.id, app.mobdata[monsterSpawn.monster], monsterSpawn.health, monsterSpawn.money)
		message.channel.createMessage(mobEmbed)
	}
}
