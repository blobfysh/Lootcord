const { query } = require('../mysql.js');
const Filter = require('bad-words');
const filter = new Filter();

module.exports = {
    name: 'setstatus',
    aliases: [''],
    description: 'Sets the users status to display in commands!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const oldRow = await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`)
        const row = oldRow[0];

        var statusToSet = args.join(" ");

        if(statusToSet.length > 120){
            return message.reply(lang.setstatus[0].replace('{0}', statusToSet.length));
        }

        statusToSet = filter.clean(statusToSet);

        query(`UPDATE scores SET status = ? WHERE userId = ?`, [statusToSet, message.author.id]).catch(err => {
            message.reply(lang.setstatus[2])
        });

        message.reply(lang.setstatus[1].replace('{0}', statusToSet));
    },
}