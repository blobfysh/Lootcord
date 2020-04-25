
module.exports = {
    name: 'bounties',
    aliases: ['bountys', 'bounty'],
    description: 'Show a list of available bounties.',
    long: 'Show a list of available bounties. Hunt down bounties for rare loot and earn some money.\nCurrently bounties are exclusive to the official Lootcord server.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const monsterRow = await app.mysql.select('spawns', 'channelId', message.channel.id);
        if(!monsterRow) return message.reply("❌ There are no bounties in this channel.");
        
        const mobEmbed = await app.monsters.genMobEmbed(message.channel.id, app.mobdata[monsterRow.monster], monsterRow.health, monsterRow.money);
        message.channel.createMessage(mobEmbed);
    },
}