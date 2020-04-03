
module.exports = {
    name: 'claimdrop',
    aliases: [''],
    description: "Claim a `care_package` drop.",
    long: "Claim the airdrop in this channel (if there is any).",
    args: {},
    examples: ["claimdrop"],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const guildInfo = await app.query(`SELECT * FROM guildInfo WHERE guildId = ${message.guild.id}`);
        const airdropCD = await app.cd.getCD(message.author.id, 'airdrop');
        const hasEnough = await app.itm.hasSpace(message.author.id, 1);
    
        if(message.channel.id !== guildInfo[0].dropItemChan){
            return message.reply('There is no ' + app.itemdata['care_package'].icon + '`care_package` in this channel.');
        }
        
        if(guildInfo[0].dropItem == ''){
            return message.reply('There is no lootable ' + app.itemdata['care_package'].icon + '`care_package`.');
        }
        
        if(airdropCD){
            return message.reply(`You need to wait \`${airdropCD}\` before claiming another airdrop.`);
        }
        
        if(!hasEnough) return message.reply("❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.");
        
        await app.query(`UPDATE guildInfo SET dropItem = '' WHERE guildId = ${message.guild.id}`);
        await app.query(`UPDATE guildInfo SET dropItemChan = 0 WHERE guildId = ${message.guild.id}`);
        await app.cd.setCD(message.author.id, 'airdrop', app.config.cooldowns.claimdrop * 1000);
        await app.itm.addItem(message.author.id, guildInfo[0].dropItem, 1);

        message.reply(`You got the ${app.itemdata[guildInfo[0].dropItem].icon}\`${guildInfo[0].dropItem}\`!`);
    },
}