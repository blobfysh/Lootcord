const Discord = require('discord.js');
//const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const general = require('../methods/general');

module.exports = {
    name: 'craftitems',
    aliases: ['recycleitems', 'recycleitem', 'craftitem'],
    description: 'Shows what an item can craft.',
    hasArgs: true,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        let itemSearched = general.parseArgsWithSpaces(args[0], args[1], args[2]);

        if(itemdata[itemSearched] !== undefined){
            var craftItems = [];
            var recycledFrom = [];

            Object.keys(itemdata).forEach(item => {
                if(itemdata[item].craftedWith !== ''){
                    for(var i = 0; i < itemdata[item].craftedWith.materials.length; i++){
                        if(itemdata[item].craftedWith.materials[i].split('|')[0] == itemSearched){
                            craftItems.push(itemdata[item].icon + ' ' + item);
                        }
                    }
                }
                
                if(itemdata[item].recyclesTo.length == undefined){
                    for(var i = 0; i < itemdata[item].recyclesTo.materials.length; i++){
                        if(itemdata[item].recyclesTo.materials[i].split('|')[0] == itemSearched){
                            recycledFrom.push(itemdata[item].icon + ' ' + item);
                        }
                    }
                }
            });

            const infoEmbed = new Discord.RichEmbed()
            .setTitle(itemdata[itemSearched].icon + ' ' + itemSearched + ' Info')
            .setColor(14202368)
            .setFooter('Looking for more general item info? Use ' + prefix + 'item <item>')
            if(craftItems.length > 0){
                infoEmbed.addField('🔩 Used to craft', craftItems, true)
            }
            if(recycledFrom.length > 0){
                infoEmbed.addField('♻ Recycled from', recycledFrom, true)
            }
            else if(craftItems.length == 0){
                infoEmbed.setDescription('This item cannot be used to craft and is not recycled from any other items.')
            }
            
            message.channel.send(infoEmbed);
        }
        else{
            message.reply(lang.item[0].replace('{0}', prefix));
        }
    },
}