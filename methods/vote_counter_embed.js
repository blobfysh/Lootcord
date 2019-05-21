const Discord = require('discord.js');

exports.getCounter = function(counterVal){
    var rewardString = '';
    
    for(var i = 0; i < 5; i++){
        // Iterate 5 times
        if(counterVal >= i + 1){
            rewardString += '☑ Day ' + (i + 1) + ': `ultra_box`\n';
        }
        else{
            rewardString += '❌ Day ' + (i + 1) + ': `ultra_box`\n';
        }
    }
    
    if(counterVal >= 6){
        rewardString += '✨ Day 6: `supply_signal`';
    }
    else{
        rewardString += '❌ Day 6: `supply_signal`';
    }

    const embed = new Discord.RichEmbed()
    .setTitle('Voting rewards!')
    .setDescription(rewardString)
    .setImage("https://cdn.discordapp.com/attachments/454163538886524928/543014649554272277/greypleLine.png")
    .setFooter('Vote 6 days in a row to receive a supply_signal!')

    return embed;
}