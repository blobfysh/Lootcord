
module.exports = {
    name: 'ping',
    aliases: [''],
    description: "Check the bot's ping",
    long: "Check the bot's ping",
    args: {},
    examples: [],
    ignoreHelp: true,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    
    async execute(app, message){
        message.reply(`Pong! ws: ${app.bot.shards.get(app.bot.guildShardMap[message.channel.guild.id]).latency} ms`);
        /*

        awaiting message
        const messages = await app.msgCollector.awaitMessages(message.author.id, message.channel.id, m => {
            return m.author.id === message.author.id
        }, {maxMatches: 1});

        app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => m.author.id === message.author.id);

        const usercollector = app.msgCollector.collectors[`${message.author.id}_${message.channel.id}`].collector;

        usercollector.on('collect', m => {
            m.channel.createMessage(`<@${m.author.id}>, You must be that unique user!`);
        });
        usercollector.on('end', reason => {
            console.log(reason);
            message.channel.createMessage('The user collector ended!');
        });

        app.msgCollector.createChannelCollector(message, m => m.channel.id === message.channel.id);

        const collector = app.msgCollector.collectors[`${message.channel.id}`].collector;

        collector.on('collect', m => {
            m.channel.createMessage(`<@${m.author.id}>, I found you!`);
        });
        collector.on('end', reason => {
            console.log(reason);
            message.channel.createMessage('The channel collector ended!');
        });
        */


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