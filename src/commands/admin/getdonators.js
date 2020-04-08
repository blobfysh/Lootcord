
module.exports = {
    name: 'getdonators',
    aliases: [''],
    description: "Get a list of all donators.",
    long: "Get a list of all donators.",
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        try{
            let donatedList = [];
            const patrons = await app.query(`SELECT * FROM cooldown WHERE type = 'patron'`);

            
            for(let i = 0; i < patrons.length; i++){
                const user = await app.common.fetchUser(patrons[i].userId, { cacheIPC: false });

                donatedList.push(`${i + 1}. ${user.username}#${user.discriminator} \`${user.id}\``);
            }

            const modMsg = new app.Embed()
            .setAuthor('Donator list')
            .setDescription(donatedList.join('\n') || 'None')
            .setColor('#29ABE0')
            message.channel.createMessage(modMsg);
        }
        catch(err){
            message.reply("Error: ```\n" + err + "```")
        }
    },
}