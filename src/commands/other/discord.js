module.exports = {
    name: 'discord',
    aliases: ['disc', 'support', 'server'],
    description: "Sends a link to the Lootcord server.",
    long: "Sends a link to the official Lootcord Discord Server.",
    args: {},
    examples: ["deactivate"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    execute(app, message){
        message.channel.createMessage("https://discord.gg/apKSxuE");
    },
}