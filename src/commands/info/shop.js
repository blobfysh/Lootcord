const max_items_per_page = 16;

module.exports = {
    name: 'shop',
    aliases: ['store','market'],
    description: 'Shows all buy and sell prices for items.',
    long: 'Show the market of all items that can be bought or sold. Occasionally, steam keys may be displayed for sale on the home page.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,

    async execute(app, message){
        let allItems = Object.keys(app.itemdata).filter(item => app.itemdata[item].buy.currency !== undefined).sort(app.itm.sortItemsLowHigh.bind(app));

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
        .setTitle('Item Shop')
        .setDescription('Use `' + prefix + 'buy <item>` to purchase.\n\nCan\'t find the item you want? Try searching the black market: `' + prefix + 'bm <item>`.')
        .setColor(13215302)

        for(let item of filteredItems){
            let itemBuyCurr = app.itemdata[item].buy.currency;
            let itemSellPrice = app.itemdata[item].sell;

            if(itemBuyCurr !== undefined && itemBuyCurr == 'money' && itemSellPrice !== ''){
                pageEmbed.addField(app.itemdata[item].icon + '`' + item + '`', app.common.formatNumber(app.itemdata[item].buy.amount), true)
            }
            /*
            else if(itemSellPrice !== ""){
                pageEmbed.addField(app.itemdata[item].icon + '`' + item + '`', '📤 ' + app.common.formatNumber(itemSellPrice, true), true)
            }
            */
        }

        pages.push(pageEmbed);
    }
    
    return pages;
}

// checks if any steam keys are for sale
async function getHomePage(app, prefix){
    const gameRows = await app.query(`SELECT * FROM gamesData`);
    const firstEmbed = new app.Embed()
    firstEmbed.setTitle(`Item Shop`);
    firstEmbed.setDescription('Use `' + prefix + 'buy <item>` to purchase.');
    firstEmbed.setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/602129484900204545/shopping-cart.png");
    firstEmbed.setColor(13215302);

    for(let gameRow of gameRows){
        if(gameRow !== null){
            if(gameRow.gameCurrency == "money"){
                firstEmbed.addField(gameRow.gameDisplay,"Price: " + app.common.formatNumber(gameRow.gamePrice) + " | **" + gameRow.gameAmount + "** left! Use `" + prefix + "buy " + gameRow.gameName + "` to purchase!");
            }
            else{
                firstEmbed.addField(gameRow.gameDisplay,"Price: " + gameRow.gamePrice + "x " + app.itemdata[gameRow.gameCurrency].icon + "`" + gameRow.gameCurrency + "` | **" + gameRow.gameAmount + "** left! Use `" + prefix + "buy " + gameRow.gameName + "` to purchase!");
            }
        }
    }

    if(!gameRows.length){
        firstEmbed.addField("Unfortunately, there are no steam keys for sale at this time.","Check back at a later time.");
    }
    
    return firstEmbed;
}

function getRarityValue(item){
    let rarityVal;

    switch(item.rarity){
        case "Common": rarityVal = 0; break;
        case "Uncommon": rarityVal = 1; break;
        case "Rare": rarityVal = 2; break;
        case "Epic": rarityVal = 3; break;
        case "Legendary": rarityVal = 4; break;
        case "Ultra": rarityVal = 5; break;
        default: rarityVal = 6;
    }

    return rarityVal;
}