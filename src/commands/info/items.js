
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
    
    execute(app, message){
        let itemSearched = app.parse.items(message.args)[0];
        let itemChoice = (message.args[0] || '').toLowerCase();

        if(itemSearched){
            let itemDamage = app.itemdata[itemSearched].damage;
            let itemBuyCurr = app.itemdata[itemSearched].buy.currency;
            let itemBuyPrice = app.itemdata[itemSearched].buy.amount;
            let itemSellPrice = app.itemdata[itemSearched].sell;
            let itemAmmo = app.itemdata[itemSearched].ammo;
            let itemAmmoFor = app.itemdata[itemSearched].isAmmo;
            let itemRarity = app.itemdata[itemSearched].rarity;
            let itemInfo = app.itemdata[itemSearched].desc;
            let itemImg = app.itemdata[itemSearched].image;
            let itemRecyclesTo = app.itemdata[itemSearched].recyclesTo;
            let itemCraftedWith = app.itemdata[itemSearched].craftedWith;
            let itemCooldown = app.itemdata[itemSearched].cooldown;
            let isBound = app.itemdata[itemSearched].canBeStolen;
            let itemRarityColor = 0;

            switch(itemRarity){
                case 'Ultra': itemRarityColor = '#EC402C'; break;
                case 'Legendary': itemRarityColor = 13215302; break
                case 'Limited': itemRarityColor = '#EA5A2A'; break
                case 'Epic': itemRarityColor = '#7251E6'; break;
                case 'Rare': itemRarityColor = '#325AD7'; break;
                case 'Uncommon': itemRarityColor = '#429642'; break;
                default:
                    itemRarityColor = '#818181';
            }
            
            const embedItem = new app.Embed()
            .setTitle(`${app.itemdata[itemSearched].icon} ${itemSearched}`)
            .setColor(itemRarityColor)
            if(app.itemdata[itemSearched].isBanner){
                embedItem.setImage(itemImg);
                embedItem.setColor(app.itemdata[itemSearched].bannerColor)
                embedItem.addField('Type', 'Banner');
            }
            else if(itemImg){
                embedItem.setThumbnail(itemImg)
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

            embedItem.addField("***Rarity***", itemRarity)
            
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

            if(itemCraftedWith !== "" || itemRecyclesTo.materials !== undefined) embedItem.addBlankField();

            if(itemCraftedWith !== ""){
                embedItem.addField("🔩 Craft Ingredients:", itemCraftedWith.display.split('\n').map(component =>  component.split(' ')[0] + ' ' + app.itemdata[component.split(' ')[1]].icon + '`' + component.split(' ')[1] + '`').join('\n'), true)
            }
            if(itemRecyclesTo.materials !== undefined){
                embedItem.addField("♻ Recycles into:", itemRecyclesTo.display.split('\n').map(item =>  item.split(' ')[0] + ' ' + app.itemdata[item.split(' ')[1]].icon + '`' + item.split(' ')[1] + '`').join('\n'), true)
            }

            message.channel.createMessage(embedItem);
        }
        else if(!itemChoice){
            let commonList = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity === 'Common')
            let uncommonList = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity === 'Uncommon')
            let rareList = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity === 'Rare')
            let epicList = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity === 'Epic')
            let legendList = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity === 'Legendary')
            let ultraList = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity === 'Ultra')

            const embedInfo = new app.Embed()
            .setColor('#000')
            .setTitle("Full Items List")
            .addField("Common", commonList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField("Uncommon", uncommonList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField("Rare", rareList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField("Epic", epicList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField("Legendary", legendList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .addField("Ultra", ultraList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
            .setFooter(`Use ${message.prefix}item <item> to retrieve more information!`)
            .setDescription(`You can also type \`${message.prefix}item <type>\` to see specific items. Types include:\n\`usable\`, \`weapons\`, \`ammo\`, \`banner\`, \`backpack\`, \`material\``)
            
            message.channel.createMessage(embedInfo);
        }
        else if(itemChoice.startsWith('weapon')){
            message.channel.createMessage(editEmbed(app, 'weapon', message));
        }
        else if(itemChoice === 'items' || itemChoice.startsWith('consumable') || itemChoice.startsWith('usable')){
            message.channel.createMessage(editEmbed(app, 'item', message));
        }
        else if(itemChoice === 'ammo' || itemChoice === 'ammunition'){
            message.channel.createMessage(editEmbed(app, 'ammo', message));
        }
        else if(itemChoice.startsWith('banner')){
            message.channel.createMessage(editEmbed(app, 'banner', message));
        }
        else if(itemChoice.startsWith('backpack')){
            message.channel.createMessage(editEmbed(app, 'backpack', message));
        }
        else if(itemChoice.startsWith('material')){
            message.channel.createMessage(editEmbed(app, 'material', message));
        }
        else{
            message.reply(`That item isn't in my database! Use \`${message.prefix}items\` to see a full list!`);
        }
    },
}

function editEmbed(app, type, message){
    let commonList = typeFilter(app, Object.keys(app.itemdata), 'Common', type);
    let uncommonList = typeFilter(app, Object.keys(app.itemdata), 'Uncommon', type);
    let rareList = typeFilter(app, Object.keys(app.itemdata), 'Rare', type);
    let epicList = typeFilter(app, Object.keys(app.itemdata), 'Epic', type);
    let legendList = typeFilter(app, Object.keys(app.itemdata), 'Legendary', type);
    let ultraList = typeFilter(app, Object.keys(app.itemdata), 'Ultra', type);

    const embedInfo = new app.Embed()
    .setColor('#000')
    .setTitle('Items List - ' + (type == 'weapon' ? 'Weapons' : type == 'item' ? 'Consumables' : type == 'ammo' ? 'Ammunition' : type == 'banner' ? 'Banners' : type == 'backpack' ? 'Backpacks' : 'Materials'))
    if(commonList.length > 0){
        embedInfo.addField("Common", commonList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
    }
    if(uncommonList.length > 0){
        embedInfo.addField("Uncommon", uncommonList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
    }
    if(rareList.length > 0){
        embedInfo.addField("Rare", rareList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
    }
    if(epicList.length > 0){
        embedInfo.addField("Epic", epicList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
    }
    if(legendList.length > 0){
        embedInfo.addField("Legendary", legendList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
    }
    if(ultraList.length > 0){
        embedInfo.addField("Ultra", ultraList.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join('\n'), true)
    }
    else{
        embedInfo.addBlankField(true)
    }
    if(commonList.length <= 0){
        embedInfo.addBlankField(true)
    }
    if(uncommonList.length <= 0){
        embedInfo.addBlankField(true)
    }
    if(rareList.length <= 0){
        embedInfo.addBlankField(true)
    }
    if(epicList.length <= 0){
        embedInfo.addBlankField(true)
    }
    if(legendList.length <= 0){
        embedInfo.addBlankField(true)
    }
    embedInfo.setDescription(`You can also type \`${message.prefix}items <type>\` to see specific items. Types include:\n\`usable\`, \`weapons\`, \`ammo\`, \`banner\`, \`backpack\`, \`material\``)
    embedInfo.setFooter(`Use ${message.prefix}item <item> to retrieve more information!`)

    return embedInfo
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

function typeFilter(app, items, rarity, type){
    return items.filter(item => {
        return app.itemdata[item].rarity === rarity &&
        ((type === 'banner' && app.itemdata[item].isBanner) ||
        (type === 'item' && app.itemdata[item].isItem) ||
        (type === 'ammo' && app.itemdata[item].isAmmo.length >= 1) ||
        (type === 'weapon' && app.itemdata[item].isWeap) ||
        (type === 'backpack' && app.itemdata[item].type === 'backpack') ||
        (type === 'material' && app.itemdata[item].isMaterial))
    });
}