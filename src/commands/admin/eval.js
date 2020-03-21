module.exports = {
    name: 'eval',
    aliases: [''],
    description: 'Admin-only command.',
    requiresAcc: false,
    
    async execute(app, message){
        let commandInput = message.content.substring(6);
        
        try{
            let start = new Date().getTime();
            let evaled = await eval(commandInput);
            let end = new Date().getTime();

            if(typeof evaled !== "string") evaled = require("util").inspect(evaled);

            let segments = evaled.match(/[\s\S]{1,1500}/g);

            if(segments.length == 1){
                const evalEmbed = new app.Embed()
                .setDescription('```js\n' + segments[0] + '```')
                .setColor(12118406)
                .setFooter((end - start) + 'ms');
                message.channel.createMessage(evalEmbed);
            }
            else{
                for(var i = 0; i < (segments.length < 5 ? segments.length : 5); i++){
                    await message.channel.createMessage('```js\n' + segments[i] + '```');
                }
            }
        }
        catch(err){
            const evalEmbed = new app.Embed()
            .setTitle('Something went wrong.')
            .setDescription('```js\n' + err + '```')
            .setColor(13914967)
            message.channel.createMessage(evalEmbed);
        }
    },
}