module.exports = {
    name: 'togglerandomattacks',
    aliases: ['randomonly', 'togglerandomattack', 'togglerandattacks', 'togglerandattack', 'togglerandonly'],
    description: "Toggles the server to only allow random attacks.",
    long: "Toggle the server to only support random attacks with the use command.\nUser **MUST** have the Manage Server permission.\nRandom attacks allow you to choose from 3 random users if the server has more than 6 active players.",
    args: {},
    examples: [],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: true,
    
    async execute(app, message){
        const guildRow = await app.common.getGuildInfo(message.channel.guild.id);
        
        if(guildRow.randomOnly == 0){
            await app.query(`UPDATE guildInfo SET randomOnly = 1 WHERE guildId = ${message.channel.guild.id}`);

            message.reply('✅ This server is now in random-only mode.');
        }
        else{
            await app.query(`UPDATE guildInfo SET randomOnly = 0 WHERE guildId = "${message.channel.guild.id}"`);

            message.reply('❌ Server no longer in random-only mode.');
        }
    },
}