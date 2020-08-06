exports.run = async function(guild){
    await this.cache.incr('servers_joined');

    if(await this.cd.getCD(guild.id, 'guildbanned')) guild.leave();
}