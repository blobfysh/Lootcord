
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
            if(amount > 10) amount = 10;

            if(!await app.itm.hasItems(message.author.id, item, amount)){
                return message.reply(`❌ You don't have enough of that item! You have **${userItems[item] || 0}x** ${app.itemdata[item].icon}\`${item}\``);
            }

            // open box
            if(!await app.itm.hasSpace(message.author.id)){
                return message.reply("❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.");
            }

            await app.itm.removeItem(message.author.id, item, amount);

            let results = app.itm.openBox(item, amount, row.luck);
            let bestItem = results.items.sort(app.itm.sortItemsHighLow.bind(app));
            let rarityStr = '';

            await app.itm.addItem(message.author.id, results.itemAmounts);
            await app.player.addPoints(message.author.id, results.xp);

            const embedInfo = new app.Embed()
            .setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
            
            switch(app.itemdata[bestItem[0]].rarity){
                case 'Ultra': embedInfo.setColor('#EC402C');rarityStr = 'an ***U L T R A*** '; break;
                case 'Legendary': embedInfo.setColor(13215302);rarityStr = 'a ***LEGENDARY*** '; break
                case 'Limited': embedInfo.setColor('#EA5A2A');rarityStr = 'a *Limited* '; break
                case 'Epic': embedInfo.setColor('#7251E6');rarityStr = 'an ***EPIC*** '; break;
                case 'Rare': embedInfo.setColor('#325AD7');rarityStr = 'a ***Rare*** '; break;
                case 'Uncommon': embedInfo.setColor('#429642');rarityStr = 'an *Uncommon* '; break;
                default:
                    embedInfo.setColor('#818181');rarityStr = 'a *Common* ';
            }
            
            if(amount === 1){
                embedInfo.setTitle('You received ' + rarityStr + results.display.join());
                embedInfo.setFooter('⭐ ' + results.xp + ' XP earned!')

                if(app.itemdata[results.itemAmounts[0].split('|')[0]].unboxImage && app.itemdata[results.itemAmounts[0].split('|')[0]].unboxImage !== ""){
                    embedInfo.setThumbnail(app.itemdata[results.itemAmounts[0].split('|')[0]].unboxImage);
                }
                else if(app.itemdata[results.itemAmounts[0].split('|')[0]].image !== ""){
                    embedInfo.setThumbnail(app.itemdata[results.itemAmounts[0].split('|')[0]].image);
                }
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
                embedInfo.setTitle(amount + " boxes opened.");
            }

            message.channel.createMessage(embedInfo);
        }
        else{
            return message.reply(`❌ That item cannot be opened.`);
        }
    },
}