exports.run = async function(msg){
    const guild = this.bot.guilds.get(msg.guildId);
    if(guild){
        try{
            await guild.fetchAllMembers();
        }
        catch(err){
            console.warn(err);
        }
    }
}