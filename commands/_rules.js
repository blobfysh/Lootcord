const Discord = require('discord.js');

module.exports = {
    name: 'rules',
    aliases: [''],
    description: 'Receive a free item_box every hour!',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        const ruleInfo = new Discord.RichEmbed()

        .setTitle("Official Lootcord Bot Rules")
        .setDescription(`1. **Do NOT exploit bugs.** Bugs, if found, should be reported to the moderators so we can remove it. You can send a message to the bot through DMs and it will be sent to the moderators. If found to be exploiting bugs, your account data will be reset.\n
        2. **Do not use alt or "puppet" accounts.** The use of secondary accounts operated by you to avoid cooldowns, hoard weapons to avoid loss upon death, organize attacks on a target, farm boxes or in any other way considered unfair to others will result in a warning or in later offenses punishment.\n
        3. **Do not leave servers after attacking someone to deactivate your account and avoid counterattacks.** This is known as cooldown dodging, and is automatically reported to moderators on offense.\n
        4. **No kill-farming.** Killing someone then trading items back to the other person in order to gain kill count without consequences.`)
        .setColor(13215302)
        .setFooter("Rules subject to change.")

        message.channel.send(ruleInfo);
    },
}