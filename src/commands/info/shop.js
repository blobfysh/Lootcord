const max_items_per_page = 16;

module.exports = {
    name: 'shop',
    aliases: ['store','market', 'outpost'],
    description: 'Shows all items that can be bought.',
    long: 'Visit the Outpost and see what items can be bought. Occasionally, steam keys may be displayed for sale on the home page.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,

    async execute(app, message){
        let allItems = Object.keys(app.itemdata).filter(item => app.itemdata[item].buy.currency !== undefined).sort((a, b) => {
            let aCurr = app.itemdata[a].buy.currency;
            let bCurr = app.itemdata[b].buy.currency;

            if(aCurr === 'scrap' && bCurr === 'money') return -1
            else if(aCurr === 'money' && bCurr === 'scrap') return 1
            else{
                return a.localeCompare(b);
            }
        });

        app.react.paginate(message, await generatePages(app, allItems, message.prefix, max_items_per_page));
    },
}

// returns an array of embeds
async function generatePages(app, allItems, prefix, itemsPerPage){
    let pages = [];
    let maxPage = Math.ceil(allItems.length/itemsPerPage);

    pages.push(await getHomePage(app, prefix));
    
    for(let i = 1; i < maxPage + 1; i++){
        let indexFirst = (itemsPerPage * i) - itemsPerPage;
        let indexLast = (itemsPerPage * i) - 1;
        let filteredItems = allItems.slice(indexFirst, indexLast);

        const pageEmbed = new app.Embed()
        .setTitle('The Outpost Shop')
        .setDescription('Use `' + prefix + 'buy <item>` to purchase.\n\nCan\'t find the item you want? Try searching the black market: `' + prefix + 'bm <item>`.')
        .setColor(13451564)

        for(let item of filteredItems){
            let itemBuyCurr = app.itemdata[item].buy.currency;

            if(itemBuyCurr !== undefined && (itemBuyCurr === 'money' || itemBuyCurr === 'scrap')){
                pageEmbed.addField(app.itemdata[item].icon + '`' + item + '`', 'Price: ' + app.common.formatNumber(app.itemdata[item].buy.amount, false, itemBuyCurr === 'scrap' ? true : false), true)
            }
        }

        pages.push(pageEmbed);
    }
    
    return pages;
}

// checks if any steam keys are for sale
async function getHomePage(app, prefix){
    const shopRows = await app.query(`SELECT * FROM shopData`);
    const exchangeRate = await app.cache.get('scrapExchangeRate');

    const firstEmbed = new app.Embed()
    firstEmbed.setTitle(`Welcome to the Outpost!`);
    firstEmbed.setDescription('Use `' + prefix + 'buy <item>` to purchase.\n\nWe\'ll sell you Scrap for your Lootcoin! (`' + prefix + 'buy scrap <amount>`)');
    firstEmbed.setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/733741460868038706/outpost_shop_small.png");
    firstEmbed.setColor(13451564);
    firstEmbed.addField('Scrap Exchange', '**' + app.common.formatNumber(Math.floor(exchangeRate * 100)) + '** Lootcoin → ' + app.icons.scrap + ' **100** Scrap')

    for(let shopRow of shopRows){
        let display = app.itemdata[shopRow.item] ? app.itemdata[shopRow.item].icon + ' ' + shopRow.itemDisplay : shopRow.itemDisplay;

        if(shopRow !== null){
            if(shopRow.itemCurrency === "money"){
                firstEmbed.addField(display, "Price: " + app.common.formatNumber(shopRow.itemPrice) + " | **" + shopRow.itemAmount + "** left! Use `" + prefix + "buy " + shopRow.itemName + "` to purchase!");
            }
            else if(shopRow.itemCurrency === "scrap"){
                firstEmbed.addField(display, "Price: " + app.common.formatNumber(shopRow.itemPrice, false, true) + " | **" + shopRow.itemAmount + "** left! Use `" + prefix + "buy " + shopRow.itemName + "` to purchase!");
            }
            else{
                firstEmbed.addField(display, "Price: " + shopRow.itemPrice + "x " + app.itemdata[shopRow.itemCurrency].icon + "`" + shopRow.itemCurrency + "` | **" + shopRow.itemAmount + "** left! Use `" + prefix + "buy " + shopRow.itemName + "` to purchase!");
            }
        }
    }
    
    return firstEmbed;
}