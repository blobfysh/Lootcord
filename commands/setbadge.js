const { query } = require('../mysql.js');
const general = require('../methods/general');
const badgedata = require('../json/badges');

module.exports = {
    name: 'setbadge',
    aliases: [''],
    description: 'Sets a badge to display.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const playerBadges  = await general.getBadges(message.author.id);
        const badgeToSet = general.parseBadgeWithSpaces(args[0], args[1]);

        if(badgeToSet == 'none'){
            await query(`UPDATE scores SET badge = 'none' WHERE userId = ${message.author.id}`);

            return message.reply(`✅ Successfully cleared your display badge!`);
        }
        else if(!badgedata[badgeToSet]){
            return message.reply("❌ I don't recognize that badge.");
        }
        else if(!playerBadges.includes(badgeToSet)){
            return message.reply("❌ You don't own that badge!");
        }

        await query(`UPDATE scores SET badge = '${badgeToSet}' WHERE userId = ${message.author.id}`);

        message.reply(`✅ Successfully made ${badgedata[badgeToSet].icon} \`${badgeToSet}\` your display badge!`);
    },
}