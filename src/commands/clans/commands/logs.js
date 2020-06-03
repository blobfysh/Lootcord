
module.exports = {
    name: 'logs',
    aliases: ['log'],
    description: 'Shows logs of a clan.',
    long: 'Shows logs of a clan.',
    args: {"clan/user": "Clan or user to search, will default to your own clan if none specified."},
    examples: [],
    requiresClan: false,
    requiresActive: false,
    minimumRank: 0,
    
    async execute(app, message, args){
        const scoreRow = await app.player.getRow(message.author.id);
        let user = app.parse.members(message, args)[0];
        
        if(!args.length && scoreRow.clanId === 0){
            return message.reply('You are not a member of any clan! You can look up other clans by searching their name.');
        }
        else if(!args.length){
            message.channel.createMessage(await getClanLogs(app, scoreRow.clanId));
        }
        else if(user){
            const invitedScoreRow = (await app.query(`SELECT * FROM scores WHERE userId = ${user.id}`))[0];
            
            if(!invitedScoreRow){
                return message.reply(`❌ The person you're trying to search doesn't have an account!`);
            }
            else if(invitedScoreRow.clanId == 0){
                return message.reply('❌ That user is not in a clan.');
            }
            else{
                message.channel.createMessage(await getClanLogs(app, invitedScoreRow.clanId));
            }
        }
        else{
            let clanName = args.join(" ");
            const clanRow = await app.clans.searchClanRow(clanName);

            if(!clanRow){
                return message.reply('I could not find a clan with that name! Maybe you misspelled it?');
            }
            
            message.channel.createMessage(await getClanLogs(app, clanRow.clanId));
        }
    },
}

async function getClanLogs(app, clanId){
    const clanRow = (await app.query(`SELECT * FROM clans WHERE clanId = ${clanId}`))[0];
    const logs = await app.query(`SELECT * FROM clan_logs WHERE clanId = ${clanId} ORDER BY logDate DESC LIMIT 10`);

    let display = '';
    let header = 'Description                            Date              ';

    for(let i = 0; i < logs.length; i++){
        display += `${logs[i].details.slice(0, 38)}`.padEnd(39, ' ') + `${getShortDate(logs[i].logTime)}\n`;
    }

    const logsEmbed = new app.Embed()
    .setAuthor(clanRow.name, 'https://cdn.discordapp.com/attachments/497302646521069570/695319745003520110/clan-icon-zoomed-out.png')
    .setTitle('Logs (Last 10)')
    .setDescription('Sorted newest to oldest:```' + header + '\n' + '-'.repeat(header.length) + '\n' + display + '```')
    .setColor(13215302)

    return logsEmbed;
}

function getShortDate(date){
    let convertedTime = new Date(date).toLocaleString('en-US', {
        timeZone: 'America/New_York'
    });
    convertedTime = new Date(convertedTime);
    
    let d = convertedTime;
    let month = d.getMonth() + 1;
    let day = d.getDate();
    let year = d.getFullYear();
    let time = d.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}).replace(' ', '');
    
    return month + '/' + day + '/' + year.toString().slice(2) + ' ' + time + ' EST';
}