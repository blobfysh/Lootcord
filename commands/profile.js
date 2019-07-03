const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');

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
            const oldRow = await query(`SELECT * FROM scores 
            INNER JOIN items
            ON scores.userId = items.userId
            WHERE scores.userId ="${userId}"`);
            const banners = await methods.getuseritems(userId, {sep: '`', icon: true, onlyBanners: true});

            if(!oldRow.length){
                return message.reply(lang.errors[0]);
            }

            const row = oldRow[0];

            var bannerIcon = itemdata[row.banner] !== undefined ? itemdata[row.banner].icon + ' ' : ''
            var bannersList = '**Equipped:** ' + bannerIcon + '`' + row.banner + '`\n' + banners.ultra.concat(banners.legendary, banners.epic, banners.rare, banners.uncommon, banners.common, banners.limited).join('\n');
            var userStatus = 'Change your status with setstatus!';

            var backpackIcon = itemdata[row.backpack] !== undefined ? itemdata[row.backpack].icon + ' ' : ''
            if(row.status !== ''){
                userStatus = row.status;
            }

            const profileEmbed = new Discord.RichEmbed()
            .setColor(13215302)
            .setAuthor(message.guild.members.get(userId).displayName + "'s Profile", message.guild.members.get(userId).avatarURL)
            .setThumbnail(message.guild.members.get(userId).user.avatarURL)
            .setDescription(row.kills+ " Kills | "+row.deaths+" Deaths ("+(row.kills/ row.deaths).toFixed(2)+" K/D)\n" + row.power + "/" + row.max_power + " Power")
            .addField('Status', '```' + userStatus + '```')
            .addBlankField()
            .addField("💗 Vitality", row.health + "/" + row.maxHealth + " HP", true)
            .addField('🔰 Banners', bannersList, true)
            .addField("💥 Strength", parseFloat(row.scaledDamage).toFixed(2) + "x damage", true)
            .addField("Backpack", backpackIcon + "`" + row.backpack + "`", true)
            .addField("🍀 Luck", row.luck)
            .addBlankField()
            .setFooter("🌟 " + row.stats + " Available skill points")
            
            if(row.deaths == 0){
                profileEmbed.setDescription(row.kills+ " Kills | "+row.deaths+" Deaths ("+row.kills+" K/D)\n" + row.power + "/" + row.max_power + " Power")
            }
            if(row.clanId !== 0){
                profileEmbed.setTitle('Member of `' + (await query(`SELECT name FROM clans WHERE clanId = ${row.clanId}`))[0].name + '`')
            }
            message.channel.send(profileEmbed);
        }
    },
}