
module.exports = {
    name: 'activate',
    aliases: ['play'],
    description: "Activate your account!",
    long: "Activates your account on the server.",
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        if(await app.player.isActive(message.author.id, message.channel.guild.id)){
            return message.reply('❌ Your account is already active on this server!');
        }

        await app.cd.clearCD(message.author.id, 'activate');
        await app.cd.setCD(message.author.id, 'activate', 3600 * 1000);
        await app.player.activate(message.author.id, message.channel.guild.id);
        
        if(Object.keys(app.config.activeRoleGuilds).includes(message.channel.guild.id)){
            try{
                message.member.addRole(app.config.activeRoleGuilds[message.channel.guild.id].activeRoleID);
            }
            catch(err){
                console.warn('Failed to add active role.');
            }
        }

        return message.reply('✅ Account activated in this server');

        /*
        // create account for player
        await app.player.createAccount(message.author.id);
        
        // activate account in server
        await app.player.activate(message.author.id, message.channel.guild.id);

        const embedInfo = new app.Embed()
        .setTitle(`Thanks for joining LOOTCORD ${message.member.nick || message.member.username}!`)
        .setColor(14202368)
        .addField("Items Received","**1x** " + app.itemdata['item_box'].icon + "`item_box`")
        .setFooter("Open it with t-use item_box")
        .setImage("https://cdn.discordapp.com/attachments/454163538886524928/525315435382571028/lc_welcome.png")

        message.channel.createMessage(embedInfo);
        */
       
        /*
        if(Object.keys(config.activeRoleGuilds).includes(message.channel.guild.id)){
                    refresher.refreshactives(message);
        }
        */
    },
}