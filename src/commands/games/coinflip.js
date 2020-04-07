const WIN_QUOTES = ['You just won {0}!', 'Wow you\'re pretty good at flipping this coin 👀 You won {0}!', 'Congratulations! You just won {0}!'];
const LOSE_QUOTES = ['You just lost {0}!', 'Congratulations! You just lost {0}!'];

module.exports = {
    name: 'coinflip',
    aliases: ['cf'],
    description: 'Flip a coin for a chance to win!',
    long: 'Gamble your money for a 50% chance of winning 2x what you bet!',
    args: {"amount": "Amount of money to gamble."},
    examples: ["cf 1000"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        const coinflipCD = await app.cd.getCD(message.author.id, 'coinflip');
        let gambleAmount = app.parse.numbers(message.args)[0];
        
        if(coinflipCD){
            return message.reply(`You need to wait  \`${coinflipCD}\`  before using this command again`);
        }

        if(!gambleAmount || gambleAmount < 100){
            return message.reply(`Please specify an amount of atleast ${app.common.formatNumber(100)} to gamble!`);
        }

        if(gambleAmount > row.money){
            return message.reply(`You don't have that much money! You currently have ${app.common.formatNumber(row.money)}`);
        }
        
        if(gambleAmount > 1000000){
            return message.reply(`Woah there high roller, you cannot gamble more than ${app.common.formatNumber(1000000)} on coinflip.`);
        }
        
        
        if(Math.random() < 0.5){
            await app.player.addMoney(message.author.id, gambleAmount);
            message.reply(WIN_QUOTES[Math.floor(Math.random() * WIN_QUOTES.length)].replace('{0}', app.common.formatNumber(gambleAmount * 2)));
        }
        else{
            await app.player.removeMoney(message.author.id, gambleAmount);
            message.reply(LOSE_QUOTES[Math.floor(Math.random() * LOSE_QUOTES.length)].replace('{0}', app.common.formatNumber(gambleAmount)));
        }
        
        await app.cd.setCD(message.author.id, 'coinflip', app.config.cooldowns.coinflip * 1000);
    },
}