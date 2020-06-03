const QUOTES = [
    '✨ Oh look, I found this {icon}{item} for you!', 
    '{ez} Here\'s a free {icon}{item}!'
];

module.exports = {
    name: 'weekly',
    aliases: [''],
    description: 'Receive a free care_package every week!',
    long: 'Use this command to receive a free care_package every week.\n\nThe weekly command is exclusive to patreon donators: https://www.patreon.com/lootcord.',
    args: {},
    examples: [],
    ignoreHelp: false,
    premiumCmd: true,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    patronTier1Only: true,
    
    async execute(app, message){
        const weeklyCD = await app.cd.getCD(message.author.id, 'weekly');

        if(weeklyCD){
            return message.reply(`You've already claimed your weekly reward! Wait \`${weeklyCD}\` before claiming again.`);
        }

        const hasEnough = await app.itm.hasSpace(message.author.id, 1);
        if(!hasEnough) return message.reply(`❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.`);

        await app.cd.setCD(message.author.id, 'weekly', app.config.cooldowns.daily * 1000 * 7);

        await app.itm.addItem(message.author.id, 'care_package', 1);
        message.reply(QUOTES[Math.floor(Math.random() * QUOTES.length)].replace('{ez}', app.icons.blackjack_dealer_neutral).replace('{icon}', app.itemdata['care_package'].icon).replace('{item}', '`care_package`'));
    },
}