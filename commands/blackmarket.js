const Discord   = require('discord.js');
const { query } = require('../mysql.js');
const methods   = require('../methods/methods.js');
const general   = require('../methods/general');
const itemdata  = require('../json/completeItemList.json');
const bm_methods = require('../methods/black_market');

module.exports = {
    name: 'blackmarket',
    aliases: ['bm'],
    description: 'Search for Black Market listings by other players.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        let item = general.parseArgsWithSpaces(args[0], args[1], args[2], false, false, false);

        if(!item){
            return message.reply('Search for an item! `bm <item>`');
        }
        const listings = await query(`SELECT * FROM blackmarket WHERE itemName LIKE ? ORDER BY pricePer ASC LIMIT 25`, ['%' + item + '%']);

        const embed = new Discord.RichEmbed()
        .setTitle('🛒 Black Market Listings for: ' + item)
        .setDescription('These listings were made by other players!\n\nPurchase one with `buy <Listing ID>` command (ex. `t-buy Jq0cG_YY`)\n\n**Sorted lowest price to highest:**' + bm_methods.createDisplay(listings))
        .setColor(13215302)

        message.reply(embed);
    },
}