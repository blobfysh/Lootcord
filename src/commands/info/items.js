const { ITEM_TYPES } = require('../../resources/constants');

module.exports = {
    name: 'items',
    aliases: ['item', 'recipe'],
    description: 'Shows information about an item.',
    long: 'Specify an item to see detailed information about it.',
    args: {"item": "Item to search."},
    examples: ["item ak47"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const itemsArraySorted = Object.keys(app.itemdata).sort(app.itm.sortItemsHighLow.bind(app));
        let itemSearched = app.parse.items(message.args)[0];
        let itemChoice = (message.args[0] || '').toLowerCase();

        if(itemSearched){
            let itemBuyCurr = app.itemdata[itemSearched].buy.currency;
            let itemBuyPrice = app.itemdata[itemSearched].buy.amount;
            let itemSellPrice = app.itemdata[itemSearched].sell;
            let itemCategory = app.itemdata[itemSearched].category;
            let itemInfo = app.itemdata[itemSearched].desc;
            let itemImg = app.itemdata[itemSearched].image;
            let itemRecyclesTo = app.itemdata[itemSearched].recyclesTo;
            let itemCraftedWith = app.itemdata[itemSearched].craftedWith;
            let itemCooldown = app.itemdata[itemSearched].cooldown;
            let isBound = app.itemdata[itemSearched].canBeStolen;
            
            const embedItem = new app.Embed()
            .setTitle(`${app.itemdata[itemSearched].icon} ${itemSearched}`)
            .setColor(13451564)

            if(app.itemdata[itemSearched].isBanner){
                embedItem.setImage(itemImg);
                embedItem.setColor(app.itemdata[itemSearched].bannerColor)
            }
            else if(itemImg){
                embedItem.setThumbnail(itemImg)
            }

            if(app.itemdata[itemSearched].artist !== ""){
                const artistInfo = await app.common.fetchUser(app.itemdata[itemSearched].artist, { cacheIPC: false });

                embedItem.setFooter('Art by ' + artistInfo.username + '#' + artistInfo.discriminator);
            }

            // if item is a box =>
            if(app.itemdata[itemSearched].rates !== undefined){
                let possibleItems = [];

                Object.keys(app.itemdata[itemSearched].rates).forEach(rate => {
                    for(let i = 0; i < app.itemdata[itemSearched].rates[rate].items.length; i++){
                        possibleItems.push(app.itemdata[itemSearched].rates[rate].items[i].split('|')[0]);
                    }
                });
                
                itemInfo += '\n\n**Possible items:** ' + possibleItems.sort(app.itm.sortItemsHighLow.bind(app)).map(item => app.itemdata[item].icon + '`' + item + '`').join(', ')
            }

            if(!isBound){
                embedItem.setDescription(itemInfo + "\n```css\nThis item binds to the user when received, and cannot be traded or stolen.```");
            }
            else if(itemInfo !== ""){
                embedItem.setDescription(itemInfo);
            }

            embedItem.addField("Type", itemCategory === 'Storage' ? 'Storage Container' : itemCategory, true);
            embedItem.addField("Tier", app.itemdata[itemSearched].tier === 0 ? "None" : "Tier " + app.icons.tiers[app.itemdata[itemSearched].tier], true);
            embedItem.addBlankField(true);
            
            if(itemCooldown !== ""){
                embedItem.addField("Cooldown", "`" + app.cd.convertTime(itemCooldown.seconds * 1000) + "`", true)
            }
            if(app.itemdata[itemSearched].chanceToBreak){
                embedItem.addField("Chance to break", "`" + (app.itemdata[itemSearched].chanceToBreak * 100) + "%`", true)
            }

            if(app.itemdata[itemSearched].isWeap){
                if(app.itemdata[itemSearched].ammo !== ""){
                    embedItem.addField("Damage", app.itemdata[itemSearched].ammo.sort(app.itm.sortItemsHighLow.bind(app)).map(ammo => {
                        return app.itemdata[ammo].icon + '`' + ammo + '` ' + (app.itemdata[ammo].damage + app.itemdata[itemSearched].minDmg) + ' - ' + (app.itemdata[ammo].damage + app.itemdata[itemSearched].maxDmg)
                    }).join('\n'));
                }
                else{
                    embedItem.addField("Damage", app.itemdata[itemSearched].minDmg + ' - ' + app.itemdata[itemSearched].maxDmg, true)
                }
            }

            if(app.itemdata[itemSearched].category === 'Ammo'){
                let ammoFor = itemsArraySorted.filter(item => app.itemdata[item].ammo !== "" && app.itemdata[item].ammo.includes(itemSearched));

                embedItem.addField("Damage", app.itemdata[itemSearched].damage, true);
                embedItem.addField("Ammo for:", ammoFor.map(weapon => app.itemdata[weapon].icon + '`' + weapon + '`').join('\n'), true)
            }

            if(itemBuyCurr !== undefined && (itemBuyCurr === "money" || itemBuyCurr === "scrap")){
                embedItem.addField("Buy", app.common.formatNumber(itemBuyPrice, false, itemBuyCurr === "scrap" ? true : false), true);
            }
            else if(itemBuyCurr !== undefined){
                embedItem.addField("Buy", itemBuyPrice + "x " + app.itemdata[itemBuyCurr].icon + "`" + itemBuyCurr + "`", true);
            }

            if(itemSellPrice !== ""){
                embedItem.addField("Sell", app.common.formatNumber(itemSellPrice), true);
            }
            
            let craftItems = [];
            let recycledFrom = [];

            for(let item of itemsArraySorted){
                if(app.itemdata[item].craftedWith !== ''){
                    for(let i = 0; i < app.itemdata[item].craftedWith.materials.length; i++){
                        if(app.itemdata[item].craftedWith.materials[i].split('|')[0] == itemSearched){
                            craftItems.push(app.itemdata[item].icon + '`' + item + '`');
                        }
                    }
                }
                
                if(app.itemdata[item].recyclesTo.length == undefined){
                    for(let i = 0; i < app.itemdata[item].recyclesTo.materials.length; i++){
                        if(app.itemdata[item].recyclesTo.materials[i].split('|')[0] == itemSearched){
                            recycledFrom.push(app.itemdata[item].icon + '`' + item + '`');
                        }
                    }
                }
            }

            if(itemCraftedWith !== "" || itemRecyclesTo.materials !== undefined || craftItems.length || recycledFrom.length) embedItem.addBlankField();

            if(itemCraftedWith !== ""){
                embedItem.addField("🔩 Crafted with:", "⭐ __Level **" + itemCraftedWith.level + '**+__\n\n' + app.itm.getDisplay(itemCraftedWith.materials.sort(app.itm.sortItemsHighLow.bind(app))).join('\n'), true)
            }
            if(itemRecyclesTo.materials !== undefined){
                embedItem.addField("♻ Recycles into:", app.itm.getDisplay(itemRecyclesTo.materials.sort(app.itm.sortItemsHighLow.bind(app))).join('\n'), true)
            }

            if(craftItems.length){
                embedItem.addField('Used to craft:', craftItems.join('\n'), true)
            }
            if(recycledFrom.length){
                embedItem.addField('Recycled from:', recycledFrom.join('\n'), true)
            }

            message.channel.createMessage(embedItem);
        }
        else if(!itemChoice){
            let meleeWeapons = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Melee');
            let rangedWeapons = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Ranged');
            let items = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Item');
            let ammo = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Ammo');
            let material = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Material');
            let storage = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Storage');
            let banners = itemsArraySorted.filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Banner');

            const embedInfo = new app.Embed()
            .setColor(13451564)
            .setTitle("Full Items List")
            .addField(ITEM_TYPES['ranged'].name, rangedWeapons.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField(ITEM_TYPES['melee'].name, meleeWeapons.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField(ITEM_TYPES['items'].name, items.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField(ITEM_TYPES['ammo'].name, ammo.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField(ITEM_TYPES['materials'].name, material.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField(ITEM_TYPES['storage'].name, storage.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField(ITEM_TYPES['banners'].name, banners.map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .setFooter(`Use ${message.prefix}item <item> to retrieve more information!`)

            message.channel.createMessage(embedInfo);
        }
        else{
            message.reply(`I don't recognize that item. Use \`${message.prefix}items\` to see a full list!`);
        }
    },
}