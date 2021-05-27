exports.run = async function (guild) {
	this.cache.incr('servers_left')

	// remove guild from tables
	await this.query(`DELETE FROM userguilds WHERE guildId = ${guild.id}`)
	await this.query(`DELETE FROM guildprefix WHERE guildId ="${guild.id}"`)
	await this.cache.del(`prefix|${guild.id}`)
	await this.query(`DELETE FROM guildinfo WHERE guildId ="${guild.id}"`)
}
