exports.run = async function(guild){
    this.cache.incr('servers_left');

    // remove guild from tables
    await this.query(`DELETE FROM userGuilds WHERE guildId = ${guild.id}`);
    await this.query(`DELETE FROM guildPrefix WHERE guildId ="${guild.id}"`);
    await this.cache.del(`prefix|${guild.id}`);
    await this.query(`DELETE FROM guildInfo WHERE guildId ="${guild.id}"`);
}