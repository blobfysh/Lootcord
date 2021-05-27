exports.command = {
	name: 'getbotstats',
	aliases: [],
	description: 'Displays information about the bot.',
	long: 'Displays statistics about the bot.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'addReactions', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const stats = JSON.parse(await app.cache.get('stats')) || {}
		const guildsJoined = await app.cache.get('servers_joined') || 0
		const guildsLeft = await app.cache.get('servers_left') || 0
		const disconnects = await app.cache.get('shards_disconnected') || 0
		const resumes = await app.cache.get('shards_resumed') || 0
		const errors = await app.cache.get('errors') || 0
		const commandsUsed = await app.cache.get('commands') || 0
		const mysqlErrors = await app.cache.get('mysql_errors') || 0
		const statsStart = await app.cache.get('stats_since') || 'unknown'

		const memUsage = stats.totalRam ? stats.totalRam.toFixed(2) : 'unknown'
		const clusters = stats.clusters ? stats.clusters.length : 'unknown'
		const totalServers = stats.guilds ? stats.guilds.toString() : 'unknown'
		const largeGuilds = stats.largeGuilds >= 0 ? stats.largeGuilds.toString() : 'unknown'

		const embedInfo = new app.Embed()
			.setTitle('Lootcord Stats')
			.setColor(13451564)
			.setThumbnail(app.bot.user.avatarURL)
			.setDescription(`Some top secret information right here...\nStats since: ${statsStart !== 'unknown' ? new Date(parseInt(statsStart)).toLocaleString() : 'unknown'}`)
			.addField('Clusters', codeWrap(clusters, 'js'), true)
			.addField('Total Memory Usage', codeWrap(`${memUsage} MB`, 'fix'), true)
			.addField('Cluster ID', codeWrap(app.clusterID.toString(), 'js'), true)
			.addField('Total Servers', codeWrap(totalServers, 'js'), true)
			.addField('Servers Gained', codeWrap(guildsJoined.toString(), 'js'), true)
			.addField('Servers Lost', codeWrap(guildsLeft.toString(), 'js'), true)
			.addField('Shard Disconnects', codeWrap(disconnects.toString(), 'js'), true)
			.addField('Shards Resumed', codeWrap(resumes.toString(), 'js'), true)
			.addField('Commands Called', codeWrap(commandsUsed, 'js'), true)
			.addField('MySQL Errors', codeWrap(mysqlErrors, 'js'), true)
			.addField('API Errors', codeWrap(errors.toString(), 'js'), true)
			.addField('Large Guilds', codeWrap(largeGuilds, 'js'), true)
		message.channel.createMessage(embedInfo)
	}
}

function codeWrap (input, code) {
	return `\`\`\`${code}\n${input}\`\`\``
}
