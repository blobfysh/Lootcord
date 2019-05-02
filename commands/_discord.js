module.exports = {
    name: 'discord',
    aliases: ['disc', 'support'],
    description: 'Sends a link to the Lootcord server.',
    hasArgs: false,
    worksInDM: true,
    requiresAcc: false,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        message.channel.send("https://discord.gg/7XNbdzP");
    },
}