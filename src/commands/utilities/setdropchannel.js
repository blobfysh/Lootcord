
module.exports = {
    name: 'setdropchannel',
    aliases: ['setdropchan'],
    description: "Will send care_package drops to the channel it was used in.",
    long: "Request care_packages to be sent to the specified channel.\nServer **MUST** have at least 5 active players.\nUser **MUST** have the Manage Server permission.",
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: true,
    
    async execute(app, message){
        const guildRow = await app.common.getGuildInfo(message.channel.guild.id);
        const activeRow = await app.query(`SELECT * FROM userGuilds WHERE guildId = ${message.channel.guild.id}`);
        
        if(Object.keys(activeRow).length < 5){
            return message.reply('❌ There needs to be at least `5` active players in this server to call in airdrops.');
        }

        await app.query(`UPDATE guildInfo SET dropChan = ${message.channel.id} WHERE guildId = ${message.channel.guild.id}`);
        
        message.reply("✅ Now requesting for `care_package`'s to be sent to this channel!");

        if(guildRow.dropChan == 0){
            app.airdrop.initAirdrop(message.channel.guild.id);
        }
    },
}