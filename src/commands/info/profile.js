
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

            const banners    = await app.itm.getUserItems(member.id, { onlyBanners: true });
            const badges     = await app.itm.getBadges(member.id);
            const xp         = app.common.calculateXP(userRow.points, userRow.level);
            
            let bannerIcon   = app.itemdata[userRow.banner] !== undefined ? app.itemdata[userRow.banner].icon : ''
            let bannersList  = '**Equipped:** ' + bannerIcon + '`' + userRow.banner + '`\n' + banners.ultra.concat(banners.legendary, banners.epic, banners.rare, banners.uncommon, banners.common, banners.limited).join('\n');
            let userStatus   = 'Change your status with the `setstatus` command!';
            let badgeList    = ''

            if(userRow.status !== ''){
                userStatus = userRow.status;
            }

            if(badges.length){
                if(userRow.badge !== 'none'){
                    badgeList = '**Display**: ' + app.badgedata[userRow.badge].icon + '`' + userRow.badge + '`\n';
                }

                badgeList += badges.sort().filter(badge => badge !== userRow.badge).map(badge => app.badgedata[badge].icon + '`' + badge + '`').join('\n')
            }
            else {
                badgeList = 'None';
            }

            const profileEmbed = new app.Embed()
            .setColor(13215302)
            .setAuthor(member.tag + "'s Profile", member.avatarURL)
            .setDescription(userStatus)
            .addField('Clan', codeWrap((userRow.clanId !== 0 ? (await app.query(`SELECT name FROM clans WHERE clanId = ${userRow.clanId}`))[0].name : 'None'), 'js'), true)
            .addField('Level', codeWrap(userRow.level + ` (XP: ${xp.curLvlXp} / ${xp.neededForLvl})`, 'js'), true)
            .addField('Power', codeWrap(userRow.power + " / " + userRow.max_power + " Power", 'js'), true)
            .addField('K/D Ratio', codeWrap((userRow.deaths == 0 ? userRow.kills+ " Kills\n"+userRow.deaths+" Deaths ("+userRow.kills+" K/D)\n" : userRow.kills+ " Kills\n"+userRow.deaths+" Deaths ("+(userRow.kills/ userRow.deaths).toFixed(2)+" K/D)"), 'fix'))
            .addField('Health', app.player.getHealthIcon(userRow.health, userRow.maxHealth) + ' ' + userRow.health + "/" + userRow.maxHealth + " HP", true)
            .addField('Strength', parseFloat(userRow.scaledDamage).toFixed(2) + "x damage", true)
            .addField('Luck', userRow.luck.toString(), true)
            .addField('Banners', bannersList, true)
            .addField('Badges', badgeList, true)
            .addField('Preferred Ammo', app.itemdata[userRow.ammo] ? app.itemdata[userRow.ammo].icon + '`' + userRow.ammo + '`' : 'Not set', true)
            .setFooter("🌟 Skills upgraded " + userRow.used_stats + " times")

            message.channel.createMessage(profileEmbed);
        }
    },
}

function codeWrap(input, code){
    return '```' + code + '\n' + input + '```';
}