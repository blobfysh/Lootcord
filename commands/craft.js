const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

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
        let craftItem = methods.getCorrectedItemInfo(args[0]);
        let itemPrice = "";

        if(itemdata[craftItem] !== undefined){
            if(itemdata[craftItem].craftedWith == ""){
                return message.reply(lang.craft[1]);
            }
            itemPrice = itemdata[craftItem].craftedWith.display;

            const embedInfo = new Discord.RichEmbed()
            .setTitle(lang.craft[0].replace('{0}', craftItem))
            .setDescription("```" + itemPrice +"```")
            .setColor(0)
            .setImage("https://cdn.discordapp.com/attachments/454163538886524928/527740857525207060/redLine.png")
            .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/527739509740142592/UnboxUltra.png")

            message.channel.send(message.author, {embed : embedInfo}).then(botMessage => {
                botMessage.react('✅').then(() => botMessage.react('❌'));
                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                .then(collected => {
                    const reaction = collected.first();

                    if(reaction.emoji.name === '✅'){
                        botMessage.delete();
                        methods.hasitems(message.author.id, itemdata[craftItem].craftedWith.materials).then(result => {
                            if(result){
                                message.reply(lang.craft[4].replace('{0}', craftItem));
                                methods.removeitem(message.author.id, itemdata[craftItem].craftedWith.materials);
                                methods.additem(message.author.id, craftItem, 1);
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