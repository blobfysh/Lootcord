const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

module.exports = {
    name: 'recycle',
    aliases: [''],
    description: 'Break items down into parts!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        let sellItem = methods.getCorrectedItemInfo(args[0]);
        let sellAmount = args[1];

        if(itemdata[sellItem] !== undefined){
            if(itemdata[sellItem].recyclesTo == ""){
                return message.reply(lang.recycle[0]);
            }

            if(sellAmount == undefined || !Number.isInteger(parseInt(sellAmount)) || sellAmount % 1 !== 0 || sellAmount < 1){
                sellAmount = 1;
            }
            else if(sellAmount > 20) sellAmount = 20;

            var itemMats = getItemMats(itemdata[sellItem].recyclesTo.materials, sellAmount);

            const embedInfo = new Discord.RichEmbed()
            .setTitle(lang.recycle[1].replace('{0}', sellAmount).replace('{1}', itemdata[sellItem].icon).replace('{2}', sellItem))
            .setDescription("```" + getMatsDisplay(itemMats) +"```")
            .setColor('#4CAD4C')
            .setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/601373249753841665/recycle.png")
            .setFooter("You will need " + methods.getTotalItmCountFromList(itemMats) + " open slots in your inventory to recycle this.")
            
            message.channel.send(message.author, {embed : embedInfo}).then(async reactMsg => {
                await reactMsg.react('✅');
                await reactMsg.react('❌');
                return reactMsg;
            }).then(botMessage => {
                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                .then(collected => {
                    const reaction = collected.first();

                    if(reaction.emoji.name === '✅'){
                        botMessage.delete();
                        methods.hasitems(message.author.id, sellItem, sellAmount).then(userHasItem => {
                            if(!userHasItem) return message.reply(lang.recycle[2]);
                            
                            methods.hasenoughspace(message.author.id, methods.getTotalItmCountFromList(itemMats)).then(result => {
                                if(!result) return message.reply(lang.errors[2]);

                                methods.additem(message.author.id, itemMats);
                                methods.removeitem(message.author.id, sellItem, sellAmount);
                                message.reply(lang.recycle[3].replace('{0}', sellAmount).replace('{1}', sellItem).replace('{2}', getMatsDisplay(itemMats)));
                            });
                        });
                    }
                    else{
                        botMessage.delete();
                    }
                }).catch(collected => {
                    botMessage.delete();
                    message.reply(lang.errors[3]);
                });
            });
        }
        else{
            message.reply("I don't recognize that item. `recycle <item>`");
        }
    },
}

function getItemMats(itemMats, recycleAmount){
    var itemPrice = [];

    for(var i = 0; i < itemMats.length; i++){
        let matAmount = itemMats[i].split('|');

        itemPrice.push(matAmount[0] + '|' + (matAmount[1] * recycleAmount));
    }

    return itemPrice;
}

function getMatsDisplay(itemMats){
    var displayTxt = '';

    for(var i = 0; i < itemMats.length; i++){
        let matAmount = itemMats[i].split('|');

        displayTxt += matAmount[1] + 'x ' + matAmount[0] + '\n';
    }

    return displayTxt;
}