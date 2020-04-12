
module.exports = {
    name: 'cooldowns',
    aliases: ['cooldown', 'cd'],
    description: "Displays all command cooldowns.",
    long: "Displays cooldowns for all commands and time remaining on your shield if you have one active.",
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const attackCD = await app.cd.getCD(message.author.id, 'attack');
        const healCD = await app.cd.getCD(message.author.id, 'heal');
        const shieldCD = await app.cd.getCD(message.author.id, 'shield');
        const hourlyCD = await app.cd.getCD(message.author.id, 'hourly');
        const dailyCD = await app.cd.getCD(message.author.id, 'daily');
        const triviaCD = await app.cd.getCD(message.author.id, 'trivia');
        const scrambleCD = await app.cd.getCD(message.author.id, 'scramble');
        const voteCD = await app.cd.getCD(message.author.id, 'vote');
        const blackjackCD = await app.cd.getCD(message.author.id, 'blackjack');
        const slotsCD = await app.cd.getCD(message.author.id, 'slots');
        const rouletteCD = await app.cd.getCD(message.author.id, 'roulette');
        const coinflipCD = await app.cd.getCD(message.author.id, 'coinflip');
        const jackpotCD = await app.cd.getCD(message.author.id, 'jackpot');
        const airdropCD = await app.cd.getCD(message.author.id, 'airdrop');
        const deactivateCD = await app.cd.getCD(message.author.id, 'deactivate');
        const xp_potionCD = await app.cd.getCD(message.author.id, 'xp_potion');
                    
        let hourlyReady = hourlyCD ? hourlyCD : "✅ ready"
        let dailyReady = dailyCD ? dailyCD : "✅ ready"
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

        /*
        let giftReady = "✅ ready"
        if(message.client.sets.eventCooldown.has(message.author.id)){
            giftReady = (((43200 * 1000 - ((new Date()).getTime() - row.prizeTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours";
        }
        embedLeader.addField("🎁 claimgift", "`" + giftReady + "`",true)
        */

        const embedLeader = new app.Embed()
        embedLeader.setThumbnail(message.author.avatarURL)
        embedLeader.setAuthor('Cooldowns', message.author.avatarURL)
        embedLeader.setColor(13215302)
        embedLeader.addField("hourly", "`" + hourlyReady + "`",true)
        embedLeader.addField("daily", "`" + dailyReady + "`", true)
        embedLeader.addField("trivia", "`" + triviaReady + "`",true)
        embedLeader.addField("scramble", "`" + scrambleReady + "`",true)
        embedLeader.addField("blackjack", "`" + blackjackReady + "`",true)
        embedLeader.addField("slots", "`" + slotsReady + "`",true)
        embedLeader.addField("coinflip", "`" + coinflipReady + "`",true)
        embedLeader.addField("roulette", "`" + rouletteReady + "`",true)
        embedLeader.addField("vote", "`" + voteReady + "`",true)
        embedLeader.addField("jackpot", "`" + jackpotReady + "`",true)
        embedLeader.addField("Attack (part of `" + message.prefix + "use`)", "`" + attackReady + "`",true)
        embedLeader.addField("Heal (part of `" + message.prefix + "use`)", "`" + healReady + "`",true)
        if(shieldCD){
            embedLeader.addField("🛡 Shield", '`' + shieldCD + '`', true)
        }
        if(airdropCD){
            embedLeader.addField("claimdrop", '`' + airdropCD + '`', true)
        }
        if(deactivateCD){
            embedLeader.addField("deactivate", '`' + deactivateCD + '`', true)
        }
        if(xp_potionCD){
            embedLeader.addField("xp_potion", '`' + xp_potionCD + '`', true)
        }
        message.channel.createMessage(embedLeader);
    },
}