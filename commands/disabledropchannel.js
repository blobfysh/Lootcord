const { query } = require('../mysql.js');
const airdrop = require('../utils/airdrop.js');

module.exports = {
    name: 'disabledropchannel',
    aliases: ['disabledropchan'],
    description: 'Will stop requesting airdrops.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: true,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        const guildRow = await query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`)
        const activeRow = await query(`SELECT * FROM userGuilds WHERE guildId = ${message.guild.id}`);
        if(!guildRow.length) query("INSERT INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItem) VALUES (?, ?, ?, ?, ?)", [message.guild.id, "", "", "", ""]);

        
        message.client.shard.broadcastEval(`
            this.airdropTimes.forEach(arrObj => {

                if(arrObj.guild == ${message.guild.id}){
                    //stop the timer
                    clearTimeout(arrObj.timer);
        
                    //remove from airdropTimes array
                    this.airdropTimes.splice(this.airdropTimes.indexOf(arrObj), 1);
        
                    console.log('canceled a timeout');
                }
        
            });
        `);

        query(`UPDATE guildInfo SET dropChan = 0 WHERE guildId ='${message.guild.id}'`);
        message.reply(lang.disabledropchannel[0]);
    },
}