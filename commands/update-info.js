const Discord     = require('discord.js');
const { version } = require('../package.json');
const botInfo     = require('../json/_update_info.json');
const inDepthInfo = botInfo.info;

module.exports = {
    name: 'update-info',
    aliases: [''],
    description: 'Displays in-depth information about the current update.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const embedInfo = new Discord.RichEmbed()
        embedInfo.setTitle(`<:update:264184209617321984>**Lootcord Update Info**`)
        embedInfo.setColor(13215302)
        embedInfo.setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/529555281391386629/lc_icon.png")
        inDepthInfo.forEach(arr => {
            embedInfo.addField(arr[0], arr[1], true);
        });
        embedInfo.setFooter("Thank's for reading the update notes! I won't be surprised if I made a million new bugs with this update so please message the bot if you find one.")
        message.channel.send(embedInfo);
    },
}