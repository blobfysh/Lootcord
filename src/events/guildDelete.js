exports.run = function(guild){
    this.cache.incr('servers_left');

    // remove guild from tables
    this.query(`DELETE FROM guildPrefix WHERE guildId ="${guild.id}"`);
    this.query(`DELETE FROM guildInfo WHERE guildId ="${guild.id}"`);
}