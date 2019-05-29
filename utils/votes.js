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
const voteEmb = require('../methods/vote_counter_embed.js');

client.voteTimers = [];

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
                INNER JOIN cooldowns
                ON s.userId = cooldowns.userId
                WHERE s.userId="${vote.user}"`);
            if(!oldRow.length){
                console.log('Received a vote but ignored it due to user having no account.');
                return; // User doesn't have an account to give reward to...
            }
            else if(oldRow[0].voteTime > 0){
                return;
            }

            console.log(client.voteTimers);
            const row    = oldRow[0]; 
            const chance = Math.floor(Math.random() * 101) + (row.luck * 2);
            
            if(row.voteCounter + 1 == 6){
                itemReward = "✨ You received a **supply_signal** for voting 6 days in a row! 😃";
                query(`UPDATE items SET supply_signal = ${row.supply_signal + 1} WHERE userId = ${vote.user}`);
                query(`UPDATE scores SET voteCounter = ${0} WHERE userId = ${vote.user}`);
            }
            else if(chance <= 100){
                itemReward = "📦 You received an **ultra_box**!";
                query(`UPDATE items SET ultra_box = ${row.ultra_box + 1} WHERE userId = ${vote.user}`);
                query(`UPDATE scores SET voteCounter = ${row.voteCounter + 1} WHERE userId = ${vote.user}`);
            }
            else{
                itemReward = "🍀 Your luck pays off!\nYou received __**2x**__ **ultra_box**!";
                query(`UPDATE items SET ultra_box = ${row.ultra_box + 2} WHERE userId = ${vote.user}`);
                query(`UPDATE scores SET voteCounter = ${row.voteCounter + 1} WHERE userId = ${vote.user}`);
            }

            manager.broadcastEval(`this.sets.voteCooldown.add('${vote.user}')`);
            query(`UPDATE cooldowns SET voteTime = ${(new Date()).getTime()} WHERE userId = ${vote.user}`);
            
            query(`UPDATE cooldowns SET voteTimeLeft = ${0} WHERE userId = ${vote.user}`); // 4.3.4 fixes vote issue? Prior to adding this, if user voted the voteTimeLeft would remain the same
                                                                                           // which meant if bot was restarted there would be a timeout() that was waaay too short causing voteCounter to be reset early
            // Start counting concurrent votes vvv
            exports.resetCounter(vote.user);

            setTimeout(() => {
                console.log('User can vote again.');
                manager.broadcastEval(`this.sets.voteCooldown.delete('${vote.user}');`);
                query(`UPDATE cooldowns SET voteTime = ${0} WHERE userId = ${vote.user}`);

                query(`UPDATE cooldowns SET voteTimeLeft = ${(new Date()).getTime()} WHERE userId = ${vote.user}`);
                //exports.resetCounter(vote.user);
                let timeObj = {user: vote.user ,timer: setTimeout(() => {
                    console.log('User didnt vote in time and lost counter');
                    // The point of concurrent voting is to stop this from executing.
                    query(`UPDATE cooldowns SET voteTimeLeft = ${0} WHERE userId = ${vote.user}`);
                    query(`UPDATE scores SET voteCounter = ${0} WHERE userId = ${vote.user}`);
                    exports.resetCounter(vote.user);
                }, 43200 * 1000)}; // 12 hours
        
                client.voteTimers.push(timeObj);
            }, 43200 * 1000); // 12 hours

            voter.send('**Thanks for voting!**\n' + itemReward, {embed: voteEmb.getCounter(row.voteCounter + 1)});
        }
        catch(err){
            console.log('Error sending voter message: ' + err);
        }
    });
}

exports.resetCounter = function(userId) {
    // console.log('I just reset someones vote counter with the id: ' + userId);
    client.voteTimers.forEach(arrObj => {

        if(arrObj.user == userId){
            //stop the timer
            clearTimeout(arrObj.timer);

            client.voteTimers.splice(client.voteTimers.indexOf(arrObj), 1);
        }

    });

}

client.on('ready', () => {
    query(`SELECT * FROM cooldowns`).then(rows => {
        rows.forEach((userInfo) => {

            if(userInfo.userId !== undefined && userInfo.userId !== null){
                if(userInfo.voteTimeLeft > 0){
                    let timeLeft = (43200*1000) - ((new Date()).getTime() - userInfo.voteTimeLeft);
                    if(timeLeft > 0){
                        console.log('added voteTimeLeft user');
                        let timeObj = {user: userInfo.userId ,timer: setTimeout(() => {
                            console.log('User didnt vote in time and lost counter');
                            query(`UPDATE cooldowns SET voteTimeLeft = ${0} WHERE userId = ${userInfo.userId}`);
                            query(`UPDATE scores SET voteCounter = ${0} WHERE userId = ${userInfo.userId}`);
                            exports.resetCounter(userInfo.userId);
                        }, timeLeft)};
                
                        client.voteTimers.push(timeObj);
                    }
                    else{
                        query(`UPDATE cooldowns SET voteTimeLeft = ${0} WHERE userId = ${userInfo.userId}`);
                        query(`UPDATE scores SET voteCounter = ${0} WHERE userId = ${userInfo.userId}`);
                    }
                }
                if(userInfo.voteTime > 0){
                    let timeLeft = (43200*1000) - ((new Date()).getTime() - userInfo.voteTime);
                    if(timeLeft > 0){
                        setTimeout(() => {
                            console.log('Vote from startup ended! starting voteCounter countdown...');

                            query(`UPDATE cooldowns SET voteTimeLeft = ${(new Date()).getTime()} WHERE userId = ${userInfo.userId}`);
                            //exports.resetCounter(userInfo.userId);
                            let timeObj = {user: userInfo.userId ,timer: setTimeout(() => {
                                console.log('User didnt vote in time and lost counter');
                                // The point of concurrent voting is to stop this from executing.
                                query(`UPDATE cooldowns SET voteTimeLeft = ${0} WHERE userId = ${userInfo.userId}`);
                                query(`UPDATE scores SET voteCounter = ${0} WHERE userId = ${userInfo.userId}`);
                                exports.resetCounter(userInfo.userId);
                            }, 43200 * 1000)}; // 12 hours

                            client.voteTimers.push(timeObj);
                        }, timeLeft);
                    }
                    else{
                        query(`UPDATE cooldowns SET voteTime = ${0} WHERE userId = ${userInfo.userId}`);
                    }
                }
            }

        });
    });
});

client.on('disconnect', (err) => {
    console.log(err);
    client.destroy().then(client.login(config.botToken));
});

client.on('error', (err) => {
    console.log('Error with connection in votes.js: ' + err);
});

client.login(config.botToken);