/*
const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const itemdata = require('../json/completeItemList.json');
const badgedata = require('../json/badges');
const general = require('../methods/general');
*/
module.exports = {
    name: 'profile',
    aliases: ['p', 'badges', 'kills', 'deaths', 'banners'],
    description: 'Check your stats.',
    long: 'Displays a users profile. Shows their stats, currently equipped items and their status.',
    args: {
        "@user/discord#tag": "User's profile to check."
    },
    examples: ["profile blobfysh#4679"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let member = app.parse.members(message, message.args)[0];
        
        if(!member){
            if(message.args.length){
                message.reply('❌ Could not find anyone matching that description!\nYou can mention someone, use their Discord#tag, or type their user ID');
                return;
            }
            
            userProfile(message.member);
        }
        else{
            userProfile(member);
        }

        async function userProfile(member){
            const userRow = await app.player.getRow(member.id);

            if(!userRow){
                return message.reply(`❌ The person you're trying to search doesn't have an account!`);
            }

            const banners = await app.itm.getUserItems(message.author.id, { onlyBanners: true });
            const badges = await app.itm.getBadges(member.id);
            let xp = app.common.calculateXP(userRow.points, userRow.level);
            let bannerIcon = app.itemdata[userRow.banner] !== undefined ? app.itemdata[userRow.banner].icon : ''
            let bannersList = 'Equipped: ' + bannerIcon + '`' + userRow.banner + '`\n' + banners.ultra.concat(banners.legendary, banners.epic, banners.rare, banners.uncommon, banners.common, banners.limited).join('\n');
            let userStatus = 'Change your status with the `setstatus` command!';

            let backpackIcon = app.itemdata[userRow.backpack] !== undefined ? app.itemdata[userRow.backpack].icon : ''
            if(userRow.status !== ''){
                userStatus = userRow.status;
            }

            const profileEmbed = new app.Embed()
            .setColor(13215302)
            .setAuthor(member.tag + "'s Profile", member.avatarURL)
            .setDescription(userStatus)
            .addField('Badges', badges.length ? badges.map(badge => badgedata[badge].icon).join(' ') : 'none :(')
            .addField('Clan', (userRow.clanId !== 0 ? '`' + (await app.query(`SELECT name FROM clans WHERE clanId = ${userRow.clanId}`))[0].name + '`\n' : 'None'), true)
            .addField('Level', userRow.level + ` (XP: ${xp.current}/${xp.needed})`, true)
            .addField('K/D Ratio', (userRow.deaths == 0 ? userRow.kills+ " Kills | "+userRow.deaths+" Deaths ("+userRow.kills+" K/D)\n" : userRow.kills+ " Kills | "+userRow.deaths+" Deaths ("+(userRow.kills/ userRow.deaths).toFixed(2)+" K/D)"), true)
            .addField('Power', userRow.power + "/" + userRow.max_power + " Power", true)
            .addBlankField(true)
            .addBlankField(true)
            .addField('Health', app.player.getHealthIcon(userRow.health, userRow.maxHealth) + ' ' + userRow.health + "/" + userRow.maxHealth + " HP", true)
            .addField('Strength', parseFloat(userRow.scaledDamage).toFixed(2) + "x damage", true)
            .addField('Luck', userRow.luck.toString(), true)
            .addBlankField()
            .addField('Banners', bannersList, true)
            .addField("Backpack", 'Equipped: ' + backpackIcon + "`" + userRow.backpack + "`", true)
            .addField('Preferred Ammo', app.itemdata[userRow.ammo] ? app.itemdata[userRow.ammo].icon + '`' + userRow.ammo + '`' : 'Not set\n(Set with `setammo <ammo>`)', true)
            .setFooter("🌟 Skills upgraded " + userRow.used_stats + " times")

            message.channel.createMessage(profileEmbed);
        }
    },
}