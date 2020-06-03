const QUOTES = [
    '✨ Oh look, I found 4x {icon}{item}\'s for you!', 
    '{ez} Here\'s 4x free {icon}{item}\'s!'
];

module.exports = {
    name: 'monthly',
    aliases: [''],
    description: 'Receive 4 free care_package\'s every month!',
    long: 'Use this command to receive 4x care_package\'s once a month.\n\nThe monthly command is exclusive to patreon donators: https://www.patreon.com/lootcord.',
    args: {},
    examples: [],
    ignoreHelp: false,
    premiumCmd: true,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    patronTier1Only: true,
    
    async execute(app, message){
        const monthlyCD = await app.cd.getCD(message.author.id, 'monthly');

        if(monthlyCD){
            return message.reply(`You've already claimed your monthly reward! Wait \`${monthlyCD}\` before claiming again.`);
        }

        const hasEnough = await app.itm.hasSpace(message.author.id, 4);
        if(!hasEnough) return message.reply(`❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.`);

        await app.cd.setCD(message.author.id, 'monthly', app.config.cooldowns.daily * 1000 * 30);

        await app.itm.addItem(message.author.id, 'care_package', 4);
        message.reply(QUOTES[Math.floor(Math.random() * QUOTES.length)].replace('{ez}', app.icons.blackjack_dealer_neutral).replace('{icon}', app.itemdata['care_package'].icon).replace('{item}', '`care_package`'));
    },
}