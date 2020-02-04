const Discord   = require('discord.js');
const { query } = require('../../mysql.js');
const methods   = require('../../methods/methods.js');
const itemdata  = require('../../json/completeItemList.json');
const airdrop   = require('../../utils/airdrop.js');
const os        = require('os');
const { decodeCode } = require('../../methods/acc_code_handler');
const cache     = require('../../utils/cache');

module.exports = {
    name: 'eval',
    aliases: [''],
    description: 'Admin-only command.',
    hasArgs: true,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: true,
    
    execute(message, args, lang, prefix){
        let commandInput = message.content.substring(6);
        
        try{
            let evaled = eval(commandInput);
            if(typeof evaled !== "string") evaled = require("util").inspect(evaled);
            message.channel.send(evaled, {code:"x1"});
        }
        catch(err){
            message.reply("Something went wrong. Command only works with `t-` prefix. ```"+err+"```");
        }
    },
}