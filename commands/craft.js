const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const general = require('../methods/general');

module.exports = {
    name: 'craft',
    aliases: [''],
    description: 'Craft new items!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        let craftItem = general.parseArgsWithSpaces(args[0], args[1], args[2]);
        let craftAmount = general.parseArgsWithSpaces(args[0], args[1], args[2], true, false, false);

        if(itemdata[craftItem] !== undefined){
            if(itemdata[craftItem].craftedWith == ""){
                return message.reply(lang.craft[1]);
            }

            if(craftAmount == undefined || !Number.isInteger(parseInt(craftAmount)) || craftAmount % 1 !== 0 || craftAmount < 1){
                craftAmount = 1;
            }
            else if(craftAmount > 20) craftAmount = 20;

            var itemMats = getItemMats(itemdata[craftItem].craftedWith.materials, craftAmount);

            const embedInfo = new Discord.RichEmbed()
            .setTitle(lang.craft[0].replace('{0}', craftAmount).replace('{1}', itemdata[craftItem].icon).replace('{2}', craftItem))
            .setDescription(getMatsDisplay(itemMats))
            .setColor('#818181')
            .setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/601372871301791755/craft.png")

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
                        methods.hasitems(message.author.id, itemMats).then(result => {
                            if(result){
                                message.reply(lang.craft[4].replace('{0}', craftAmount).replace('{1}', itemdata[craftItem].icon).replace('{2}', craftItem));
                                methods.removeitem(message.author.id, itemMats);
                                methods.additem(message.author.id, craftItem, parseInt(craftAmount));
                            }
                            else{
                                message.reply(lang.craft[2]);
                            }
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
            message.reply(lang.craft[3].replace('{0}', prefix));
        }
    },
}

function getItemMats(itemMats, craftAmount){
    var itemPrice = [];

    for(var i = 0; i < itemMats.length; i++){
        let matAmount = itemMats[i].split('|');

        itemPrice.push(matAmount[0] + '|' + (matAmount[1] * craftAmount));
    }

    return itemPrice;
}

function getMatsDisplay(itemMats){
    var displayTxt = '';

    for(var i = 0; i < itemMats.length; i++){
        let matAmount = itemMats[i].split('|');

        displayTxt += matAmount[1] + 'x ' + itemdata[matAmount[0]].icon + matAmount[0] + '\n';
    }

    return displayTxt;
}