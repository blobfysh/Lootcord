const Discord   = require('discord.js');
const config    = require('../../json/_config.json');
const importer  = require('../../methods/import_acc.js');
const sql       = require('sqlite');
sql.open('./score.sqlite');

module.exports = {
    name: 'importallaccounts',
    aliases: [''],
    description: 'Imports all sqlite users.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: false,
    adminOnly: true,
    
    async execute(message, args, lang, prefix){
        //if(message.channel.id !== config.modChannel){
        //    return message.reply('You must be in the mod-command-center!');
        //}
        var accsImported = 0;
        const allUsers = await sql.all(`SELECT userId FROM scores`);
        var timeStarted = new Date().getTime();

        message.channel.send('STARTING IMPORT AT ' + new Date(timeStarted).toLocaleTimeString('en-US'));

        message.channel.send('Accounts imported: `0`/' + allUsers.length).then(async msgg => {
            setInterval(() => {
                msgg.edit('Accounts imported: `' + accsImported + '`/' + allUsers.length);
            }, 5000);
            for(var i = 0; i < allUsers.length; i++){
                const finished = await importer.import_acc(allUsers[i].userId);
                if(finished){
                    accsImported++;
                    console.log('finished an account with id ' + allUsers[i].userId);
                }
            }
        });
    },
}