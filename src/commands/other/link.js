module.exports = {
    name: 'link',
    aliases: ['invite'],
    description: "Sends a link to invite the bot.",
    long: "Sends a link to invite the bot.",
    args: {},
    examples: ["link"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    execute(app, message){
        message.channel.createMessage("https://discordapp.com/oauth2/authorize?client_id=493316754689359874&permissions=388160&scope=bot");
    },
}