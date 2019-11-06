const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');
const Filter = require('bad-words');
const filter = new Filter();

module.exports = {
    name: 'setstatus',
    aliases: ['status'],
    description: 'Changes the clan status.',
    minimumRank: 2,
    requiresClan: true,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId ="${message.author.id}"`))[0];

        var statusToSet = args.join(" ");

        if(statusToSet.length > 120){
            return message.reply(lang.setstatus[0].replace('{0}', statusToSet.length));
        }
        else if(/['"`]/g.test(statusToSet)){
            return message.reply(lang.setstatus[3]);
        }

        statusToSet = filter.clean(statusToSet);

        query(`UPDATE clans SET status = ? WHERE clanId = ?`, [statusToSet, scoreRow.clanId]).catch(err => {
            message.reply(lang.setstatus[2]);
        });

        clans.addLog(scoreRow.clanId, `${message.author.tag} set the clan status to: ${statusToSet}`);
        message.reply(lang.setstatus[1].replace('{0}', statusToSet));
    },
}