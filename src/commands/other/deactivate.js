
module.exports = {
    name: 'deactivate',
    aliases: [''],
    description: "Deactivate your account in a server.",
    long: "Deactivates your account on server it's used in. Deactivating prevents you from being attacked in that server **BUT** also prevents you from being able to attack or use items.",
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const deactivateCD = await app.cd.getCD(message.author.id, 'deactivate');
        const activateCD = await app.cd.getCD(message.author.id, 'activate');
        const attackCD = await app.cd.getCD(message.author.id, 'attack');

        if(deactivateCD) return message.reply('You can only deactivate a server once every 24 hours');

        if(activateCD) return message.reply(`You must wait \`${activateCD}\` after activating in order to deactivate`);
        
        if(attackCD) return message.reply(`You can't deactivate when you still have an attack cooldown!`);
        
        const botMessage = await message.reply('Deactivating your account will prevent you from using commands or being targeted in **this** server.\n`Note : You can only do this once every 24 hours.`\n**Are you sure?**');
        
        try{
            let result = await app.react.getConfirmation(message.author.id, botMessage, 15000);
            
            if(result){

                await app.player.deactivate(message.author.id, message.guild.id);

                await app.cd.setCD(message.author.id, 'deactivate', 86400 * 1000);

                botMessage.edit('Your account has been disabled on this server');

                /* TODO fix the active role in deactivate and play command
                if(Object.keys(config.activeRoleGuilds).includes(message.guild.id)){
                    refresher.refreshactives(message);
                }
                */
            }
            else{
                botMessage.delete();
            }
        }
        catch(err){
            botMessage.edit(`You didn't react in time!`);
        }
    },
}