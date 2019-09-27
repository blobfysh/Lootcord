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
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM cooldowns WHERE userId ="${message.author.id}"`))[0];

        const attackTimeLeft = await methods.getAttackCooldown(message.author.id);
        const healTimeLeft = await methods.getHealCooldown(message.author.id);
        const shieldTime = await methods.getShieldTime(message.author.id);
                    
        let hourlyReady = "✅ ready"
        let triviaReady = "✅ ready"
        let scrambleReady = "✅ ready"
        let attackReady = "✅ ready"
        let healReady = "✅ ready"
        let voteReady = "✅ ready"
        let blackjackReady = "✅ ready"
        let slotsReady = "✅ ready"
        let rouletteReady = "✅ ready"
        let coinflipReady = "✅ ready"
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
            blackjackReady = ((60 * 1000 - ((new Date()).getTime() - row.gambleTime)) / 1000).toFixed(0) + " seconds";
        }
        if(message.client.sets.slotsCooldown.has(message.author.id)){
            slotsReady = ((60 * 1000 - ((new Date()).getTime() - row.slotsTime)) / 1000).toFixed(0) + " seconds";
        }
        if(message.client.sets.rouletteCooldown.has(message.author.id)){
            rouletteReady = ((60 * 1000 - ((new Date()).getTime() - row.rouletteTime)) / 1000).toFixed(0) + " seconds";
        }
        if(message.client.sets.cfCooldown.has(message.author.id)){
            coinflipReady = ((60 * 1000 - ((new Date()).getTime() - row.coinflipTime)) / 1000).toFixed(0) + " seconds";
        }
        if(message.client.sets.eventCooldown.has(message.author.id)){
            giftReady = (((43300 * 1000 - ((new Date()).getTime() - row.prizeTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours";
        }
        embedLeader.setThumbnail(message.author.avatarURL)
        embedLeader.setTitle(`**${message.author.username} Cooldowns**`)
        embedLeader.setColor(13215302)
        embedLeader.addField("hourly", "`" + hourlyReady + "`",true)
        embedLeader.addField("trivia", "`" + triviaReady + "`",true)
        embedLeader.addField("scramble", "`" + scrambleReady + "`",true)
        embedLeader.addField("blackjack", "`" + blackjackReady + "`",true)
        embedLeader.addField("slots", "`" + slotsReady + "`",true)
        embedLeader.addField("coinflip", "`" + coinflipReady + "`",true)
        embedLeader.addField("roulette", "`" + rouletteReady + "`",true)
        embedLeader.addField("vote", "`" + voteReady + "`",true)
        embedLeader.addField("jackpot", "`" + jackpotReady + "`",true)
        embedLeader.addField("Attack (part of `"+prefix+"use`)", "`" + attackReady + "`",true)
        embedLeader.addField("Heal (part of `"+prefix+"use`)", "`" + healReady + "`",true)
        if(message.client.sets.activeShield.has(message.author.id)){
            embedLeader.addField("🛡 Shield", shieldTime, true)
        }
        if(message.client.sets.airdropCooldown.has(message.author.id)){
            embedLeader.addField("claimdrop", '`' + (((21600 * 1000 - ((new Date()).getTime() - row.airdropTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours`", true)
        }
        if(message.client.sets.deactivateCooldown.has(message.author.id)){
            embedLeader.addField("deactivate", '`' + (((86400 * 1000 - ((new Date()).getTime() - row.deactivateTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours`", true)
        }
        message.channel.send(embedLeader);
    },
}