const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'shop',
    aliases: ['store','market'],
    description: 'Shows information about an item.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        var shopItem = methods.getitems("all",{});
        var allItems = [];
        var banners  = [['🔰 Banners', 'Used to change look of inventory.']];

        for (var i = 0; i < shopItem.length; i++) {
            let rarity = itemdata[shopItem[i]].rarity;
            let rarityCode = itemdata[shopItem[i]].shopOrderCode;

            if(itemdata[shopItem[i]].isBanner){
                if(itemdata[shopItem[i]].buy !== ""){
                    banners.push([itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "📥 " + methods.formatMoney(itemdata[shopItem[i]].buy.amount) + " ", "📤 " + methods.formatMoney(itemdata[shopItem[i]].sell), rarityCode]);
                }
                else if(itemdata[shopItem[i]].sell !== ""){
                    banners.push([itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "","📤 "+methods.formatMoney(itemdata[shopItem[i]].sell), rarityCode]);
                }
            }

            else if(itemdata[shopItem[i]].buy !== ""){
                allItems.push([itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "📥 " + methods.formatMoney(itemdata[shopItem[i]].buy.amount) + " ", "📤 " + methods.formatMoney(itemdata[shopItem[i]].sell), rarityCode]);
                //console.log(shopItem[i])
            }

            else if(itemdata[shopItem[i]].sell !== ""){
                allItems.push([itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "","📤 "+methods.formatMoney(itemdata[shopItem[i]].sell), rarityCode]);
            }
        }

        allItems.sort(function(a,b) {
            if(a[3] < b[3]) return -1;// 3rd index is rarity

            else if(a[3] > b[3]) return 1;

            else if(a[3] == b[3]){// if rarityCode is the same, we compare names

                if(a[0] < b[0]) return -1; // 0 index is item name

                else if(a[0] > b[0]) return 1;
                
                return 0;
            }
            return 0;
        });

        allItems = allItems.concat(banners);

        let pageNum = 0;
        let itemFilteredItems = [];
        let maxPage = Math.ceil(allItems.length/12);

        // get home page method for shop
        methods.getHomePage().then(homePage => {
            message.channel.send(homePage).then(botMessage => {
                botMessage.react('◀').then(() => botMessage.react('▶')).then(() => botMessage.react('❌'));
                return botMessage;
            }).then((collectorMsg) => {
                const collector = collectorMsg.createReactionCollector((reaction, user) => 
                    user.id === message.author.id && reaction.emoji.name === "◀" || 
                    user.id === message.author.id && reaction.emoji.name === "▶" || 
                    user.id === message.author.id && reaction.emoji.name === "❌", {time: 60000});
                collector.on("collect", reaction => {
                    const chosen = reaction.emoji.name;
                    if(chosen === "◀"){
                        if(pageNum > 1){
                            pageNum -= 1;
                            editEmbed();
                        }
                        else if(pageNum == 1){
                            pageNum = 0;
                            collectorMsg.edit(homePage);
                        }
                        reaction.remove(message.author.id);
                        //previous page
                    }else if(chosen === "▶"){
                        if(pageNum < maxPage){
                            pageNum += 1;
                            editEmbed();
                        }
                        reaction.remove(message.author.id);
                        // Next page
                    }else if(chosen === "❌"){
                        // Stop navigating pages
                        collectorMsg.delete();
                    }
                    function editEmbed(){
                        itemFilteredItems = [];
                        let indexFirst = (12 * pageNum) - 12;
                        let indexLast = (12 * pageNum) - 1;
                        const newEmbed = new Discord.RichEmbed({
                            footer: {
                                text: `Page ${pageNum}/${maxPage}`
                            },
                            color: 0
                        });
                        newEmbed.setTitle(`**ITEM SHOP**`)
                        newEmbed.setDescription(lang.shop[0])
                        //newEmbed.setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/497356681139847168/thanbotShopIcon.png")
                        allItems.forEach(function (itemVar) {
                            try{
                                if(allItems.indexOf(itemVar) >= indexFirst && allItems.indexOf(itemVar) <= indexLast){
                                    if(itemVar[0] == '🔰 Banners'){
                                        itemFilteredItems.push(itemVar);
                                        newEmbed.addField(itemVar[0], itemVar[1], false);
                                    }
                                    else{
                                        itemFilteredItems.push(itemVar);
                                        newEmbed.addField(itemVar[0], itemVar[1] + itemVar[2], true);
                                    }
                                }
                            }
                            catch(err){
                            }
                        });
                        collectorMsg.edit(newEmbed);
                    }
                });
                collector.on("end", reaction => {
                });
            });
        });
    },
}