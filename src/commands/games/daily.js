const QUOTES = [
    'Oh look, I found this {icon}{item} for you!', 
    'Here\'s a free {icon}{item}!', 
    'This {icon}{item} has some insane loot inside it.'
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
            return message.reply(`You need to wait \`${dailyCD}\` before using this command again.`);
        }

        const hasEnough = await app.itm.hasSpace(message.author.id, 1);
        if(!hasEnough) return message.reply(`❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.`);

        await app.cd.setCD(message.author.id, 'daily', app.config.cooldowns.daily * 1000);

        await app.itm.addItem(message.author.id, 'ultra_box', 1);
        message.reply(QUOTES[Math.floor(Math.random() * QUOTES.length)].replace('{icon}', app.itemdata['ultra_box'].icon).replace('{item}', '`ultra_box`'));
    },
}