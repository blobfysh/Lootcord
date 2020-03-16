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
        const attackCD = methods.getCD(message.client, { userId: message.author.id, type: 'attack' });
        const healCD = methods.getCD(message.client, { userId: message.author.id, type: 'heal' });
        const shieldCD = methods.getCD(message.client, { userId: message.author.id, type: 'shield' });
        const hourlyCD = methods.getCD(message.client, { userId: message.author.id, type: 'hourly' });
        const triviaCD = methods.getCD(message.client, { userId: message.author.id, type: 'trivia' });
        const scrambleCD = methods.getCD(message.client, { userId: message.author.id, type: 'scramble' });
        const voteCD = methods.getCD(message.client, { userId: message.author.id, type: 'vote' });
        const blackjackCD = methods.getCD(message.client, { userId: message.author.id, type: 'blackjack' });
        const slotsCD = methods.getCD(message.client, { userId: message.author.id, type: 'slots' });
        const rouletteCD = methods.getCD(message.client, { userId: message.author.id, type: 'roulette' });
        const coinflipCD = methods.getCD(message.client, { userId: message.author.id, type: 'coinflip' });
        const jackpotCD = methods.getCD(message.client, { userId: message.author.id, type: 'jackpot' });
        const airdropCD = methods.getCD(message.client, { userId: message.author.id, type: 'airdrop' });
        const deactivateCD = methods.getCD(message.client, { userId: message.author.id, type: 'deactivate' });
                    
        let hourlyReady = hourlyCD ? hourlyCD : "✅ ready"
        let triviaReady = triviaCD ? triviaCD : "✅ ready"
        let scrambleReady = scrambleCD ? scrambleCD : "✅ ready"
        let attackReady = attackCD ? attackCD : "✅ ready"
        let healReady = healCD ? healCD : "✅ ready"
        let voteReady = voteCD ? voteCD : "✅ ready"
        let blackjackReady = blackjackCD ? blackjackCD : "✅ ready"
        let slotsReady = slotsCD ? slotsCD : "✅ ready"
        let rouletteReady = rouletteCD ? rouletteCD : "✅ ready"
        let coinflipReady = coinflipCD ? coinflipCD : "✅ ready"
        let jackpotReady = jackpotCD ? jackpotCD : "✅ ready"

        let giftReady = "✅ ready"

        
        /*
        if(message.client.sets.eventCooldown.has(message.author.id)){
            giftReady = (((43200 * 1000 - ((new Date()).getTime() - row.prizeTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours";
        }
        embedLeader.addField("🎁 claimgift", "`" + giftReady + "`",true)
        */
        const embedLeader = new Discord.RichEmbed()
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
        if(shieldCD){
            embedLeader.addField("🛡 Shield", '`' + shieldCD + '`', true)
        }
        if(airdropCD){
            embedLeader.addField("claimdrop", '`' + airdropCD + '`', true)
        }
        if(deactivateCD){
            embedLeader.addField("deactivate", '`' + deactivateCD + '`', true)
        }
        message.channel.send(embedLeader);
    },
}