const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const method = require('../../methods/acc_code_handler.js');

module.exports = {
    name: 'getinfo',
    aliases: ['getinv'],
    description: 'View a users account information.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        let userID = args[0];

        try{
            const row = await query(`SELECT * FROM scores WHERE userId = '${userID}'`);
            const activeRows = await query(`SELECT * FROM userGuilds WHERE userId = '${userID}'`);
            const userInfo = await message.client.fetchUser(userID);
            const accCode = await method.getinvcode(message, userID);

            var activeGuilds = [];
            activeRows.forEach((guild) => {
                activeGuilds.push(guild.guildId);
            });

            const embedInfo = new Discord.RichEmbed()
            .setTitle("`" + userInfo.tag + "`'s data")
            .setDescription('User account code:\n```' + accCode.invCode + "```")
            .setThumbnail(userInfo.avatarURL)
            .addField('Account Created', new Date(row[0].createdAt).toString(), true)
            .addField('Activated in ' + activeGuilds.length + ' servers', activeGuilds, true)
            .setColor(11346517)

            message.channel.send(embedInfo);
        }
        catch(err){
            message.reply('Could not find user.');
        }
    },
}