const QUOTES = [
    'Oh look, I found this {icon}{item} for you!\n\nWant more? Try the `hourly`, `vote` commands.', 
    'Here\'s a free {icon}{item}!\n\nWant more? Try the `hourly`, `vote` commands.', 
    'You earned a free {icon}{item}!\n\nWant more? Try the `hourly`, `vote` commands.'
];

module.exports = {
    name: 'daily',
    aliases: [''],
    description: 'Receive a free ultra_box every day!',
    long: 'Use this command to receive a free ultra_box every day.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const dailyCD = await app.cd.getCD(message.author.id, 'daily');

        if(dailyCD){
            return message.reply(`You've already claimed your daily reward today! Wait \`${dailyCD}\` before claiming another.`);
        }

        const itemCt = await app.itm.getItemCount(await app.itm.getItemObject(message.author.id), await app.player.getRow(message.author.id));
        const hasEnough = await app.itm.hasSpace(itemCt, 1);
        if(!hasEnough) return message.reply(`❌ **You don't have enough space in your inventory!** (You need **1** open slot, you have **${itemCt.open}**)\n\nYou can clear up space by selling some items.`);

        await app.cd.setCD(message.author.id, 'daily', app.config.cooldowns.daily * 1000);

        await app.itm.addItem(message.author.id, 'ultra_box', 1);
        message.reply(QUOTES[Math.floor(Math.random() * QUOTES.length)].replace('{icon}', app.itemdata['ultra_box'].icon).replace('{item}', '`ultra_box`'));
    },
}