const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const general = require('../methods/general');

module.exports = {
    name: 'profile',
    aliases: ['p'],
    description: 'Check your stats.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    worksWhenInactive: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang){
        let userOldID = args[0];//RETURNS ID WITH <@ OR <@!

        if(userOldID !== undefined){
            if(!general.isUser(args, true, message)){
                message.reply(lang.errors[1]);
                return;
            }
            let userNameID = general.getUserId(args, true, message);
            userProfile(userNameID, false);
        }
        else{
            userProfile(message.author.id, true);
        }

        async function userProfile(userId, isSelf){
            const userRow = (await query(`SELECT * FROM scores WHERE userId ="${userId}"`))[0];

            if(!userRow){
                return message.reply(lang.errors[0]);
            }

            const banners = await methods.getuseritems(userId, {sep: '`', icon: true, onlyBanners: true});
            const userINFO = await general.getUserInfo(message, userId);

            var bannerIcon = itemdata[userRow.banner] !== undefined ? itemdata[userRow.banner].icon : ''
            var bannersList = 'Equipped: ' + bannerIcon + '`' + userRow.banner + '`\n' + banners.ultra.concat(banners.legendary, banners.epic, banners.rare, banners.uncommon, banners.common, banners.limited).join('\n');
            var userStatus = 'Change your status with setstatus!';

            var backpackIcon = itemdata[userRow.backpack] !== undefined ? itemdata[userRow.backpack].icon : ''
            if(userRow.status !== ''){
                userStatus = userRow.status;
            }

            var currLvlXP        = 0;

            for(var i = 1; i <= userRow.level;i++){
                if(i == userRow.level){
                    break;
                }
                currLvlXP += Math.floor(50*(i**1.7));
            }

            const profileEmbed = new Discord.RichEmbed()
            .setColor(13215302)
            .setAuthor(userINFO.tag + "'s Profile", userINFO.avatarURL)
            .setThumbnail(userINFO.avatarURL)
            .setDescription(userStatus)
            .addField('Stats', (userRow.clanId !== 0 ? 'Member of `' + (await query(`SELECT name FROM clans WHERE clanId = ${userRow.clanId}`))[0].name + '`\n' : '')
            + 'Level ' + userRow.level + ` (XP: ${userRow.points - currLvlXP}/${Math.floor(50*(userRow.level**1.7))})\n`
            + (userRow.deaths == 0 ? userRow.kills+ " Kills | "+userRow.deaths+" Deaths ("+userRow.kills+" K/D)\n" : userRow.kills+ " Kills | "+userRow.deaths+" Deaths ("+(userRow.kills/ userRow.deaths).toFixed(2)+" K/D)\n")
            + userRow.power + "/" + userRow.max_power + " Power")
            .addBlankField()
            .addField('Banners', bannersList, true)
            .addField("Backpack", 'Equipped: ' + backpackIcon + "`" + userRow.backpack + "`", true)
            .addField("Skills", '💗 Health: ' + userRow.health + "/" + userRow.maxHealth + " HP"
            + '\n💥 Strength: ' + parseFloat(userRow.scaledDamage).toFixed(2) + "x damage"
            + '\n🍀 Luck: ' + userRow.luck, true)
            .setFooter("🌟 Skills upgraded " + userRow.used_stats + " times")
            message.channel.send(profileEmbed);
        }
    },
}