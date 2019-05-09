/*
* In future possibly rewrite this to only handle giving user vote reward using their ID,
* that way, the API could call the function when the bot receives a post request from dbl (vote).
*/
const config  = require('../json/_config.json');
const { query } = require('../mysql.js');
const Discord = require('discord.js');
const client  = new Discord.Client();
const DBL     = require('dblapi.js');
const dbl     = new DBL(config.dblToken, {webhookPath: config.dblWebhookPath, webhookPort: config.dblWebhookPort, webhookAuth: config.dblAuth});

client.login(config.botToken);

exports.votingManager = (manager) => {

    dbl.webhook.on('ready', hook => {
        console.log(`Webhook runnning at ${hook.path}`);
    });
    
    dbl.webhook.on('vote', async vote => {
        var itemReward = "";

        try{
            const voter = await client.fetchUser(vote.user);
            const oldRow = await query(`SELECT * FROM items i
                                        INNER JOIN scores s
                                        ON i.userId = s.userId
                                        WHERE s.userId="${vote.user}"`);
            if(!oldRow.length){
                console.log('Received a vote but ignored it due to user having no account.');
                return; // User doesn't have an account to give reward to...
            }
            
            const row    = oldRow[0]; 
            const chance = Math.floor(Math.random() * 101) + (row.luck * 2);

            if(chance <= 100){
                itemReward = "📦 You received an **ultra_box**!";
                query(`UPDATE items SET ultra_box = ${row.ultra_box + 1} WHERE userId = ${vote.user}`);
            }
            else{
                itemReward = "🍀 Your luck pays off!\nYou received __**2x**__ **ultra_box**!";
                query(`UPDATE items SET ultra_box = ${row.ultra_box + 2} WHERE userId = ${vote.user}`);
            }

            manager.broadcastEval(`this.sets.voteCooldown.add('${vote.user}')`);
            query(`UPDATE cooldowns SET voteTime = ${(new Date()).getTime()} WHERE userId = ${vote.user}`);
            setTimeout(() => {
                manager.broadcastEval(`this.sets.voteCooldown.delete('${vote.user}');`);
                query(`UPDATE cooldowns SET voteTime = ${0} WHERE userId = ${vote.user}`);
            }, 43300 * 1000); // 12 hours

            const voteEmbed = new Discord.RichEmbed()
            .setTitle('Thanks for voting!')
            .setDescription(itemReward)
            .setFooter('Vote every 12 hours for a reward')
            .setImage("https://cdn.discordapp.com/attachments/454163538886524928/543014649554272277/greypleLine.png")

            voter.send(voteEmbed);
        }
        catch(err){
            console.log('Error sending voter message: ' + err);
        }
    });
}

client.on('error', (err) => {
    console.log('Error with connection in votes.js: ' + err);
});