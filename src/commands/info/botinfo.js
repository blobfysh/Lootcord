const { version } = require('../../../package.json');
const additions = [
    "Bot has been rewritten from ground up.",
    "New ammunition, most weapons now have multiple types of ammunition.",
    "Balance changes: `trade` command no longer allows *giving* items to other players, you must be making atleast some kind of offer.",
    "Limits on clan bank, this is due to players hoarding loads of money in the bank, and having little risk of being raided.",
    "The `upgrade` command has been changed so that you can buy better stats. Keep in mind a `reroll_scroll` will still reset these skills (money will not be given back). So be sure of what skills you upgrade!",
    "Gamble commands have been limited to 1 million Lootcoin, this is because the commands were negatively effecting the economy of the bot.",
    "New cooldowns system, all weapons have unique cooldown times and the cooldown time displayed in commands is more descriptive.",
    "New currency icon drawn by Flicky#9065, there has also been tons of visual changes to the bot's commands.",
    "Equipping an item will now automatically unequip an item. Now you don't need to unequip everytime you want to equip a new banner!",
    "Active clans in the server has been added to the `active` command.",
    "**NEW COMMANDS** `badges` command shows new badges. `setammo` sets your preferred ammo type. `setbadge` sets your display badge. `daily` command lets you claim an `ultra_box` every 24 hours!",
    "`prestige` system and **badges**! Badges can be displayed next to your name on the `leaderboard`, `clan info`, `active` commands and other places. Now you can show off just how much loot you've collected.",
    "**Rewards for [donating](https://ko-fi.com/blobfysh)!**"
];
const removed = [
    "`play` command no longer creates an account. Accounts are created automatically! The `play` command was renamed to `activate`, it's only purpose now is to activate your account in a server.",
    "You can no longer message the bot to contact bot moderators. This was because 90% of the messages we received were spam or just made 0 sense. If you truly need help from our moderators, you should join the `support` server!",
    "`delete` command removed. If you would like us to delete your account from the database for any reason, please join the `support` server and ask a moderator.",
];

module.exports = {
    name: 'botinfo',
    aliases: ['update', 'info', 'version', 'stats'],
    description: "Displays various information about the bot.",
    long: "Displays information about the current update and the bot.",
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let used = process.memoryUsage().heapUsed / 1024 / 1024;
        let stats = JSON.parse(await app.cache.get('stats')) || {};

        const embedInfo = new app.Embed()
        embedInfo.setTitle(`Lootcord Update Info`)
        embedInfo.setColor(13215302)
        embedInfo.setThumbnail(app.bot.user.avatarURL)
        embedInfo.setDescription('Bot has been rewritten in Eris!\n\nRead [here](https://lootcord.com/blog) for more on the update!')
        embedInfo.addField("Shard ID", codeWrap(message.guild.shard.id.toString(), 'js'), true)
        embedInfo.addField("Cluster ID", codeWrap(app.clusterID.toString(), 'js'), true)
        embedInfo.addField("Active Servers", codeWrap(stats.guilds || '1', 'js'), true)
        embedInfo.addField("Uptime", codeWrap(app.cd.convertTime(app.bot.uptime), 'fix'), true)
        embedInfo.addField("Memory Usage", codeWrap(Math.round(used) + " MB", 'fix'),true)
        embedInfo.addField("Library", codeWrap("Eris", 'js'), true)
        embedInfo.addField("Creators","blobfysh#4679\nOGSteve#0007",true)
        embedInfo.addField("Website", "https://lootcord.com",true)
        embedInfo.addField("Discord","https://discord.gg/apKSxuE",true)
        message.channel.createMessage(embedInfo);
    },
}

function codeWrap(input, code){
    return '```' + code + '\n' + input + '```';
}