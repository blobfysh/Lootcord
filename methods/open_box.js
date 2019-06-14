const Discord   = require('discord.js');
const config    = require('../json/_config.json');
const methods   = require('./methods.js');
const { query } = require('../mysql.js');
const itemdata  = require('../json/completeItemList.json');

exports.open_box = async function(message, lang, type, amount = 1){
    const oldRow = await query(`SELECT * FROM items i
        INNER JOIN scores s
        ON i.userId = s.userId
        WHERE s.userId="${message.author.id}"`);
    const row = oldRow[0];

    const hasEnough = await methods.hasenoughspace(message.author.id);
    
    if(!hasEnough){
        return message.reply(lang.errors[2]);
    }

    var finalMultiItems   = [];
    var finalItemsAmounts = [];
    var xpToAdd           = 0;
    var weightedArr       = generateWeightedArray(type, row.luck);
    console.log(weightedArr.length);

    for(var i = 0; i < amount; i++){
        var rand = pickRandomItem(type, weightedArr);
        var splitRand = rand.item.split('|');

        xpToAdd += rand.xp;
        finalItemsAmounts.push(rand.item);
        finalMultiItems.push(itemdata[splitRand[0]].icon + " " + splitRand[1] + "x `" + splitRand[0] + "`");
    }
    
    methods.additem(message.author.id, finalItemsAmounts);

    query(`UPDATE scores SET points = ${row.points + xpToAdd} WHERE userId = ${message.author.id}`);
    query(`UPDATE items SET ${type} = ${row[type] - amount} WHERE userId = ${message.author.id}`);

    const embedInfo = new Discord.RichEmbed()
    .setAuthor(message.member.displayName, message.author.avatarURL)
    .setColor(14202368)
    if(amount == 1){
        embedInfo.setTitle('You received ' + finalMultiItems);
        embedInfo.setFooter('⭐ ' + xpToAdd + ' XP earned!')
        if(itemdata[finalItemsAmounts[0].split('|')[0]].image != ""){
            embedInfo.setImage(itemdata[finalItemsAmounts[0].split('|')[0]].image);
        }
        else{
            embedInfo.setImage();
        }
    }
    else{
        embedInfo.setFooter('⭐ ' + xpToAdd + ' XP earned!');
        embedInfo.setDescription(finalMultiItems);
        embedInfo.setTitle(amount + " boxes opened.");
    }
    message.channel.send(embedInfo);
}

function generateWeightedArray(type, luck){
    var weightedArr = [];
    var luckMltplr = 0;

    Object.keys(itemdata[type].rates).forEach(percentage => {
        if(parseFloat(percentage) <= 25){
            luckMltplr = luck/2;

            console.log(percentage + ' got boosted');
        }
        else{
            luckMltplr = 0;
        }
        
        for(var i = 0; i < (parseFloat(percentage) * 2) + luckMltplr; i++){ // Multiply the percentage by 2 for accuracy, 0.5 => 1, increase for better accuracy ie. 0.2 => 1 would require multiplier of 5
            weightedArr.push(percentage);
        }
    });

    return weightedArr;
}

function pickRandomItem(type, weightedArray){
    var rand = weightedArray[Math.floor(Math.random() * weightedArray.length)];
    var rewards = itemdata[type].rates[rand].items;

    return {
        xp: itemdata[type].rates[rand].xp,
        item: rewards[Math.floor(Math.random() * rewards.length)]
    };
}