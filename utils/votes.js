/*
* In future possibly rewrite this to only handle giving user vote reward using their ID,
* that way, the API could call the function when the bot receives a post request from dbl (vote).
*/
const config  = require('../json/_config.json');
const { query } = require('../mysql.js');
const Discord = require('discord.js');
const methods = require('../methods/methods');
//const client  = new Discord.Client();
const DBL     = require('dblapi.js');
const dbl     = new DBL(config.dblToken, {webhookPath: config.dblWebhookPath, webhookPort: config.dblWebhookPort, webhookAuth: config.dblAuth});

exports.votingManager = (manager) => {

    dbl.webhook.on('ready', hook => {
        console.log(`[VOTE] Webhook runnning at ${hook.path}`);
    });
    
    dbl.webhook.on('vote', async vote => {
        var itemReward = "";

        try{
            const row = (await query(`SELECT * FROM scores WHERE scores.userId="${vote.user}"`))[0];

            if(!row){
                console.log('[VOTE] Received a vote but ignored it due to user having no account: ' + vote.user);
                return; // User doesn't have an account to give reward to...
            }
            else if((await manager.broadcastEval(`
            if(this.cache['vote'].get('${vote.user}')){
                true;
            }
            else{
                false;
            }`)).includes(true)){
                console.log('[VOTE] Received a vote but ignored it due to user having already voted in past 12 hours: ' + vote.user)
                return;
            }

            const chance = Math.floor(Math.random() * 101) + (row.luck * 2);
            
            if((row.voteCounter + 1) % 6 == 0){
                itemReward = "✨ You received a **supply_signal** for voting 6 days in a row! 😃";
                methods.additem(vote.user, 'supply_signal', 1);
            }
            else if(chance <= 100){
                itemReward = "📦 You received an **ultra_box**!";
                methods.additem(vote.user, 'ultra_box', 1);
            }
            else{
                itemReward = "🍀 Your luck pays off!\nYou received __**2x**__ **ultra_box**!";
                methods.additem(vote.user, 'ultra_box', 2);
            }

            query(`UPDATE scores SET voteCounter = ${row.voteCounter + 1} WHERE userId = ${vote.user}`);

            manager.broadcastEval(`
            if(this.shard.id == 0){
                (${addCD}).call(this, '${vote.user}', 'vote', 43200 * 1000)
            }`);

            messageUser(manager, vote.user, {text: '**Thanks for voting!**\n' + itemReward, embed: getCounterEmbed(row.voteCounter + 1)});
        }
        catch(err){
            console.log('[VOTE] Error sending voter message: ' + err);
        }
    });
}

function getCounterEmbed(counterVal){
    var rewardString = '';
    var counterDayVal = counterVal % 6 == 0 ? 6 : counterVal % 6;
    
    for(var i = 0; i < 5; i++){
        // Iterate 5 times
        if(counterDayVal >= i + 1){
            rewardString += '☑ Day ' + (i + 1) + ': `ultra_box`\n';
        }
        else{
            rewardString += '❌ Day ' + (i + 1) + ': `ultra_box`\n';
        }
    }
    
    if(counterVal % 6 == 0){
        rewardString += '✨ Day 6: `supply_signal`';
    }
    else{
        rewardString += '❌ Day 6: `supply_signal`';
    }

    const embed = new Discord.RichEmbed()
    .setTitle('Voting rewards!')
    .setDescription(rewardString)
    .setImage("https://cdn.discordapp.com/attachments/454163538886524928/543014649554272277/greypleLine.png")
    .setFooter('Vote 6 days in a row to receive a supply_signal!')

    return embed;
}

function messageUser(manager, userId, message){
    manager.broadcast({
        userId: userId,
        msgToSend: message
    });
}

async function addCD(userId, type, time ){
    try{
        let seconds = Math.round(time / 1000);
        
        this.shard.broadcastEval(`this.cache['${type}'].set('${userId}', 'Set at ' + (new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})), ${seconds});`)
        
        await this.query(`INSERT INTO cooldown (userId, type, start, length) VALUES (?, ?, ?, ?)`, [userId, type, new Date().getTime(), time]);

        let timeObj = {
            userId: userId, 
            type: type, 
            timer: setTimeout(() => {
                console.log(`[VOTES] Deleted ${userId} from '${type}' cooldown`);
                this.query(`DELETE FROM cooldown WHERE userId = ${userId} AND type = '${type}'`);
            }, seconds * 1000)
        };
       
        this.cdTimes.push(timeObj);

        return 'Added Cooldown';
    }
    catch(err){
        console.log(err);
    }
}