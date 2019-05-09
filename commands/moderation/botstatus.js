const config = require('../../json/_config.json');

module.exports = {
    name: 'botstatus',
    aliases: [''],
    description: 'Changes the bots status.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        if(message.channel.id !== config.modChannel && !message.client.sets.adminUsers.has(message.author.id)){
            return message.reply('You must be in the mod-command-center!');
        }
        let activityType = args[0];
        
        let statusInfo = args.slice(1).join(" ");
                        
        if(activityType !== undefined){
            try{
                if(statusInfo == 'reset'){
                    message.client.shard.broadcastEval(`this.shard.fetchClientValues('guilds.size').then(results => {
                        var result = results.reduce((prev, guildCount) => prev + guildCount, 0);
                        this.user.setActivity('t-help | ' + result + ' servers!', {type: '${activityType}'});
                        result;
                    })`).then(console.log)
                }
                else if(statusInfo == ''){
                    message.client.shard.broadcastEval(`this.user.setActivity('t-help', {type: '${activityType}'});`);
                }
                else{
                    message.client.shard.broadcastEval(`this.user.setActivity('t-help | ${statusInfo}', {type: '${activityType}'});`);
                    message.reply("Status set!");
                }
            }
            catch(err){
                message.reply("Something went wrong. Make sure you input the correct info.")
            }
        }
        else{
            message.reply("ERROR. `"+prefix+"status (ACTIVITY : ex. 'playing')(STATUS)`");
        }
    },
}