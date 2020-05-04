const QUOTES = [
    'Oh look, I found this {icon}{item} for you!', 
    'Here\'s a free {icon}{item}!',
    'Here\'s your hourly {icon}{item}!'
];

module.exports = {
    name: 'hourly',
    aliases: ['hour'],
    description: 'Receive a free item_box every hour!',
    long: 'Use this command to receive a free item_box every hour.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const hourlyCD = await app.cd.getCD(message.author.id, 'hourly');

        if(hourlyCD){
            return message.reply(`You need to wait \`${hourlyCD}\` before collecting another hourly reward.`);
        }

        const hasEnough = await app.itm.hasSpace(message.author.id, 1);
        if(!hasEnough) return message.reply(`❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.`);

        await app.cd.setCD(message.author.id, 'hourly', app.config.cooldowns.hourly * 1000);
        
        const row = await app.player.getRow(message.author.id);

        let luck = row.luck >= 40 ? 10 : Math.floor(row.luck/4);
        let chance = Math.floor(Math.random() * 100) + luck;
        
        if(chance >= 100){
            await app.itm.addItem(message.author.id, 'ultra_box', 1);
            message.reply("🍀 **How lucky!** You earned a free " + app.itemdata['ultra_box'].icon + "`ultra_box`!");
        }
        else{
            await app.itm.addItem(message.author.id, 'item_box', 1);
            message.reply(QUOTES[Math.floor(Math.random() * QUOTES.length)].replace('{icon}', app.itemdata['item_box'].icon).replace('{item}', '`item_box`'));
        }
    },
}