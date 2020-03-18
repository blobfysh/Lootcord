const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const badgedata = require('../json/badges');
const general = require('../methods/general');

module.exports = {
    name: 'profile',
    aliases: ['p', 'badges', 'kills', 'deaths', 'banners'],
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
            const badges = await general.getBadges(userId);

            var bannerIcon = itemdata[userRow.banner] !== undefined ? itemdata[userRow.banner].icon : ''
            var bannersList = 'Equipped: ' + bannerIcon + '`' + userRow.banner + '`\n' + banners.ultra.concat(banners.legendary, banners.epic, banners.rare, banners.uncommon, banners.common, banners.limited).join('\n');
            var userStatus = 'Change your status with `setstatus`!';

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
            .setDescription(userStatus)
            .addField('Badges', badges.length ? badges.map(badge => badgedata[badge].icon).join(' ') : 'none :(')
            .addField('Clan', (userRow.clanId !== 0 ? '`' + (await query(`SELECT name FROM clans WHERE clanId = ${userRow.clanId}`))[0].name + '`\n' : 'None'), true)
            .addField('Level', userRow.level + ` (XP: ${userRow.points - currLvlXP}/${Math.floor(50*(userRow.level**1.7))})`, true)
            .addField('K/D Ratio', (userRow.deaths == 0 ? userRow.kills+ " Kills | "+userRow.deaths+" Deaths ("+userRow.kills+" K/D)\n" : userRow.kills+ " Kills | "+userRow.deaths+" Deaths ("+(userRow.kills/ userRow.deaths).toFixed(2)+" K/D)"), true)
            .addField('Power', userRow.power + "/" + userRow.max_power + " Power", true)
            .addBlankField(true)
            .addBlankField(true)
            .addField('Health', methods.getHealthIcon(userRow.health, userRow.maxHealth) + ' ' + userRow.health + "/" + userRow.maxHealth + " HP", true)
            .addField('Strength', parseFloat(userRow.scaledDamage).toFixed(2) + "x damage", true)
            .addField('Luck', userRow.luck, true)
            .addBlankField()
            .addField('Banners', bannersList, true)
            .addField("Backpack", 'Equipped: ' + backpackIcon + "`" + userRow.backpack + "`", true)
            .addField('Preferred Ammo', itemdata[userRow.ammo] ? itemdata[userRow.ammo].icon + '`' + userRow.ammo + '`' : 'Not set\n(Set with `setammo <ammo>`)', true)
            .setFooter("🌟 Skills upgraded " + userRow.used_stats + " times")

            message.channel.send(profileEmbed);
        }
    },
}