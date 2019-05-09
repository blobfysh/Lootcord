const config = require('../json/_config.json');
const { query } = require('../mysql.js');
const itemdata = require('../json/completeItemList.json');
const Discord = require('discord.js');

exports.initAirdrop = async function(client, guildId){
    var rand       = Math.round(Math.random() * (14400 * 1000)) + (14400 * 1000); // Generate random time from 4 - 8 hours 14400
    const dropChan = await query(`SELECT * FROM guildInfo WHERE guildId = ${guildId}`);
    var foundChan  = client.channels.get(dropChan[0].dropChan);

    if(foundChan){
        console.log(`FOUND CHANNEL ON ${client.shard.id} | counting down from ${rand/1000/60} minutes`);

        let timeObj = {guild: guildId ,timer: setTimeout(() => {
            exports.callAirdrop(client, guildId, 'care_package')
        }, rand)};

        client.airdropTimes.push(timeObj);
    }
}


/* The callAirdrop function can be called from the eval command to drop an item of your choice.
*
* ----EXAMPLE----
* t-eval airdrop.callAirdrop(message.client, message.guild.id, 'rpg', false);
* 
* Will call an airdrop with rpg to be sent to the messager's guild.
*/

exports.callAirdrop = async function(client, guildId, itemToDrop, callAnother = true) {
    const dropChan    = await query(`SELECT * FROM guildInfo WHERE guildId = ${guildId}`);
    const guildPrefix = await query(`SELECT * FROM guildPrefix WHERE guildId = ${guildId}`);

    var prefix = config.prefix;

    if(guildPrefix.length && guildPrefix[0].prefix !== undefined && guildPrefix[0].prefix !== ''){
        prefix = guildPrefix[0].prefix;
    }
    
    client.shard.broadcastEval(`
        const channel = this.channels.get('${dropChan[0].dropChan}');

        if(channel){
            channel.send({embed: {
                    color: 14202368,
                    title: "A \`${itemToDrop}\` has arrived",
                    description: "Use \`${prefix}claimdrop\` to loot it!",
                    image : {
                        url: "${itemdata[itemToDrop].image}",
                    },
                }
            }).catch(err => {});
            true;
        }
        else{
            false;
        }
    `).then(array => {
        console.log(array);
        // array will equal something like: [ true, false, false ]
        // Only allow claiming of drop if the drop was successfully sent.
        if(array.includes(true)){
            query(`UPDATE guildInfo SET dropItem = '${itemToDrop}' WHERE guildId = ${guildId}`);
        }
        if(callAnother) {
            exports.cancelAirdrop(client, guildId);
            exports.initAirdrop(client, guildId);
        }
    });
}

// Used to cancel and airdrop to prevent overlapping setTimeout()'s
exports.cancelAirdrop = function(client, guildId) {

    client.airdropTimes.forEach(arrObj => {

        if(arrObj.guild == guildId){
            //stop the timer
            clearTimeout(arrObj.timer);

            //remove from airdropTimes array
            client.airdropTimes.splice(client.airdropTimes.indexOf(arrObj), 1);
        }

    });

}