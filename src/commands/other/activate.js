
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
        if(await app.player.isActive(message.author.id, message.guild.id)){
            return message.reply('❌ Your account is already active on this server!');
        }

        await app.cd.setCD(message.author.id, 'activate', 3600 * 1000);
        await app.player.activate(message.author.id, message.guild.id);
        
        return message.reply('✅ Account activated in this server');

        /*
        // create account for player
        await app.player.createAccount(message.author.id);
        
        // activate account in server
        await app.player.activate(message.author.id, message.guild.id);

        const embedInfo = new app.Embed()
        .setTitle(`Thanks for joining LOOTCORD ${message.member.effectiveName}!`)
        .setColor(14202368)
        .addField("Items Received","**1x** " + app.itemdata['item_box'].icon + "`item_box`")
        .setFooter("Open it with t-use item_box")
        .setImage("https://cdn.discordapp.com/attachments/454163538886524928/525315435382571028/lc_welcome.png")

        message.channel.createMessage(embedInfo);
        */
       
        /*
        if(Object.keys(config.activeRoleGuilds).includes(message.guild.id)){
                    refresher.refreshactives(message);
        }
        */
    },
}