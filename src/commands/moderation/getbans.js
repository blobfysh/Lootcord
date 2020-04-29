
module.exports = {
    name: 'getbans',
    aliases: [''],
    description: "Get a list of all banned players.",
    long: "Get a list of all banned players.",
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        try{
            let bannedList = [];
            const bans = await app.query(`SELECT * FROM banned`);

            
            for(let i = 0; i < bans.length; i++){
                const user = await app.common.fetchUser(bans[i].userId, { cacheIPC: false });

                bannedList.push(`${i + 1}. ${user.username}#${user.discriminator} (\`${user.id}\`)`);
            }

            const banMsg = new app.Embed()
            .setAuthor('Banned Players')
            .setDescription(bannedList.join('\n') || 'None')
            .setColor(720640)
            message.channel.createMessage(banMsg);
        }
        catch(err){
            message.reply("Error: ```" + err + "```")
        }
    },
}