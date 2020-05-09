
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
            let kofiList = [];
            let patreonTier1List = [];
            let patreonTier2List = [];

            const kofiPatrons = await app.query(`SELECT * FROM cooldown WHERE type = 'patron'`);

            // patreon patrons
            const tier1Patrons = await app.query(`SELECT * FROM patrons WHERE tier = 1`);
            const tier2Patrons = await app.query(`SELECT * FROM patrons WHERE tier = 2`);

            
            for(let i = 0; i < kofiPatrons.length; i++){
                const user = await app.common.fetchUser(kofiPatrons[i].userId, { cacheIPC: false });

                kofiList.push(`${i + 1}. ${user.username}#${user.discriminator} (${user.id})`);
            }

            for(let i = 0; i < tier1Patrons.length; i++){
                const user = await app.common.fetchUser(tier1Patrons[i].userId, { cacheIPC: false });

                patreonTier1List.push(`${i + 1}. ${user.username}#${user.discriminator} (${user.id})`);
            }
            
            for(let i = 0; i < tier2Patrons.length; i++){
                const user = await app.common.fetchUser(tier2Patrons[i].userId, { cacheIPC: false });

                patreonTier2List.push(`${i + 1}. ${user.username}#${user.discriminator} (${user.id})`);
            }

            const modMsg = new app.Embed()
            .setAuthor('Donator list')
            .addField('Ko-fi Donators', '```\n' + (kofiList.join('\n') || 'None') + '```')
            .addField('Patreon Tier 1 Donators', '```\n' + (patreonTier1List.join('\n') || 'None') + '```')
            .addField('Patreon Tier 2 Donators', '```\n' + (patreonTier2List.join('\n') || 'None') + '```')
            .setColor('#29ABE0')
            message.channel.createMessage(modMsg);
        }
        catch(err){
            message.reply("Error: ```\n" + err + "```")
        }
    },
}