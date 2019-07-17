const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const general = require('../methods/general');

module.exports = {
    name: 'profile',
    aliases: [''],
    description: 'Check your stats.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang){
        let userOldID = args[0];//RETURNS ID WITH <@ OR <@!

        if(userOldID !== undefined){
            if(!userOldID.startsWith("<@")){
                message.reply(lang.errors[1]);
                return;
            }
            let userNameID = args[0].replace(/[<@!>]/g, '');
            userProfile(userNameID, false);
        }
        else{
            userProfile(message.author.id, true);
        }

        async function userProfile(userId, isSelf){
            const row = (await query(`SELECT * FROM scores 
            INNER JOIN items
            ON scores.userId = items.userId
            WHERE scores.userId ="${userId}"`))[0];
            const banners = await methods.getuseritems(userId, {sep: '`', icon: true, onlyBanners: true});
            const userINFO = await general.getUserInfo(message, userId);

            if(!row){
                return message.reply(lang.errors[0]);
            }

            var bannerIcon = itemdata[row.banner] !== undefined ? itemdata[row.banner].icon + ' ' : ''
            var bannersList = 'Equipped: ' + bannerIcon + '`' + row.banner + '`\n' + banners.ultra.concat(banners.legendary, banners.epic, banners.rare, banners.uncommon, banners.common, banners.limited).join('\n');
            var userStatus = 'Change your status with setstatus!';

            var backpackIcon = itemdata[row.backpack] !== undefined ? itemdata[row.backpack].icon + ' ' : ''
            if(row.status !== ''){
                userStatus = row.status;
            }

            var currLvlXP        = 0;

            for(var i = 1; i <= row.level;i++){
                var xpNeeded = Math.floor(50*(i**1.7));
                if(i == row.level){
                    break;
                }
                currLvlXP += xpNeeded;
            }

            const profileEmbed = new Discord.RichEmbed()
            .setColor(13215302)
            .setAuthor((await general.getUserInfo(message, userId, true)).displayName + "'s Profile", userINFO.avatarURL)
            .setThumbnail(userINFO.avatarURL)
            .setDescription(userStatus)
            .addField('Stats', (row.clanId !== 0 ? 'Member of `' + (await query(`SELECT name FROM clans WHERE clanId = ${row.clanId}`))[0].name + '`\n' : '')
            + 'Level ' + row.level + ` (${row.points - currLvlXP}/${Math.floor(50*(row.level**1.7))})\n`
            + (row.deaths == 0 ? row.kills+ " Kills | "+row.deaths+" Deaths ("+row.kills+" K/D)\n" : row.kills+ " Kills | "+row.deaths+" Deaths ("+(row.kills/ row.deaths).toFixed(2)+" K/D)\n")
            + row.power + "/" + row.max_power + " Power")
            .addBlankField()
            .addField('Banners', bannersList, true)
            .addField("Backpack", 'Equipped: ' + backpackIcon + "`" + row.backpack + "`", true)
            .addField("Skills", '💗 Vitality: ' + row.health + "/" + row.maxHealth + " HP"
            + '\n💥 Strength: ' + parseFloat(row.scaledDamage).toFixed(2) + "x damage"
            + '\n🍀 Luck: ' + row.luck, true)
            .setFooter("🌟 " + row.stats + " Available skill points")
            message.channel.send(profileEmbed);
        }
    },
}