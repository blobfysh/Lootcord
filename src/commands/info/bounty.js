
module.exports = {
    name: 'bounty',
    aliases: ['bounties', 'bountys'],
    description: 'Displays the bounty present in the channel, if there is one.',
    long: 'Displays the bounty present in the channel, if there is one.\n\nBounties are like raid bosses, you can fight them for loot, or die trying.\n\nThe bounty system is exclusive to patreon donators: https://www.patreon.com/lootcord.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const monsterRow = await app.mysql.select('spawnChannels', 'channelId', message.channel.id);
        const monsterSpawn = await app.mysql.select('spawns', 'channelId', message.channel.id);

        if(!monsterRow && !monsterSpawn) return message.reply("❌ There are no bounties in this channel.");
        else if(monsterRow && !monsterSpawn) return message.reply("❌ There are no bounties in this channel, but something tells me one may arrive soon...");
        
        const mobEmbed = await app.monsters.genMobEmbed(message.channel.id, app.mobdata[monsterSpawn.monster], monsterSpawn.health, monsterSpawn.money);
        message.channel.createMessage(mobEmbed);
    },
}