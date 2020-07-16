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
            let itemBuyCurr = app.itemdata[itemSearched].buy.currency;
            let itemBuyPrice = app.itemdata[itemSearched].buy.amount;
            let itemSellPrice = app.itemdata[itemSearched].sell;
            let itemAmmo = app.itemdata[itemSearched].ammo;
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
                    for(var i = 0; i < app.itemdata[itemSearched].rates[rate].items.length; i++){
                        possibleItems.push(app.itemdata[itemSearched].rates[rate].items[i].split('|')[0]);
                    }
                });
                
                itemInfo += '\n\n**Possible items:** ' + possibleItems.sort().map(item => app.itemdata[item].icon + '`' + item + '`').join(', ')
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

            if(app.itemdata[itemSearched].isWeap){
                if(app.itemdata[itemSearched].ammo !== ""){
                    embedItem.addField("Damage", app.itemdata[itemSearched].ammo.sort().map(ammo => {
                        return app.itemdata[ammo].icon + '`' + ammo + '` ' + (app.itemdata[ammo].damage + app.itemdata[itemSearched].minDmg) + ' - ' + (app.itemdata[ammo].damage + app.itemdata[itemSearched].maxDmg)
                    }).join('\n'));
                }
                else{
                    embedItem.addField("Damage", app.itemdata[itemSearched].minDmg + ' - ' + app.itemdata[itemSearched].maxDmg, true)
                }
            }

            if(app.itemdata[itemSearched].category === 'Ammo'){
                let ammoFor = Object.keys(app.itemdata).filter(item => app.itemdata[item].ammo !== "" && app.itemdata[item].ammo.includes(itemSearched));

                embedItem.addField("Damage", app.itemdata[itemSearched].damage, true);
                embedItem.addField("Ammo for:", ammoFor.map(weapon => app.itemdata[weapon].icon + '`' + weapon + '`').join('\n'), true)
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
            let weapons = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Weapon');
            let items = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Item');
            let ammo = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Ammo');
            let material = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Material');
            let storage = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Storage');
            let banners = Object.keys(app.itemdata).filter(item => app.itemdata[item].rarity !== 'Limited' && app.itemdata[item].category === 'Banner');

            const embedInfo = new app.Embed()
            .setColor(13451564)
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