
module.exports = {
    name: 'enablebounty',
    aliases: ['enablebountys', 'enablespawns'],
    description: "Lure strong enemies to your server.",
    long: "Lure strong enemies to randomly spawn in this channel. Defeat them to steal their items and Lootcoin!\nUser **MUST** have the Manage Server permission.",
    args: {},
    examples: [],
    ignoreHelp: true,
    premiumCmd: true,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: true,
    patronTier1Only: true,
    
    async execute(app, message){
        const userSpawns = await app.mysql.select('spawnChannels', 'userId', message.author.id, true);
        if(userSpawns.length > 0 && !app.sets.adminUsers.has(message.author.id) && await app.cd.getCD(message.author.id, 'patron1')) return message.reply('❌ You already have spawns active!\n\nYou are limited to **1** spawn channel. If you would like to disable your active spawns, use `disablebounty`.');
        if(userSpawns.length > 1 && !app.sets.adminUsers.has(message.author.id) && await app.cd.getCD(message.author.id, 'patron2')) return message.reply('❌ You already have spawns active!\n\nYou are limited to **2** spawn channels. If you would like to disable your active spawns, use `disablebounty`.');
        if(userSpawns.length > 2 && !app.sets.adminUsers.has(message.author.id) && await app.cd.getCD(message.author.id, 'patron3')) return message.reply('❌ You already have spawns active!\n\nYou are limited to **3** spawn channels. If you would like to disable your active spawns, use `disablebounty`.');

        const channelSpawns = await app.mysql.select('spawnChannels', 'channelId', message.channel.id, true);
        if(channelSpawns.length > 0) return message.reply('❌ There are already spawns active in this channel.\n\nYou **CAN** call multiple spawns per server, they just have to be in different channels.');

        await app.query(`INSERT INTO spawnChannels (channelId, guildId, userId) VALUES (?, ?, ?)`, [message.channel.id, message.channel.guild.id, message.author.id]);
        
        await app.monsters.initSpawn(message.channel.id);

        message.reply("✅ Enemies will soon spawn here...");
    },
}