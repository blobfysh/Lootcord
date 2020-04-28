
module.exports = {
    name: 'disabledropchannel',
    aliases: ['disabledropchan'],
    description: "Will stop requesting airdrops.",
    long: "Stop airdrops from being sent to the server.\nUser **MUST** have the Manage Server permission.",
    args: {},
    examples: [],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: true,
    
    async execute(app, message){
        const guildRow = await app.common.getGuildInfo(message.guild.id);

        if(guildRow.dropChan === 0) return message.reply('❌ Airdrops are not enabled for this server!');

        app.airdrop.cancelAirdrop(message.guild.id);
        await app.query(`UPDATE guildInfo SET dropChan = 0 WHERE guildId ='${message.guild.id}'`);

        message.reply('✅ Successfully stopped requesting airdrops.');
    },
}