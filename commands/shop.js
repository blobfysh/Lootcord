const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const max_items_per_page = 18;

module.exports = {
    name: 'shop',
    aliases: ['store','market'],
    description: 'Shows information about an item.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        var shopItem = methods.getitems("all",{});
        var allItems = [];
        var banners  = [['🔰 Banners', 'Used to change look of inventory.']];

        for (var i = 0; i < shopItem.length; i++) {
            let rarity = itemdata[shopItem[i]].rarity;
            let rarityCode = itemdata[shopItem[i]].shopOrderCode;

            if(itemdata[shopItem[i]].isBanner){
                if(itemdata[shopItem[i]].buy !== ""){
                    if(itemdata[shopItem[i]].buy.currency == 'money'){
                        banners.push([itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "📥 " + methods.formatMoney(itemdata[shopItem[i]].buy.amount, true) + " ", "📤 " + methods.formatMoney(itemdata[shopItem[i]].sell, true), rarityCode]);
                    }
                    else{
                        banners.push([itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "📥 " + itemdata[shopItem[i]].buy.amount + "x `" + itemdata[shopItem[i]].buy.currency + '` ', "📤 " + methods.formatMoney(itemdata[shopItem[i]].sell, true), rarityCode]);
                    }
                }
                else if(itemdata[shopItem[i]].sell !== ""){
                    banners.push([itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "","📤 "+methods.formatMoney(itemdata[shopItem[i]].sell, true), rarityCode]);
                }
            }

            else if(itemdata[shopItem[i]].buy !== ""){
                if(itemdata[shopItem[i]].buy.currency == 'money'){
                    allItems.push([itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "📥 " + methods.formatMoney(itemdata[shopItem[i]].buy.amount, true) + " ", "📤 " + methods.formatMoney(itemdata[shopItem[i]].sell, true), rarityCode]);
                }
                else{
                    allItems.push([itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "📥 " + itemdata[shopItem[i]].buy.amount + "x `" + itemdata[shopItem[i]].buy.currency + '` ', "📤 " + methods.formatMoney(itemdata[shopItem[i]].sell, true), rarityCode]);
                }
                
                //console.log(shopItem[i])
            }

            else if(itemdata[shopItem[i]].sell !== ""){
                allItems.push([itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "","📤 "+methods.formatMoney(itemdata[shopItem[i]].sell, true), rarityCode]);
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
        let maxPage = Math.ceil(allItems.length/max_items_per_page);

        // get home page method for shop
        const homePage = await getHomePage(lang);
        const botMessage = await message.channel.send(homePage);
        await botMessage.react('◀');
        await botMessage.react('▶');
        await botMessage.react('❌');
        
        const collector = botMessage.createReactionCollector((reaction, user) => 
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
                    botMessage.edit(homePage);
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
                botMessage.delete();
            }

            function editEmbed(){
                itemFilteredItems = [];
                let indexFirst = (max_items_per_page * pageNum) - max_items_per_page;
                let indexLast = (max_items_per_page * pageNum) - 1;
                const newEmbed = new Discord.RichEmbed({
                    footer: {
                        text: `Page ${pageNum}/${maxPage}`
                    },
                    color: 0
                });
                newEmbed.setTitle(`**ITEM SHOP**`)
                newEmbed.setDescription(lang.shop[0])

                for(var itemVar of allItems){
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
                }

                botMessage.edit(newEmbed);
            }
        });
        collector.on("end", reaction => {
        });
    },
}

async function getHomePage(lang){
    const gameRows = await query(`SELECT * FROM gamesData`);
    const firstEmbed = new Discord.RichEmbed()
    firstEmbed.setTitle(`**ITEM SHOP**`);
    firstEmbed.setDescription(lang.shop[0]);
    firstEmbed.setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/602129484900204545/shopping-cart.png");
    firstEmbed.setFooter(`Home page`);
    firstEmbed.setColor(0);

    for(var gameRow of gameRows){
        if(gameRow !== null){
            if(gameRow.gameCurrency == "money"){
                firstEmbed.addField(gameRow.gameDisplay,"Price: " + methods.formatMoney(gameRow.gamePrice) + " | **" + gameRow.gameAmount + "** left! Use `buy " + gameRow.gameName + "` to purchase!");
            }
            else{
                firstEmbed.addField(gameRow.gameDisplay,"Price: " + gameRow.gamePrice + " `" + gameRow.gameCurrency + "` | **" + gameRow.gameAmount + "** left! Use `buy " + gameRow.gameName + "` to purchase!");
            }
        }
    }

    if(!gameRows.length){
        firstEmbed.addField("Unfortunately, there are no steam keys for sale at this time.","Check back at a later time.");
    }
    
    return firstEmbed;
}