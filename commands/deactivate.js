const Discord = require('discord.js');
const { query } = require('../mysql.js');
const config    = require('../json/_config.json');
const refresher = require('../methods/refresh_active_role.js');
const methods   = require('../methods/methods');

module.exports = {
    name: 'deactivate',
    aliases: [''],
    description: 'Deactivate your account in a server.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const deactivateCD = methods.getCD(message.client, {
            userId: message.author.id,
            type: 'deactivate'
        });
        const activateCD = methods.getCD(message.client, {
            userId: message.author.id,
            type: 'activate'
        });
        const attackCD = methods.getCD(message.client, {
            userId: message.author.id,
            type: 'attack'
        });

        if(deactivateCD) return message.reply(lang.deactivate[0]);

        if(activateCD) return message.reply(lang.deactivate[1].replace('{0}', activateCD));
        //((3600 * 1000 - ((new Date()).getTime() - row.activateTime)) / 60000).toFixed(1)
        if(attackCD) return message.reply(lang.deactivate[2]);
        
        const botMessage = await message.reply(lang.deactivate[3]);
        await botMessage.react('✅');
        await botMessage.react('❌');
        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };
        
        try{
            const collected = await botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] });
            const reaction = collected.first();
            
            if(reaction.emoji.name === '✅'){
                botMessage.delete();
                await query(`DELETE FROM userGuilds WHERE userId = ${message.author.id} AND guildId = ${message.guild.id}`); //delete user from server 
                
                await methods.addCD(message.client, {
                    userId: message.author.id,
                    type: 'deactivate',
                    time: 86400 * 1000
                });

                message.reply(lang.deactivate[4]);

                if(Object.keys(config.activeRoleGuilds).includes(message.guild.id)){
                    refresher.refreshactives(message);
                }
            }
            else{
                botMessage.delete();
            }
        }
        catch(err){
            botMessage.delete();
            message.reply(lang.errors[3]);
        }
        
    },
}