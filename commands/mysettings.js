const { query } = require('../mysql.js');
const Discord   = require('discord.js');
const itemdata  = require('../json/completeItemList');
const badgedata = require('../json/badges');

module.exports = {
    name: 'mysettings',
    aliases: ['usersettings', 'settings'],
    description: 'View your settings and how to change them.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: true,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const userRow  = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];

        var notifyBmStr = userRow.notify1 ? '(Disable with `togglebmnotify`)' : '(Enable with `togglebmnotify`)';
        var notifyDeathStr = userRow.notify2 ? '(Disable with `toggleattacknotify`)' : '(Enable with `toggleattacknotify`)';
        var notifyRaidedStr = userRow.notify3 ? '(Disable with `toggleraidnotify`)' : '(Enable with `toggleraidnotify`)';
        
        const settings = new Discord.RichEmbed()
        .setAuthor('Settings for: ' + message.author.tag, message.author.avatarURL)
        .addField(`Notify you when your listing on the Black Market sells:`, userRow.notify1 ? '✅ Enabled ' + notifyBmStr : '❌ Disabled ' + notifyBmStr)
        .addField(`Notify you when you've been attacked:`, userRow.notify2 ? '✅ Enabled ' + notifyDeathStr : '❌ Disabled ' + notifyDeathStr)
        .addField(`Notify you when your clan is raided:`, userRow.notify3 ? '✅ Enabled ' + notifyRaidedStr: '❌ Disabled ' + notifyRaidedStr)
        .addField('Preferred Ammo (Will prioritize this ammo type when attacking other players)', itemdata[userRow.ammo] ? itemdata[userRow.ammo].icon + '`' + userRow.ammo + '`' : '❌ Not set (Set with `setammo <ammo>`)', true)
        .addField('Display Badge', badgedata[userRow.badge] ? badgedata[userRow.badge].icon + '`' + userRow.badge + '`' : '❌ Not set (Set with `setbadge <badge>`)')

        message.reply(settings);
    },
}