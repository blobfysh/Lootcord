const shortid   = require('shortid');

module.exports = {
    name: 'blackmarketremove',
    aliases: ['bmremove', 'bmrecall'],
    description: 'Remove a listing from the Black Market.',
    long: 'Remove a listing from the Black Market.',
    args: {"listing ID": "ID of listing you want to remove."},
    examples: ["bmremove Jq0cG_YY"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        if(shortid.isValid(message.args[0])){
            const listing = await app.bm.getListingInfo(message.args[0]);

            if(!listing){
                message.reply('I could not find a listing with that ID. You can check your listings and their IDs with `bmlistings`');
            }
            else if(listing.sellerId !== message.author.id){
                message.reply('You do not own that listing! You can check your listings and their IDs with `bmlistings`');
            }
            else if(!await app.itm.hasSpace(message.author.id, listing.amount)){
                message.reply('Not enough inventory space');
            }
            else{
                await app.query(`DELETE FROM blackmarket WHERE listingId = '${listing.listingId}'`);
                await app.itm.addItem(message.author.id, listing.item, listing.amount);
                message.reply(`Successfully removed (\`${listing.listingId}\`) **${listing.amount}x** \`${listing.item}\` from the Black Market. You can find them in your inventory.`);
            }
        }
        else{
            message.reply('I could not find a listing with that ID. You can check your listings and their IDs with `bmlistings`');
        }
    },
}