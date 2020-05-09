exports.run = function(guild, member, oldMember){
    if(guild.id === this.config.supportGuildID){
        this.patreonHandler.checkPatron(oldMember, member);
    }
}