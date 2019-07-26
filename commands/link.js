module.exports = {
    name: 'link',
    aliases: ['invite'],
    description: 'Sends a link to invite the bot.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        message.channel.send("https://discordapp.com/oauth2/authorize?client_id=493316754689359874&permissions=388160&scope=bot");
    },
}