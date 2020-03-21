const util = require('util');

module.exports = {
    name: 'ping',
    aliases: [''],
    description: "Check the bot's ping",
    long: "Check the bot's ping",
    args: {},
    examples: ["ping"],
    ignoreHelp: true,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    
    async execute(app, message){
        console.log(app.bot.shards.get(app.bot.guildShardMap[message.channel.guild.id]).latency);

        console.log(require('util').inspect(await app.query(`INSERT INTO cooldown (userId, type, start, length) VALUES (?, ?, ?, ?)`, [message.author.id, 'attack', new Date().getTime(), 10000])));
        
        message.reply('hey!');
        /*
        try{
            let user = await app.bot.users.get('168958344361541633');
            let IPCuser = await app.ipc.fetchUser('168958344361541633');
            
            console.log(util.inspect(user, {showHidden: false, depth: null}))
            console.log('vs');
            console.log(util.inspect(IPCuser, {showHidden: false, depth: null}))
            //await (await user.getDMChannel()).createMessage('hey!');
        }
        catch(err){
            console.log(util.inspect(err, {showHidden: false, depth: null}))
        }
        */
    },
}