const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');

module.exports = {
    name: 'cooldown',
    aliases: ['cooldowns', 'cd'],
    description: 'Displays all command cooldowns.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    execute(message, args, lang, prefix){
        query(`SELECT * FROM cooldowns WHERE userId ="${message.author.id}"`).then(oldRow => {
            const row = oldRow[0];

            methods.getAttackCooldown(message.author.id).then(attackTimeLeft => {
                methods.getHealCooldown(message.author.id).then(healTimeLeft => {
                    methods.getShieldTime(message.author.id).then(shieldTime => {
                        
                        let hourlyReady = "✅ ready"
                        let triviaReady = "✅ ready"
                        let scrambleReady = "✅ ready"
                        let attackReady = "✅ ready"
                        let healReady = "✅ ready"
                        let voteReady = "✅ ready"
                        let gambleReady = "✅ ready"
                        let jackpotReady = "✅ ready"

                        let giftReady = "✅ ready"

                        const embedLeader = new Discord.RichEmbed()
                        if(message.client.sets.hourlyCooldown.has(message.author.id)){
                            hourlyReady = ((3600 * 1000 - ((new Date()).getTime() - row.hourlyTime)) / 60000).toFixed(1) + " minutes";
                        }
                        if(message.client.sets.triviaUserCooldown.has(message.author.id)){
                            triviaReady = ((900 * 1000 - ((new Date()).getTime() - row.triviaTime)) / 60000).toFixed(1) + " minutes";
                        }
                        if(message.client.sets.scrambleCooldown.has(message.author.id)){
                            scrambleReady = ((900 * 1000 - ((new Date()).getTime() - row.scrambleTime)) / 60000).toFixed(1) + " minutes";
                        }
                        if(message.client.sets.weapCooldown.has(message.author.id)){
                            attackReady = attackTimeLeft;
                        }
                        if(message.client.sets.healCooldown.has(message.author.id)){
                            healReady = healTimeLeft;
                        }
                        if(message.client.sets.voteCooldown.has(message.author.id)){
                            voteReady = (((43300 * 1000 - ((new Date()).getTime() - row.voteTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours";
                        }
                        if(message.client.sets.jackpotCooldown.has(message.author.id)){
                            jackpotReady = ((300 * 1000 - ((new Date()).getTime() - row.jackpotTime)) / 1000).toFixed(0) + " seconds";
                        }
                        if(message.client.sets.gambleCooldown.has(message.author.id)){
                            gambleReady = ((60 * 1000 - ((new Date()).getTime() - row.gambleTime)) / 1000).toFixed(0) + " seconds";
                        }
                        if(message.client.sets.eventCooldown.has(message.author.id)){
                            giftReady = (((43300 * 1000 - ((new Date()).getTime() - row.prizeTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours";
                        }
                        embedLeader.setThumbnail(message.author.avatarURL)
                        embedLeader.setTitle(`**${message.author.username} Cooldowns**`)
                        embedLeader.setColor(13215302)
                        embedLeader.addField("⏲ hourly", "`" + hourlyReady + "`",true)
                        embedLeader.addField("❓ trivia", "`" + triviaReady + "`",true)
                        embedLeader.addField("❓ scramble", "`" + scrambleReady + "`",true)
                        embedLeader.addField("💰 gamble", "`" + gambleReady + "`",true)
                        embedLeader.addField("🎟 vote", "`" + voteReady + "`",true)
                        embedLeader.addField("🎲 jackpot", "`" + jackpotReady + "`",true)
                        embedLeader.addField("⚔ Attack (part of `"+prefix+"use`)", "`" + attackReady + "`",true)
                        embedLeader.addField("❤ Heal (part of `"+prefix+"use`)", "`" + healReady + "`",true)
                        if(message.client.sets.activeShield.has(message.author.id)){
                            embedLeader.addField("🛡 Active Shield", shieldTime, true)
                        }
                        if(message.client.sets.airdropCooldown.has(message.author.id)){
                            embedLeader.addField("Claim another drop (claimdrop)", '`' + (((21600 * 1000 - ((new Date()).getTime() - row.airdropTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours`", true)
                        }
                        message.channel.send(embedLeader);
                    });
                });
            });
        });
    },
}