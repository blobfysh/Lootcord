const { RARITIES } = require('../../resources/constants');

module.exports = {
    name: 'open',
    aliases: [''],
    description: 'Opens a specified box.',
    long: 'Opens a specified box. You can also open boxes with the use command.',
    args: {"item": "Box to open.", "amount": "Amount to open."},
    examples: ["open item_box 10","open care package"],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        let amount = app.parse.numbers(message.args)[0] || 1;
        let item = app.parse.items(message.args)[0];

        if(!item){
            return message.reply(`❌ You need to specify a box to open! \`${message.prefix}open <item>\`.`);
        }
        else if(['item_box', 'ultra_box', 'candy_pail', 'present', 'care_package'].includes(item)){
            const userItems = await app.itm.getItemObject(message.author.id);
            const itemCt = await app.itm.getItemCount(userItems, row);
            if(amount > 10) amount = 10;

            if(!await app.itm.hasItems(userItems, item, amount)){
                return message.reply(`❌ You don't have enough of that item! You have **${userItems[item] || 0}x** ${app.itemdata[item].icon}\`${item}\``);
            }

            // open box
            if(!await app.itm.hasSpace(itemCt)){
                return message.reply(`❌ **You don't have enough space in your inventory!** (You have **${itemCt.open}** open slots)\n\nYou can clear up space by selling some items.`);
            }

            await app.itm.removeItem(message.author.id, item, amount);

            let results = app.itm.openBox(item, amount, row.luck);
            let bestItem = results.items.sort(app.itm.sortItemsHighLow.bind(app));
            let rarityStr = '';
            let openStr = '';

            await app.itm.addItem(message.author.id, results.itemAmounts);
            await app.player.addPoints(message.author.id, results.xp);

            if(item === 'ultra_box' && app.itemdata[bestItem[0]].rarity === 'Ultra'){
                await app.itm.addBadge(message.author.id, 'ultra_lucky');
            }

            const embedInfo = new app.Embed()
            .setColor(RARITIES[app.itemdata[bestItem[0]].rarity.toLowerCase()].color)
            
            switch(app.itemdata[bestItem[0]].rarity){
                case 'Ultra': rarityStr = `an ${RARITIES['ultra'].name} `; break;
                case 'Legendary': rarityStr = `a ${RARITIES['legendary'].name} `; break
                case 'Limited': rarityStr = `a ${RARITIES['limited'].name} `; break
                case 'Epic': rarityStr = `an ${RARITIES['epic'].name} `; break;
                case 'Rare': rarityStr = `a ${RARITIES['rare'].name} `; break;
                case 'Uncommon': rarityStr = `an ${RARITIES['uncommon'].name} `; break;
                default: rarityStr = `a ${RARITIES['common'].name} `;
            }
            
            if(amount === 1){
                embedInfo.setDescription('You received ' + rarityStr + results.display.join());
                embedInfo.setFooter('⭐ ' + results.xp + ' XP earned!')

                if(app.itemdata[results.itemAmounts[0].split('|')[0]].unboxImage && app.itemdata[results.itemAmounts[0].split('|')[0]].unboxImage !== ""){
                    embedInfo.setThumbnail(app.itemdata[results.itemAmounts[0].split('|')[0]].unboxImage);
                }
                else if(app.itemdata[results.itemAmounts[0].split('|')[0]].image !== ""){
                    embedInfo.setThumbnail(app.itemdata[results.itemAmounts[0].split('|')[0]].image);
                }

                openStr = 'You open the ' + app.itemdata[item].icon + '`' + item + '` and find:';
            }
            else{
                if(app.itemdata[bestItem[0]].unboxImage && app.itemdata[bestItem[0]].unboxImage !== ""){
                    embedInfo.setThumbnail(app.itemdata[bestItem[0]].unboxImage);
                }
                else if(app.itemdata[bestItem[0]].image !== ""){
                    embedInfo.setThumbnail(app.itemdata[bestItem[0]].image);
                }
                
                embedInfo.setFooter('⭐ ' + results.xp + ' XP earned!');
                embedInfo.setDescription(app.itm.getDisplay(results.itemAmounts).join('\n'));

                openStr = 'You open ' + amount + 'x ' + app.itemdata[item].icon + '`' + item + '`\'s and find:';
            }

            message.channel.createMessage({content: '<@' + message.author.id + '>, ' + openStr, embed: embedInfo.embed});
        }
        else{
            return message.reply(`❌ That item cannot be opened.`);
        }
    },
}