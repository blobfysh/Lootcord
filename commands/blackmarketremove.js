const Discord   = require('discord.js');
const { query } = require('../mysql.js');
const methods   = require('../methods/methods.js');
const general   = require('../methods/general');
const itemdata  = require('../json/completeItemList.json');
const shortid   = require('shortid');
const bm_methods = require('../methods/black_market');

module.exports = {
    name: 'blackmarketremove',
    aliases: ['bmremove', 'bmrecall'],
    description: 'Remove a listing from the Black Market.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        if(shortid.isValid(args[0])){
            const listing = await bm_methods.getListingInfo(args[0]);

            if(!listing){
                message.reply('I could not find a listing with that ID. You can check your listings and their IDs with `bmlistings`');
            }
            else if(listing.sellerId !== message.author.id){
                message.reply('You do not own that listing! You can check your listings and their IDs with `bmlistings`');
            }
            else if(!await methods.hasenoughspace(message.author.id, listing.amount)){
                message.reply('Not enough space');
            }
            else{
                query(`DELETE FROM blackmarket WHERE listingId = '${listing.listingId}'`);
                methods.additem(message.author.id, listing.item, listing.amount);
                message.reply(`Successfuly removed (\`${listing.listingId}\`) **${listing.amount}x** \`${listing.item}\` from the Black Market. You can find them in your inventory.`);
            }
        }
        else{
            message.reply('I could not find a listing with that ID. You can check your listings and their IDs with `bmlistings`');
        }
    },
}