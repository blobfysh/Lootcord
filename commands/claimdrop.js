const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const config = require('../json/_config');

module.exports = {
    name: 'claimdrop',
    aliases: [''],
    description: 'Claim a `care_package` drop.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const guildInfo = await query(`SELECT * FROM guildInfo WHERE guildId = ${message.guild.id}`);
        const airdropCD = methods.getCD(message.client, {
            userId: message.author.id,
            type: 'airdrop'
        });
        const hasEnough = await methods.hasenoughspace(message.author.id, 1);
    

        if(message.channel.id !== guildInfo[0].dropItemChan){
            return message.reply(lang.claimdrop[0]);
        }
        
        if(guildInfo[0].dropItem == ''){
            return message.reply(lang.claimdrop[1]);
        }
        else if(airdropCD){
            return message.reply(`You need to wait  \`${airdropCD}\`  before claiming another airdrop.`);
        }
        else if(!hasEnough) return message.reply(lang.errors[2]);
        
        else{
            methods.additem(message.author.id, guildInfo[0].dropItem, 1);
            query(`UPDATE guildInfo SET dropItem = '' WHERE guildId = ${message.guild.id}`);
            query(`UPDATE guildInfo SET dropItemChan = 0 WHERE guildId = ${message.guild.id}`);

            await methods.addCD(message.client, {
                userId: message.author.id,
                type: 'airdrop',
                time: config.cooldowns.claimdrop * 1000
            });

            message.reply(`You got the \`${guildInfo[0].dropItem}\`!`);
        }
    },
}