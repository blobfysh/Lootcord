const Discord = require('discord.js');
const config = require('../../json/_config.json');

module.exports = {
    name: 'shards',
    aliases: ['shardinfo', 'shardsinfo'],
    description: 'Shows information about shards.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const shardsInfo = await message.client.shard.broadcastEval(`
            let shardInfoArr = [];

            shardInfoArr.push(this.shard.id);
            shardInfoArr.push(this.users.size);
            shardInfoArr.push(this.guilds.size);
            shardInfoArr.push(this.uptime);

            shardInfoArr;
        `);

        const shardEmb = new Discord.RichEmbed()
        .setTitle('Shard Information')
        .setDescription(message.client.shard.count + ' total shards')

        for(var i = 0; i < shardsInfo.length; i++){
            let userCt = shardsInfo[i][1];
            let guildCt = shardsInfo[i][2];
            let shrdUptime = shardsInfo[i][3];
            let shardId = 'Shard ' + shardsInfo[i][0];

            if(shardsInfo[i][0] == message.client.shard.id){
                shardId = '✅ Shard ' + shardsInfo[i][0];
            }
            
            shardEmb.addField(shardId, `◽ Users: ${userCt.toString().padEnd(10, ' . .')} ◽ Guilds: ${guildCt.toString().padEnd(10, ' . .')} ◽ Uptime: ${convertToTime(shrdUptime)}`);
        }

        message.channel.send(shardEmb);
    },
}

function convertToTime(ms){
    var seconds = (ms / 1000).toFixed(1);

    var minutes = (ms / (1000 * 60)).toFixed(1);

    var hours = (ms / (1000 * 60 * 60)).toFixed(1);

    var days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);

    if (seconds < 60) {
        return seconds + " seconds";
    } 
    else if (minutes < 60) {
        return minutes + " minutes";
    } 
    else if (hours < 24) {
        return hours + " hours";
    } 
    else {
        return days + " days"
    }
}