//TODO add 12 hour cooldown for this command

const monuments = require('../../resources/json/explorations');

module.exports = {
    name: 'explore',
    aliases: ['monuments', 'roam'],
    description: "Go exploring! You might find some loot...",
    long: "Go exploring! You might find some loot...\n\n**Tip:** Don't try exploring a dangerous area unless you are a high enough level...\n\nSome monuments have special requirements that you can learn by reading the post-exploration details.",
    args: {},
    examples: [],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    
    async execute(app, message){
        try{
            app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => {
                return m.author.id === message.author.id
            }, { time: 30000 });
        }
        catch(err){
            return message.reply('❌ You have an active command running!');
        }

        const monumentsArr = app.common.shuffleArr(Object.keys(monuments)).slice(0, 3);
        const exploreEmbed = new app.Embed()
        .setColor(13451564)
        .setTitle('Choose a location to explore!')

        let monumentsDisplay = '';

        for(let i = 0; i < monumentsArr.length; i++){
            monumentsDisplay += (i + 1) + '. **' + monuments[monumentsArr[i]].title + '** (Recommended level: **' +monuments[monumentsArr[i]].suggestedLevel + '**+)\n';
        }

        exploreEmbed.setDescription('Type the number of the location you wish to explore:\n\n' + monumentsDisplay);

        message.channel.createMessage(exploreEmbed);

        const collector = app.msgCollector.collectors[`${message.author.id}_${message.channel.id}`].collector;

        collector.on('collect', async m => {
            const userArgs = m.content.split(/ +/);
            const number = app.parse.numbers(userArgs)[0];

            if(monumentsArr[number - 1]){
                app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);

                const choice = monuments[monumentsArr[number - 1]];
                const row = await app.player.getRow(message.author.id);
                const userItems = await app.itm.getItemObject(message.author.id);
                const successRates = Object.keys(choice.successRate);
                let successRate = choice.successRate[row.level] !== undefined ? choice.successRate[row.level] : choice.successRate[successRates[successRates.length - 1]];
                console.log(successRate);

                // check for monument requirements such as items/armor
                if(choice.requirement.type !== null){
                    if(choice.requirement.type === 'armor'){
                        const armor = await app.player.getArmor(message.author.id);

                        if(armor && armor === choice.requirement.value) successRate += choice.requirement.bonus;
                        else successRate -= 1;
                    }
                    else if(choice.requirement.type === 'item'){
                        if(userItems[choice.requirement.value] >= 1){
                            await app.itm.removeItem(message.author.id, choice.requirement.value, 1);

                            successRate += choice.requirement.bonus;
                        }
                        else{
                            successRate -= 1;
                        }
                    }
                }

                if(Math.random() < successRate){
                    const outcome = choice.success[Math.floor(Math.random() * choice.success.length)];
                    const rewardItem = Math.random() < 0.2 ? outcome.reward.rareItem.split('|') : outcome.reward.item.split('|');
                    const itemCt = await app.itm.getItemCount(userItems, row);
                    const hasEnough = await app.itm.hasSpace(itemCt, rewardItem[1]);
                    let quote = outcome.quote;
                    let rewardDisplay = '';

                    if(outcome.loss.type === 'health'){
                        let healthReduct = outcome.loss.value;

                        if(row.health - healthReduct <= 0){
                            healthReduct = row.health - 1;
                        }

                        await app.mysql.updateDecr('scores', 'health', healthReduct, 'userId', message.author.id);

                        quote += `\n\nYou lost **${healthReduct}** health and now have ${app.player.getHealthIcon(row.health - healthReduct, row.maxHealth)} **${row.health - healthReduct} / ${row.maxHealth}**.`;
                    }

                    if(hasEnough && Math.random() < 0.9){
                        await app.itm.addItem(message.author.id, rewardItem[0], rewardItem[1]);

                        rewardDisplay = `**${rewardItem[1]}x** ${app.itemdata[rewardItem[0]].icon}\`${rewardItem[0]}\``;
                    }
                    else{
                        const moneyMin = outcome.reward.money.min;
                        const moneyMax = outcome.reward.money.max;
                        const winnings = Math.floor((Math.random() * (moneyMax - moneyMin + 1)) + moneyMin);

                        await app.player.addMoney(message.author.id, winnings);

                        rewardDisplay = `**${app.common.formatNumber(winnings)}** Lootcoin`;
                    }

                    const rewardEmbed = new app.Embed()
                    .setTitle('Area Explored: ' + choice.title)
                    .setColor(9043800)
                    .setDescription(quote.replace('{reward}', rewardDisplay))
                    
                    if(choice.image !== "") rewardEmbed.setThumbnail(choice.image);

                    message.channel.createMessage(rewardEmbed);
                }
                else{
                    const outcome = choice.failed[Math.floor(Math.random() * choice.failed.length)];
                    const item1 = app.itemdata[outcome.item] ? app.itemdata[outcome.item].icon + '`' + outcome.item + '`' : '';
                    const item2 = app.itemdata[outcome.item2] ? app.itemdata[outcome.item2].icon + '`' + outcome.item2 + '`' : '';
                    let quote = outcome.quote.replace('{item}', item1).replace('{item2}', item2);

                    const failedEmbed = new app.Embed()
                    .setTitle('Area Explored: ' + choice.title)
                    .setColor(16734296)

                    if(outcome.loss.type === 'health'){
                        let healthReduct = outcome.loss.value;

                        if(row.health - healthReduct <= 0){
                            // player was killed
                            let randomItems = await app.itm.getRandomUserItems(message.author.id);
                            let moneyStolen = Math.floor(row.money * .75);
                            let scrapStolen = Math.floor(row.scrap * .5);
                            
                            await app.itm.removeItem(message.author.id, randomItems.amounts);
                            await app.player.removeMoney(message.author.id, moneyStolen);
                            await app.player.removeScrap(message.author.id, scrapStolen);

                            await app.query(`UPDATE scores SET deaths = deaths + 1 WHERE userId = ${message.author.id}`);
                            await app.query(`UPDATE scores SET health = 100 WHERE userId = ${message.author.id}`);
                            if(row.power >= -3){
                                await app.query(`UPDATE scores SET power = power - 2 WHERE userId = ${message.author.id}`);
                            }
                            else{
                                await app.query(`UPDATE scores SET power = -5 WHERE userId = ${message.author.id}`);
                            }

                            quote += `\n\nYou lost **${healthReduct}** health and **DIED!**`
                            failedEmbed.addField('Money Lost', app.common.formatNumber(moneyStolen) + '\n' + app.common.formatNumber(scrapStolen, false, true))
                            failedEmbed.addField('Items Lost (' + randomItems.items.length + ')', randomItems.items.length !== 0 ? randomItems.display.join('\n') : `Nothing`)
                        }
                        else{
                            await app.mysql.updateDecr('scores', 'health', healthReduct, 'userId', message.author.id);

                            quote += `\n\nYou lost **${healthReduct}** health and now have ${app.player.getHealthIcon(row.health - healthReduct, row.maxHealth)} **${row.health - healthReduct} / ${row.maxHealth}**.`
                        
                            if(outcome.loss.item){
                                let randomItem = await app.itm.getRandomUserItems(message.author.id, 1);
        
                                if(randomItem.items.length > 0){
                                    await app.itm.removeItem(message.author.id, randomItem.amounts);
                                    
                                    quote += `\nYou also lost ${randomItem.display[0]} from your inventory.`
                                }
                            }
                        }
                    }

                    failedEmbed.setDescription(quote)
                    
                    if(choice.image !== "") failedEmbed.setThumbnail(choice.image);

                    message.channel.createMessage(failedEmbed);
                }
            }
        });
        collector.on('end', reason => {
            if(reason === 'time'){
                message.reply('**You took too long to make a decision!**');
            }
        });
    },
}