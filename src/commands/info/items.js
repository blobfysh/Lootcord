const { RARITIES } = require('../../resources/constants');

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
        let itemSearched = app.parse.items(message.args)[0];
        let itemChoice = (message.args[0] || '').toLowerCase();

        if(itemSearched){
            let itemDamage = app.itemdata[itemSearched].damage;
            let itemBuyCurr = app.itemdata[itemSearched].buy.currency;
            let itemBuyPrice = app.itemdata[itemSearched].buy.amount;
            let itemSellPrice = app.itemdata[itemSearched].sell;
            let itemAmmo = app.itemdata[itemSearched].ammo;
            let itemAmmoFor = app.itemdata[itemSearched].isAmmo;
            let itemCategory = app.itemdata[itemSearched].category;
            let itemInfo = app.itemdata[itemSearched].desc;
            let itemImg = app.itemdata[itemSearched].image;
            let itemRecyclesTo = app.itemdata[itemSearched].recyclesTo;
            let itemCraftedWith = app.itemdata[itemSearched].craftedWith;
            let itemCooldown = app.itemdata[itemSearched].cooldown;
            let isBound = app.itemdata[itemSearched].canBeStolen;
            
            const embedItem = new app.Embed()
            .setTitle(`${app.itemdata[itemSearched].icon} ${itemSearched}`)
            .setColor(0)
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
                    for(var i = 0; i < app.itemdata[itemSearched].rates[rate].items.length; i++){
                        possibleItems.push(app.itemdata[itemSearched].rates[rate].items[i].split('|')[0]);
                    }
                });
                possibleItems.sort((a, b) => {
                    let aRarity = getRarityValue(app.itemdata[a]);
                    let bRarity = getRarityValue(app.itemdata[b]);
        
                    if(aRarity < bRarity) return -1;
        
                    else if(aRarity > bRarity) return 1;
        
                    else if(aRarity === bRarity){
                        if(a < b) return -1;
                        
                        else if(a > b) return 1;
        
                        return 0
                    }
        
                    return 0;
                });
                
                
                itemInfo += '\n\n**Possible items:** ' + possibleItems.map(item => app.itemdata[item].icon + '`' + item + '`').join(', ')
            }

            if(!isBound){
                embedItem.setDescription(itemInfo + "\n```css\nThis item binds to the user when received, and cannot be traded or stolen.```");
            }
            else if(itemInfo !== ""){
                embedItem.setDescription(itemInfo);
            }

            embedItem.addField("Type", itemCategory === 'Storage' ? 'Storage Container' : itemCategory)
            
            if(itemCooldown !== ""){
                embedItem.addField("Cooldown", "`" + app.cd.convertTime(itemCooldown.seconds * 1000) + "`", true)
            }
            if(app.itemdata[itemSearched].chanceToBreak){
                embedItem.addField("Chance to break", "`" + (app.itemdata[itemSearched].chanceToBreak * 100) + "%`", true)
            }

            if(itemDamage !== ""){
                embedItem.addField(app.itemdata[itemSearched].isWeap ? "Base Damage" : "Damage", itemDamage, true)
            }

            if(itemAmmo !== "" && itemAmmo !== "N/A"){
                embedItem.addField("Ammunition Used", itemAmmo.map(ammo => app.itemdata[ammo].icon + '`' + ammo + '`').join('\n'), true)
            }

            if(itemAmmoFor.length >= 1){
                embedItem.addField("Ammo for:", itemAmmoFor.map(weapon => app.itemdata[weapon].icon + '`' + weapon + '`').join('\n'), true)
            }

            if(itemBuyCurr !== undefined && itemBuyCurr == "money"){
                embedItem.addField("Buy", app.common.formatNumber(itemBuyPrice), true);
            }
            else if(itemBuyCurr !== undefined){
                embedItem.addField("Buy", itemBuyPrice + "x " + app.itemdata[itemBuyCurr].icon + "`" + itemBuyCurr + "`", true);
            }

            if(itemSellPrice !== ""){
                embedItem.addField("Sell", app.common.formatNumber(itemSellPrice), true);
            }
            
            let craftItems = [];
            let recycledFrom = [];

            Object.keys(app.itemdata).forEach(item => {
                if(app.itemdata[item].craftedWith !== ''){
                    for(let i = 0; i < app.itemdata[item].craftedWith.materials.length; i++){
                        if(app.itemdata[item].craftedWith.materials[i].split('|')[0] == itemSearched){
                            craftItems.push(app.itemdata[item].icon + '`' + item + '`');
                        }
                    }
                }
                
                if(app.itemdata[item].recyclesTo.length == undefined){
                    for(var i = 0; i < app.itemdata[item].recyclesTo.materials.length; i++){
                        if(app.itemdata[item].recyclesTo.materials[i].split('|')[0] == itemSearched){
                            recycledFrom.push(app.itemdata[item].icon + '`' + item + '`');
                        }
                    }
                }
            });

            if(itemCraftedWith !== "" || itemRecyclesTo.materials !== undefined || craftItems.length || recycledFrom.length) embedItem.addBlankField();

            if(itemCraftedWith !== ""){
                embedItem.addField("🔩 Craft Ingredients:", itemCraftedWith.display.split('\n').map(component =>  component.split(' ')[0] + ' ' + app.itemdata[component.split(' ')[1]].icon + '`' + component.split(' ')[1] + '`').join('\n'), true)
            }
            if(itemRecyclesTo.materials !== undefined){
                embedItem.addField("♻ Recycles into:", itemRecyclesTo.display.split('\n').map(item =>  item.split(' ')[0] + ' ' + app.itemdata[item.split(' ')[1]].icon + '`' + item.split(' ')[1] + '`').join('\n'), true)
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
            let weapons = typeFilter(app, Object.keys(app.itemdata), 'weapon');
            let items = typeFilter(app, Object.keys(app.itemdata), 'item');
            let ammo = typeFilter(app, Object.keys(app.itemdata), 'ammo');
            let material = typeFilter(app, Object.keys(app.itemdata), 'material');
            let storage = typeFilter(app, Object.keys(app.itemdata), 'backpack');
            let banners = typeFilter(app, Object.keys(app.itemdata), 'banner');

            const embedInfo = new app.Embed()
            .setTitle("Full Items List")
            .addField("Weapons", weapons.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField("Items", items.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField("Ammo", ammo.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField("Materials", material.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField("Storage Containers", storage.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField("Banners", banners.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .setFooter(`Use ${message.prefix}item <item> to retrieve more information!`)

            message.channel.createMessage(embedInfo);
        }
        else{
            message.reply(`I don't recognize that item. Use \`${message.prefix}items\` to see a full list!`);
        }
    },
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

function typeFilter(app, items, type){
    return items.filter(item => {
        return app.itemdata[item].rarity !== 'Limited' &&
        ((type === 'banner' && app.itemdata[item].isBanner) ||
        (type === 'item' && app.itemdata[item].isItem) ||
        (type === 'ammo' && app.itemdata[item].isAmmo.length >= 1) ||
        (type === 'weapon' && app.itemdata[item].isWeap) ||
        (type === 'backpack' && app.itemdata[item].type === 'backpack') ||
        (type === 'material' && app.itemdata[item].isMaterial))
    });
}