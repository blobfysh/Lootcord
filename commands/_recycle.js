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

        if(itemdata[sellItem] !== undefined){
            if(itemdata[sellItem].recyclesTo == ""){
                return message.reply(lang.recycle[0]);
            }

            let recyclePrice = itemdata[sellItem].recyclesTo.display;

            const embedInfo = new Discord.RichEmbed()
            .setTitle(lang.recycle[1].replace('{0}', sellItem))
            .setDescription("```" + recyclePrice +"```")
            .setColor(0)
            .setImage("https://cdn.discordapp.com/attachments/454163538886524928/527630489851265025/goldLine.png")
            .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/527391190975381505/LC_Recycle.png")
            .setFooter("You will need " + methods.getTotalItmCountFromList(itemdata[sellItem].recyclesTo.materials) + " open slots in your inventory to recycle this.")
            
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
                        methods.hasitems(message.author.id, sellItem, 1).then(userHasItem => {
                            if(!userHasItem) return message.reply(lang.recycle[2]);
                            
                            methods.hasenoughspace(message.author.id, methods.getTotalItmCountFromList(itemdata[sellItem].recyclesTo.materials)).then(result => {
                                if(!result) return message.reply(lang.errors[2]);

                                methods.additem(message.author.id, itemdata[sellItem].recyclesTo.materials);
                                methods.removeitem(message.author.id, sellItem, 1);
                                message.reply(lang.recycle[3].replace('{0}', sellItem).replace('{1}', recyclePrice));
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