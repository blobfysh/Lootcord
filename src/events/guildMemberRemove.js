exports.run = function(guild, member){
    /// deactivate user
    this.query(`DELETE FROM userGuilds WHERE userId = ${member.id} AND guildId = ${guild.id}`);
}