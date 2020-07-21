
module.exports = {
    name: 'claimdrop',
    aliases: [''],
    description: "Claim a supply_drop.",
    long: "Claim the airdrop in this channel (if there is any).",
    args: {},
    examples: [],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        setTimeout(async () => {
            const guildRow = await app.common.getGuildInfo(message.channel.guild.id);
            if(message.channel.id !== guildRow.dropItemChan || guildRow.dropItem === ''){
                return message.reply('There is no ' + app.itemdata['supply_drop'].icon + '`supply_drop` in this channel.');
            }
            
            const airdropCD = await app.cd.getCD(message.author.id, 'airdrop');

            if(airdropCD){
                return message.reply(`You need to wait \`${airdropCD}\` before claiming another airdrop.`);
            }
            
            const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id), await app.player.getRow(message.author.id));
            const hasEnough = await app.itm.hasSpace(itemCt, 1);
            if(!hasEnough) return message.reply(`❌ **You don't have enough space in your inventory!** (You need **1** open slot, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`);
            
            const guildRow2 = await app.common.getGuildInfo(message.channel.guild.id);
            if(message.channel.id !== guildRow2.dropItemChan || guildRow2.dropItem === ''){
                return message.reply('There is no ' + app.itemdata['supply_drop'].icon + '`supply_drop` in this channel.');
            }

            await app.query(`UPDATE guildInfo SET dropItem = '' WHERE guildId = ${message.channel.guild.id}`);
            await app.query(`UPDATE guildInfo SET dropItemChan = 0 WHERE guildId = ${message.channel.guild.id}`);

            if(await app.patreonHandler.isPatron(message.author.id, 4)) await app.cd.setCD(message.author.id, 'airdrop', Math.floor((app.config.cooldowns.claimdrop * 1000) / 2));
            else await app.cd.setCD(message.author.id, 'airdrop', app.config.cooldowns.claimdrop * 1000);

            await app.itm.addItem(message.author.id, guildRow.dropItem, 1);

            message.reply(`You got the ${app.itemdata[guildRow.dropItem].icon}\`${guildRow.dropItem}\`!`);
        }, Math.floor(Math.random() * 1000) + 1);
    },
}