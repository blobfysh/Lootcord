const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'shardsinfo',
	aliases: ['shardinfo'],
	description: 'Displays information about all shards.',
	long: 'Displays information about all shards.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const stats = JSON.parse(await app.cache.get('stats'))

		if (!stats) return reply(message, '❌ Shard info not ready')

		const shardInfo = new app.Embed()
			.setTitle('Shards')
			.setDescription(`Total clusters - ${stats.clusters.length}\nTotal shards - ${stats.clusters.map(cluster => cluster.shards).reduce((a, b) => a + b)}`)

		for (const cluster of stats.clusters) {
			for (const shard of cluster.shardsStats) {
				shardInfo.addField(`Shard ${shard.id}`, codeWrap(`Status: ${shard.status === 'ready' ? '✅' : '❌'}\nCluster: ${cluster.cluster}\nGuilds: ${cluster.guilds}\nUptime: ${app.cd.convertTime(cluster.uptime)}\nLatency: ${shard.latency}`, 'js'), true)
			}
		}

		await message.channel.createMessage(shardInfo)
	}
}

function codeWrap (input, code) {
	return `\`\`\`${code}\n${input}\`\`\``
}
