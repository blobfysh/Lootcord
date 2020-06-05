
module.exports = {
    name: 'claimdrop',
    aliases: [''],
    description: "Claim a `care_package` drop.",
    long: "Claim the airdrop in this channel (if there is any).",
    args: {},
    examples: [],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const guildRow = await app.common.getGuildInfo(message.channel.guild.id);
        const airdropCD = await app.cd.getCD(message.author.id, 'airdrop');
        const hasEnough = await app.itm.hasSpace(message.author.id, 1);
    
        if(message.channel.id !== guildRow.dropItemChan){
            return message.reply('There is no ' + app.itemdata['care_package'].icon + '`care_package` in this channel.');
        }
        
        if(guildRow.dropItem === ''){
            return message.reply('There is no lootable ' + app.itemdata['care_package'].icon + '`care_package`.');
        }
        
        if(airdropCD){
            return message.reply(`You need to wait \`${airdropCD}\` before claiming another airdrop.`);
        }
        
        if(!hasEnough) return message.reply("❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.");
        
        await app.query(`UPDATE guildInfo SET dropItem = '' WHERE guildId = ${message.channel.guild.id}`);
        await app.query(`UPDATE guildInfo SET dropItemChan = 0 WHERE guildId = ${message.channel.guild.id}`);

        if(await app.patreonHandler.isPatron(message.author.id, 4)) await app.cd.setCD(message.author.id, 'airdrop', Math.floor((app.config.cooldowns.claimdrop * 1000) / 2));
        else await app.cd.setCD(message.author.id, 'airdrop', app.config.cooldowns.claimdrop * 1000);

        await app.itm.addItem(message.author.id, guildRow.dropItem, 1);

        message.reply(`You got the ${app.itemdata[guildRow.dropItem].icon}\`${guildRow.dropItem}\`!`);
    },
}