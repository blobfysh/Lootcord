module.exports = {
    name: 'setprefix',
    aliases: ['prefix'],
    description: "Changes bot prefix for server.",
    long: "Used to change the prefix for the server.\nUser **MUST** have the Manage Server permission.",
    args: {"prefix": "Input to change server prefix to. Must be 1-3 characters long."},
    examples: ["setprefix t!"],
    ignoreHelp: false,
    requiresAcc: false,
    requiresActive: false,
    guildModsOnly: true,
    
    async execute(app, message){
        let prefixString = message.args[0];

        if(prefixString == undefined || prefixString == "" || prefixString.length > 5){
            return message.reply(`Please enter a prefix up to 5 characters long! \`${message.prefix}setprefix *****\``);
        }

        let prefixRow = (await app.query(`SELECT * FROM guildPrefix WHERE guildId = "${message.guild.id}"`))[0];

        if(prefixRow) await app.query(`DELETE FROM guildPrefix WHERE guildId = "${message.guild.id}"`);

        prefixString = prefixString.toLowerCase();

        await app.query("INSERT IGNORE INTO guildPrefix (guildId, prefix) VALUES (?, ?)", [message.guild.id, prefixString]);
        await app.cache.set(`prefix|${message.guild.id}`, prefixString, 43200);
            
        message.reply(`Server prefix successfully changed to \`${prefixString}\``);
    },
}