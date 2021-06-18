exports.run = async function (guild) {
	await this.cache.incr('servers_joined')

	if (await this.cd.getCD(guild.id, 'guildbanned')) guild.leave()

	const guildEmbed = new this.Embed()
		.setTitle('Joined Server')
		.setDescription(`**Name**: ${guild.name}\n` +
			`**ID**: ${guild.id}\n` +
			`**Members**: ${guild.memberCount}`)
		.setColor(9043800)

	this.messager.messageLogs(guildEmbed)
}
