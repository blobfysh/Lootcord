exports.run = async function (guild) {
	this.cache.incr('servers_left')

	// remove guild from tables
	await this.query(`DELETE FROM userguilds WHERE guildId = ${guild.id}`)
	await this.query(`DELETE FROM guildprefix WHERE guildId ="${guild.id}"`)
	await this.cache.del(`prefix|${guild.id}`)
	await this.query(`DELETE FROM guildinfo WHERE guildId ="${guild.id}"`)

	const guildEmbed = new this.Embed()
		.setTitle('Left Server')
		.setDescription(`**Name**: ${guild.name}\n` +
			`**ID**: ${guild.id}\n` +
			`**Joined**: ${this.common.getShortDate(guild.joinedAt)}`)
		.setColor(16734296)

	this.messager.messageLogs(guildEmbed)
}
