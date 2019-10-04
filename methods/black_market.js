const Discord = require("discord.js");
const { query } = require('../mysql.js');
const itemdata = require("../json/completeItemList");
const general = require('./general');
const methods = require('./methods');

class Methods {
    async getListingInfo(listingId){
        const listingRow = (await query(`SELECT * FROM blackmarket WHERE listingId = BINARY "${listingId}"`))[0];
        if(!listingRow) return undefined;

        return {
            listingId: listingId,
            sellerId: listingRow.sellerId,
            item: listingRow.itemName,
            amount: listingRow.quantity,
            price: listingRow.price,
            pricePer: listingRow.pricePer,
            sellerName: listingRow.sellerName,
            listTime: listingRow.listTime
        }
    }

    async soldItem(listingInfo, message){
        const userRow = (await query(`SELECT * FROM scores WHERE userId = ${listingInfo.sellerId}`))[0];

        await query(`DELETE FROM blackmarket WHERE listingId = "${listingInfo.listingId}"`);
        methods.addmoney(listingInfo.sellerId, listingInfo.price);

        if(userRow && userRow.notify1){
            const user = await general.getUserInfo(message, listingInfo.sellerId);
            const notifyEmb = new Discord.RichEmbed()
            .setTitle('Your Item on the Black Market Sold!')
            .addField('Item:', listingInfo.amount + 'x `' + listingInfo.item + '`', true)
            .addField('Amount Recieved:', methods.formatMoney(listingInfo.price), true)
            .setFooter('Listing ID: ' + listingInfo.listingId)
            .setColor('#4CAD4C')

            try{
                await user.send(notifyEmb);
            }
            catch(err){
                // user disabled DMs or removed bot
            }
        }
    }

    createDisplay(searchResults){
        let display = '';
        let header = 'Item               Price          Listing ID'
        for(var i = 0; i < searchResults.length; i++){
            display += (`${searchResults[i].quantity}x ${searchResults[i].itemName}`.padEnd(19, ' ') + `${methods.formatMoney(searchResults[i].price, true)}`.padEnd(15, ' ') + `${searchResults[i].listingId}\n`)
        }

        if(!display.length){
            display = '\nNothing was found...'
        }

        return '```' + header + '\n' + '-'.repeat(header.length) + '\n' + display + '```'
    }
}

module.exports = new Methods();