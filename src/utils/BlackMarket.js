
class BlackMarket {
    constructor(app){
        this.app = app;
    }

    async getListingInfo(listingId){
        const listingRow = (await this.app.query(`SELECT * FROM blackmarket WHERE listingId = BINARY "${listingId}"`))[0];
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

    async soldItem(listingInfo){
        const userRow = (await this.app.query(`SELECT * FROM scores WHERE userId = ${listingInfo.sellerId}`))[0];

        await this.app.query(`DELETE FROM blackmarket WHERE listingId = "${listingInfo.listingId}"`);
        this.app.player.addMoney(listingInfo.sellerId, listingInfo.price);

        if(userRow && userRow.notify1){
            const notifyEmb = new this.app.Embed()
            .setTitle('Your Item on the Black Market Sold!')
            .addField('Item:', listingInfo.amount + 'x `' + listingInfo.item + '`', true)
            .addField('Amount Recieved:', this.app.common.formatNumber(listingInfo.price), true)
            .setFooter('Listing ID: ' + listingInfo.listingId)
            .setColor('#4CAD4C')

            try{
                let user = await this.app.common.fetchUser(listingInfo.sellerId, { checkIPC: false });
                let dm = await user.getDMChannel()
                dm.createMessage(notifyEmb);
            }
            catch(err){
                console.log(require('util').inspect(err))
                // user disabled DMs or removed bot
            }
        }
    }

    createDisplay(searchResults){
        let display = '';
        let header = 'Item               Price          Listing ID'
        for(var i = 0; i < searchResults.length; i++){
            display += (`${searchResults[i].quantity}x ${searchResults[i].itemName}`.padEnd(19, ' ') + `${this.app.common.formatNumber(searchResults[i].price, true)}`.padEnd(15, ' ') + `${searchResults[i].listingId}\n`)
        }

        if(!display.length){
            display = '\nNothing was found...'
        }

        return '```' + header + '\n' + '-'.repeat(header.length) + '\n' + display + '```'
    }
}

module.exports = BlackMarket;