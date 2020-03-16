const Discord   = require('discord.js');
const { query } = require('../../mysql.js');
const methods   = require('../../methods/methods.js');
const itemdata  = require('../../json/completeItemList.json');
const airdrop   = require('../../utils/airdrop.js');
const os        = require('os');
const { decodeCode } = require('../../methods/acc_code_handler');
const general = require('../../methods/general');

module.exports = {
    name: 'eval',
    aliases: [''],
    description: 'Admin-only command.',
    hasArgs: true,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        let commandInput = message.content.substring(6);
        let cache = message.client.cache;
        
        try{
            let start = new Date().getTime();
            let evaled = await eval(commandInput);
            let end = new Date().getTime();

            if(typeof evaled !== "string") evaled = require("util").inspect(evaled);

            let segments = evaled.match(/[\s\S]{1,1000}/g);

            if(segments.length == 1){
                const evalEmbed = new Discord.RichEmbed()
                .setDescription('```js\n' + segments[0] + '```')
                .setColor(12118406)
                .setFooter((end - start) + 'ms');
                message.channel.send(evalEmbed);
            }
            else{
                for(var i = 0; i < segments.length; i++){
                    await message.channel.send(segments[i], {code:'js'});
                }
            }
        }
        catch(err){
            const evalEmbed = new Discord.RichEmbed()
            .setTitle('Something went wrong.')
            .setDescription('```js\n' + err + '```')
            .setColor(13914967)
            message.channel.send(evalEmbed);
        }
    },
}