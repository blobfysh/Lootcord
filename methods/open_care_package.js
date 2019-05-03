const Discord   = require('discord.js');
const config    = require('../json/_config.json');
const methods   = require('./methods.js');
const { query } = require('../mysql.js');
const itemdata  = require('../json/completeItemList.json');

exports.open_package = async function(message, lang){
    const oldRow = await query(`SELECT * FROM items i
        INNER JOIN scores s
        ON i.userId = s.userId
        WHERE s.userId="${message.author.id}"`);
    const row = oldRow[0];

    const hasEnough = await methods.hasenoughspace(message.author.id, 3);
    
    if(!hasEnough){
        return message.reply(lang.errors[2]);
    }

    const timesToLoop     = Math.floor(Math.random()*(5 - 3 + 1)+ 3); // 3 - 5
    var finalItemsArray   = [];
    var finalItemsAmounts = [];
    var xpToAdd           = 0;

    for(var i = 0; i < timesToLoop; i++){
        var chance = Math.floor(Math.random()*(100 - 0 + 1)+ 0); // 0 - 100

        if(chance <= 25){
            var amountToGive = Math.floor(Math.random()*(3 - 1 + 1)+ 1); // 1 - 3
            const rareAmmo = methods.getitems('all', {type: 'ammo', exclude: ['legendary', 'ultra']});

            const rand = rareAmmo[Math.floor(Math.random() * rareAmmo.length)];

            if(rand == 'rocket' && amountToGive == 3){
                amountToGive = 2;
            }
            xpToAdd += (30 * amountToGive);

            finalItemsArray.push(itemdata[rand].icon + ' `' + rand + '` x' + amountToGive);
            
            finalItemsAmounts.push(rand + '|' + amountToGive);
        }
        else if(chance <= 50){
            const amountToGive = 1
            const rareItem = methods.getitems('rare', {type: 'unboxable', exclude: ['ammo']});

            const rand = rareItem[Math.floor(Math.random() * rareItem.length)];

            xpToAdd += (40 * amountToGive);

            finalItemsArray.push(itemdata[rand].icon + ' `' + rand + '` x' + amountToGive);

            finalItemsAmounts.push(rand + '|' + amountToGive);
        }
        else if(chance <= 75){
            const amountToGive = 1
            const legendItem = methods.getitems('legendary', {type: 'unboxable', exclude: ['ammo']});

            const rand = legendItem[Math.floor(Math.random() * legendItem.length)];

            xpToAdd += (70 * amountToGive);

            finalItemsArray.push(itemdata[rand].icon + ' `' + rand + '` x' + amountToGive);

            finalItemsAmounts.push(rand + '|' + amountToGive);
        }
        else if(chance <= 76){
            const amountToGive = 1
            const ultraItem = methods.getitems('ultra', {type: 'unboxable'});

            const rand = ultraItem[Math.floor(Math.random() * ultraItem.length)];

            xpToAdd += (80 * amountToGive);

            finalItemsArray.push(itemdata[rand].icon + ' `' + rand + '` x' + amountToGive);

            finalItemsAmounts.push(rand + '|' + amountToGive);
        }
        else if(chance <= 100){
            const amountToGive = Math.floor(Math.random()*(2 - 1 + 1)+ 1); // 1 - 2
            const junkItems = methods.getitems('uncommon', {type: 'unboxable'});

            const rand = junkItems[Math.floor(Math.random() * junkItems.length)];

            xpToAdd += (30 * amountToGive);

            finalItemsArray.push(itemdata[rand].icon + ' `' + rand + '` x' + amountToGive);
            
            finalItemsAmounts.push(rand + '|' + amountToGive);
        }
    }

    query(`UPDATE scores SET points = ${row.points + xpToAdd} WHERE userId = ${message.author.id}`);
    query(`UPDATE items SET care_package = ${row.care_package - 1} WHERE userId = ${message.author.id}`)
    methods.additem(message.author.id, finalItemsAmounts);
    
    const embedDrop = new Discord.RichEmbed()
    .setTitle('You loot the `care_package` and find:')
    .setDescription(finalItemsArray.join('\n'))
    .setColor(14202368)
    .setFooter('⭐ ' + xpToAdd + ' XP earned!');
    message.channel.send(message.author, {embed: embedDrop});
    return;
}