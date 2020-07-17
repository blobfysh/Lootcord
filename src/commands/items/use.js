const RANDOM_SELECTION_MINIMUM = 8; // # of active players required for an attack menu to show when using random

module.exports = {
    name: 'use',
    aliases: ['attack', 'heal'],
    description: 'Use items on yourself or use weapons to attack others!',
    long: 'Use an item on yourself or attack another user with a weapon. If you\'re opening a box, you can specify an amount to open.',
    args: {"item": "Item to use.", "@user": "User to attack item with."},
    examples: ["use assault rifle @blobfysh","use medkit","use rock random", "use crate 4"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        let item = app.parse.items(message.args)[0];
        let member = app.parse.members(message, message.args)[0];
        let amount = app.parse.numbers(message.args)[0] || 1;

        if(!item){
            return message.reply(`❌ You need to specify an item to use! \`${message.prefix}use <item>\`. For more information and examples, type \`${message.prefix}help use\`.`);
        }
        else if(member && !app.itemdata[item].isWeap){
            // tried using item on someone
            return message.reply('❌ That item cannot be used to attack another player.');
        }
        else if(app.itemdata[item].isItem){
            const userItems = await app.itm.getItemObject(message.author.id);
            const itemCt = await app.itm.getItemCount(userItems, row);
            if(amount > 10) amount = 10;

            if(!userItems[item]){
                return message.reply(`❌ You don't have a ${app.itemdata[item].icon}\`${item}\`!`);
            }
            else if(item === 'c4' && userItems[item] < 1){
                return message.reply(`❌ You don't have enough of that item! You have **${userItems[item] || 0}x** ${app.itemdata[item].icon}\`${item}\`.`);
            }
            else if(item !== 'c4' && userItems[item] < amount){
                return message.reply(`❌ You don't have enough of that item! You have **${userItems[item] || 0}x** ${app.itemdata[item].icon}\`${item}\`.`);
            }

            if(['crate', 'military_crate', 'candy_pail', 'present', 'supply_drop'].includes(item)){
                // open box
                if(!await app.itm.hasSpace(itemCt)){
                    return message.reply(`❌ **You don't have enough space in your inventory!** (You have **${itemCt.open}** open slots)\n\nYou can clear up space by selling some items.`);
                }

                await app.itm.removeItem(message.author.id, item, amount);

                let results = app.itm.openBox(item, amount, row.luck);
                let bestItem = results.items.sort(app.itm.sortItemsHighLow.bind(app));
                let openStr = '';

                await app.itm.addItem(message.author.id, results.itemAmounts);
                await app.player.addPoints(message.author.id, results.xp);
                
                if(amount === 1){
                    console.log(bestItem[0]);

                    openStr = 'You open the ' + app.itemdata[item].icon + '`' + item + '` and find... **' + app.common.getA(bestItem[0]) + ' ' + app.itemdata[bestItem[0]].icon + '`' + bestItem[0] + '` and `⭐ ' + results.xp + ' XP`!**';
                }
                else{
                    openStr = 'You open **' + amount + 'x** ' + app.itemdata[item].icon + '`' + item + '`\'s and find:\n\n' + app.itm.getDisplay(results.itemAmounts).join('\n') + '\n\n...and `⭐ ' + results.xp + ' XP`!';
                }

                message.channel.createMessage('<@' + message.author.id + '>, ' + openStr);
            }
            else if(item === 'supply_signal'){
                const serverInfo = await app.common.getGuildInfo(message.channel.guild.id);
                await app.itm.removeItem(message.author.id, item, 1);

                message.reply('📻 Requesting immediate airdrop...').then(msg => {
                    setTimeout(() => {
                        message.channel.createMessage('**📻 Airdrop arriving in `30 seconds`!**');
                    }, 3000);
                    setTimeout(() => {
                        message.channel.createMessage('**📻 `10 seconds`!**');
                    }, 20000);
                    setTimeout(() => {
                        message.channel.createMessage('**📻 `5`...**');
                    }, 25000);
                    setTimeout(() => {
                        message.channel.createMessage('**📻 `4`...**');
                    }, 26000);
                    setTimeout(() => {
                        message.channel.createMessage('**📻 `3`...**');
                    }, 27000);
                    setTimeout(() => {
                        const dropEmbed = new app.Embed()
                        .setDescription(`**A ${app.itemdata['supply_drop'].icon}\`supply_drop\` has arrived!**\n\nUse \`${message.prefix}claimdrop\` to claim it.`)
                        .setImage(app.itemdata['supply_drop'].image)
                        .setColor(13451564)
                        app.query(`UPDATE guildInfo SET dropItemChan = '${message.channel.id}' WHERE guildId = ${message.channel.guild.id}`);
                        app.query(`UPDATE guildInfo SET dropItem = 'supply_drop' WHERE guildId = ${message.channel.guild.id}`);
                        
                        message.channel.createMessage(dropEmbed);
                    }, 30000);
                });
            }
            else if(app.itemdata[item].isShield){
                const shieldCD = await app.cd.getCD(message.author.id, 'shield');

                if(shieldCD){
                    return message.reply(`Your current shield is still active for \`${shieldCD}\`!`);
                }

                await app.itm.removeItem(message.author.id, item, 1);
                await app.cd.setCD(message.author.id, 'shield', app.itemdata[item].shieldInfo.seconds * 1000);

                message.reply(`Successfully activated ${app.itemdata[item].icon}\`${item}\`, you are now protected from attacks for \`${app.cd.convertTime(app.itemdata[item].shieldInfo.seconds * 1000)}\``);
            }
            else if(app.itemdata[item].isHeal){
                const healCD = await app.cd.getCD(message.author.id, 'heal');

                if(healCD){
                    return message.reply(`You need to wait \`${healCD}\` before healing again.`);
                }

                let minHeal = app.itemdata[item].healMin;
                let maxHeal = app.itemdata[item].healMax;
                
                let randHeal = (Math.floor(Math.random() * (maxHeal - minHeal + 1)) + minHeal);
                let userMaxHeal = row.maxHealth - row.health;

                if(userMaxHeal === 0){
                    return message.reply('❌ You are already at max health!');
                }
                
                await app.cd.setCD(message.author.id, 'heal', app.itemdata[item].cooldown.seconds * 1000);

                if(userMaxHeal > randHeal){
                    await app.query(`UPDATE scores SET health = health + ${randHeal} WHERE userId = '${message.author.id}'`);
                    await app.itm.removeItem(message.author.id, item, 1);
                    message.reply(`You have healed for **${randHeal}** health! You now have ${app.player.getHealthIcon(row.health + randHeal, row.maxHealth)} ${row.health + randHeal} / ${row.maxHealth} HP`);
                }
                else if(userMaxHeal <= randHeal){
                    await app.query(`UPDATE scores SET health = health + ${userMaxHeal} WHERE userId = '${message.author.id}'`);
                    await app.itm.removeItem(message.author.id, item, 1);
                    message.reply(`You have healed for **${userMaxHeal}** health! You now have ${app.player.getHealthIcon(row.health + userMaxHeal, row.maxHealth)} ${row.health + userMaxHeal} / ${row.maxHealth} HP`);
                }
            }
            else if(app.itemdata[item].givesMoneyOnUse){
                let minAmt = app.itemdata[item].itemMin;
                let maxAmt = app.itemdata[item].itemMax;
                
                let randAmt = Math.floor((Math.random() * (maxAmt - minAmt + 1)) + minAmt);
                await app.player.addMoney(message.author.id, randAmt);
                await app.itm.removeItem(message.author.id, item, 1);
                message.reply(`You open the ${app.itemdata[item].icon}\`${item}\` to find...\n${app.common.formatNumber(randAmt)}`);
            }
            else if(item === 'reroll_scroll'){
                await app.itm.removeItem(message.author.id, item, 1);

                await app.query(`UPDATE scores SET maxHealth = 100 WHERE userId = ${message.author.id}`);
                await app.query(`UPDATE scores SET luck = 0 WHERE userId = ${message.author.id}`);
                await app.query(`UPDATE scores SET scaledDamage = 1.00 WHERE userId = ${message.author.id}`);
                await app.query(`UPDATE scores SET used_stats = 0 WHERE userId = ${message.author.id}`);
                if(row.health > 100){
                    await app.query(`UPDATE scores SET health = 100 WHERE userId = ${message.author.id}`);
                }
                
                message.reply('You read the ' + app.itemdata['reroll_scroll'].icon + '`reroll_scroll` and feel a sense of renewal. Your skills have been reset.');
            }
            else if(item === 'xp_potion'){
                const xpCD = await app.cd.getCD(message.author.id, 'xp_potion');
                const xp = app.common.calculateXP(row.points, row.level);
        
                if(xpCD){
                    return message.reply(`You need to wait \`${xpCD}\` before using another ${app.itemdata['xp_potion'].icon}\`xp_potion\`.`);
                }
                
                await app.cd.setCD(message.author.id, 'xp_potion', app.config.cooldowns.xp_potion * 1000);
                await app.itm.removeItem(message.author.id, 'xp_potion', 1);
                await app.query(`UPDATE scores SET points = points + 75 WHERE userId = '${message.author.id}'`);

                message.reply('Successfully drank an ' + app.itemdata['xp_potion'].icon + '`xp_potion` and gained **75** XP! You now have **' + (xp.curLvlXp + 75) + ' / ' + xp.neededForLvl + '** XP.');
            }
            else if(item === 'c4'){
                const clanName = message.args;
                if(!clanName.length){
                    return message.reply('You need to specify a clan to use your explosive on! `' + message.prefix + 'use c4 <clan name>`');
                }

                const clanRow = await app.clans.searchClanRow(clanName.join(' '));

                if(!clanRow){
                    return message.reply('I could not find a clan with that name! Maybe you misspelled it?');
                }
                else if(row.clanId === clanRow.clanId){
                    return message.reply('❌ You cannot use explosives on your own clan.');
                }

                const clanPower = await app.clans.getClanData(clanRow);

                await app.itm.removeItem(message.author.id, 'c4', 1);
                await app.query("UPDATE clans SET reduction = reduction + 5 WHERE clanId = ?", [clanRow.clanId]);
                await app.query(`INSERT INTO cooldown (userId, type, start, length) VALUES (?, ?, ?, ?)`, [clanRow.clanId, 'explosion', new Date().getTime(), 3600 * 1000]);
                app.clans.addLog(clanRow.clanId, `${(message.author.username + '#' + message.author.discriminator)} used explosives on the clan! (c4)`);
                
                setTimeout(async () => {
                    await app.query("UPDATE clans SET reduction = reduction - 5 WHERE clanId = ?", [clanRow.clanId]);
                    await app.query(`DELETE FROM cooldown WHERE userId = ? AND type = 'explosion'`, [clanRow.clanId]);
                }, 3600 * 1000);

                const msgEmbed = new app.Embed()
                .setAuthor(message.member.nick || message.member.username, message.author.avatarURL)
                .setDescription(`💥 ***BOOM***\n\nThe current power of \`${clanRow.name}\` drops from **${clanPower.currPower}** to 💥 **${clanPower.currPower - 5}**.`)
                .setFooter('This effect lasts one hour.')
                .setColor(16734296)
                message.channel.createMessage(msgEmbed);
            }
        }
        else if(app.itemdata[item].isWeap){
            const userItems = await app.itm.getItemObject(message.author.id);
            const serverInfo = await app.common.getGuildInfo(message.channel.guild.id);
            const attackCD = await app.cd.getCD(message.author.id, 'attack');
            const shieldCD = await app.cd.getCD(message.author.id, 'shield');
            const passiveShieldCD = await app.cd.getCD(message.author.id, 'passive_shield');
            // item is a weapon, start checking for member
            
            if(!await app.itm.hasItems(userItems, item, 1)){
                return message.reply(`❌ You don't have a ${app.itemdata[item].icon}\`${item}\`.`);
            }
            else if(attackCD){
                return message.reply(`❌ You need to wait \`${attackCD}\` before attacking again.`);
            }
            else if(shieldCD){
                return message.reply(`❌ You can't attack while you have a shield active! \`${shieldCD}\` remaining.`);
            }
            
            // check if attacking monster
            if(Object.keys(app.mobdata).some(monster => message.args.map(arg => arg.toLowerCase()).includes('bounty') || message.args.map(arg => arg.toLowerCase()).includes('@bounty') || message.args.map(arg => arg.toLowerCase()).join(' ').includes(app.mobdata[monster].title.toLowerCase()))){
                const monsterRow = await app.mysql.select('spawns', 'channelId', message.channel.id);

                if(!monsterRow){
                    return message.reply("❌ There are no bounties in this channel!");
                }

                const monster = app.mobdata[monsterRow.monster];
                let ammoUsed
                let bonusDamage = 0;
                let damageMin = app.itemdata[item].minDmg;
                let damageMax = app.itemdata[item].maxDmg;
                let weaponBroke = app.itemdata[item].breaksOnUse;

                try{
                    ammoUsed = getAmmo(app, item, row, userItems);

                    if(ammoUsed){
                        bonusDamage = app.itemdata[ammoUsed].damage;
                        await app.itm.removeItem(message.author.id, ammoUsed, 1);
                    }
                    else if(!ammoUsed && monster.title === 'Patrol Helicopter') return message.reply("❌ The Patrol Helicopter is immune to melee weapons!");
                }
                catch(err){
                    return message.reply("❌ You don't have any ammo for that weapon!");
                }
                
                // player attacked, remove passive shield
                if(passiveShieldCD) await app.cd.clearCD(message.author.id, 'passive_shield');

                if(app.itemdata[item].breaksOnUse === true){
                    await app.itm.removeItem(message.author.id, item, 1);
                }
                else if(Math.random() <= parseFloat(app.itemdata[item].chanceToBreak)){
                    weaponBroke = true;
                    await app.itm.removeItem(message.author.id, item, 1);
                    await app.itm.addItem(message.author.id, app.itemdata[item].recyclesTo.materials);
                    
                    const brokeEmbed = new app.Embed()
                    .setTitle('💥 Unfortunately, your ' + app.itemdata[item].icon + '`' + item + '` broke from your last attack!')
                    .setDescription('After rummaging through the pieces you were able to find:\n' + app.itm.getDisplay(app.itemdata[item].recyclesTo.materials).join('\n'))
                    .setColor(14831897)
                
                    try{
                        let dm = await message.author.getDMChannel();
                        await dm.createMessage(brokeEmbed);
                    }
                    catch(err){
                        // dm's disabled
                    }
                }

                await app.cd.setCD(message.author.id, 'attack', app.itemdata[item].cooldown.seconds * 1000);

                let randDmg = Math.floor(((Math.floor(Math.random() * (damageMax - damageMin + 1)) + damageMin) + bonusDamage) * row.scaledDamage);
                
                if(monsterRow.health - randDmg <= 0){
                    await app.cd.clearCD(message.channel.id, 'mob');
                    await app.cd.clearCD(message.channel.id, 'mobHalf');
                    await app.monsters.onFinished(message.channel.id, false);

                    let bestItem = app.monsters.pickRandomLoot(monster, 'main', app.itm.generateWeightedArray(monster.loot.main));
                    let extras = [];
                    let weightedExtras = app.itm.generateWeightedArray(monster.loot.extras);

                    extras.push(app.monsters.pickRandomLoot(monster, 'extras', weightedExtras));
                    extras.push(app.monsters.pickRandomLoot(monster, 'extras', weightedExtras));
                    extras.push(app.monsters.pickRandomLoot(monster, 'extras', weightedExtras));

                    await app.itm.addItem(message.author.id, [bestItem, ...extras]);
                    await app.player.addMoney(message.author.id, monsterRow.money);
                    await app.player.addPoints(message.author.id, monster.xp);

                    await app.query(`UPDATE scores SET kills = kills + 1 WHERE userId = ${message.author.id}`); // add 1 to kills

                    if(row.kills + 1 >= 20){
                        await app.itm.addBadge(message.author.id, 'specialist');
                    }
                    if(row.kills + 1 >= 100){
                        await app.itm.addBadge(message.author.id, 'hitman');
                    }

                    const killedReward = new app.Embed()
                    .setTitle('Loot Received')
                    .setColor(7274496)
                    .addField('Money', app.common.formatNumber(monsterRow.money))
                    .addField("Items", app.itm.getDisplay([bestItem]) + '\n\n**and...**\n' + app.itm.getDisplay(extras.sort(app.itm.sortItemsHighLow.bind(app))).join('\n'))
                    .setFooter('⭐ ' + monster.xp + ' XP earned!')

                    message.channel.createMessage({
                        content: generateAttackMobString(app, message, monsterRow, randDmg, item, ammoUsed, weaponBroke, true), 
                        embed: killedReward.embed
                    });
                }
                else{
                    let mobMoneyStolen = Math.floor((randDmg / monsterRow.health) * monsterRow.money);

                    await app.monsters.subMoney(message.channel.id, mobMoneyStolen);
                    await app.monsters.subHealth(message.channel.id, randDmg);

                    await app.player.addMoney(message.author.id, mobMoneyStolen);

                    message.channel.createMessage({
                        content: generateAttackMobString(app, message, monsterRow, randDmg, item, ammoUsed, weaponBroke, false, mobMoneyStolen), 
                        embed: (await app.monsters.genMobEmbed(message.channel.id, monster, monsterRow.health - randDmg, monsterRow.money - mobMoneyStolen)).embed
                    });

                    // mob attacks player
                    let mobDmg = Math.floor(Math.random() * (monster.maxDamage - monster.minDamage + 1)) + monster.minDamage;

                    if(row.health - mobDmg <= 0){
                        // player was killed
                        let randomItems = await app.itm.getRandomUserItems(message.author.id);
                        let moneyStolen = Math.floor((row.money + mobMoneyStolen) * .75);
                        
                        await app.itm.removeItem(message.author.id, randomItems.amounts);
                        await app.player.removeMoney(message.author.id, moneyStolen);

                        await app.query(`UPDATE scores SET deaths = deaths + 1 WHERE userId = ${message.author.id}`);
                        await app.query(`UPDATE scores SET health = 100 WHERE userId = ${message.author.id}`);
                        if(row.power >= -3){
                            await app.query(`UPDATE scores SET power = power - 2 WHERE userId = ${message.author.id}`);
                        }
                        else{
                            await app.query(`UPDATE scores SET power = -5 WHERE userId = ${message.author.id}`);
                        }
                        
                        const killedReward = new app.Embed()
                        .setTitle(`Loot Lost`)
                        .setDescription("Money: " + app.common.formatNumber(moneyStolen))
                        .setColor(7274496)
                        .addField("Items", randomItems.items.length !== 0 ? randomItems.display.join('\n') : `${monster.mentioned.charAt(0).toUpperCase()} did not find anything on you!`)

                        message.channel.createMessage({
                            content: generateMobAttack(app, message, monsterRow, row, mobDmg, monster.weapon, monster.ammo, true),
                            embed: killedReward.embed
                        });
    
                        // send notifications
                        if(serverInfo.killChan !== undefined && serverInfo.killChan !== 0 && serverInfo.killChan !== ''){
                            sendToKillFeed(app, {username: monster.title, discriminator: '0000', id: monsterRow.monster}, serverInfo.killChan, message.member, monster.weapon.name, mobDmg, randomItems, moneyStolen, true);
                        }
                        logKill(app, {username: monster.title, discriminator: '0000', id: monsterRow.monster}, message.author, monster.weapon.name, monster.ammo, mobDmg, moneyStolen, randomItems)
                    }
                    else{
                        await app.query(`UPDATE scores SET health = health - ${mobDmg} WHERE userId = ${message.author.id}`);
                        message.channel.createMessage(generateMobAttack(app, message, monsterRow, row, mobDmg, monster.weapon, monster.ammo, false));
                    }
                }
            }

            // check if attack is random
            else if(serverInfo.randomOnly === 1 && member){
                return message.reply(`❌ This server allows only random attacks, specifying a target will not work. You can use the item without a mention to attack a random player: \`${message.prefix}use <item>\``)
            }
            else if(['rand', 'random'].some(arg => message.args.map(arg => arg.toLowerCase()).includes(arg)) || serverInfo.randomOnly === 1){
                const randUsers = await getRandomPlayers(app, message.author.id, message.channel.guild);

                if(randUsers.users[0] === undefined){
                    return message.reply("❌ There aren't any players you can attack in this server!");
                }

                // try creating user collector first, to error out before doing anything else
                try{
                    app.msgCollector.createUserCollector(message.author.id, message.channel.id, m => {
                        return m.author.id === message.author.id
                    }, { time: 16000 });
                }
                catch(err){
                    return message.reply("❌ You have an active command running.");
                }

                let ammoUsed
                let bonusDamage = 0;
                let damageMin = app.itemdata[item].minDmg;
                let damageMax = app.itemdata[item].maxDmg;
                let weaponBroke = app.itemdata[item].breaksOnUse;
                
                // check for ammo and remove it
                try{
                    ammoUsed = getAmmo(app, item, row, userItems);

                    if(ammoUsed){
                        bonusDamage = app.itemdata[ammoUsed].damage;
                        await app.itm.removeItem(message.author.id, ammoUsed, 1);
                    }
                }
                catch(err){
                    app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);
                    return message.reply("❌ You don't have any ammo for that weapon!");
                }

                // player attacked, remove passive shield
                if(passiveShieldCD) await app.cd.clearCD(message.author.id, 'passive_shield');

                if(app.itemdata[item].breaksOnUse === true){
                    await app.itm.removeItem(message.author.id, item, 1);
                }
                else if(Math.random() <= parseFloat(app.itemdata[item].chanceToBreak)){
                    weaponBroke = true;
                    await app.itm.removeItem(message.author.id, item, 1);
                    await app.itm.addItem(message.author.id, app.itemdata[item].recyclesTo.materials);
                    
                    const brokeEmbed = new app.Embed()
                    .setTitle('💥 Unfortunately, your ' + app.itemdata[item].icon + '`' + item + '` broke from your last attack!')
                    .setDescription('After rummaging through the pieces you were able to find:\n' + app.itm.getDisplay(app.itemdata[item].recyclesTo.materials).join('\n'))
                    .setColor(14831897)
                
                    try{
                        let dm = await message.author.getDMChannel();
                        await dm.createMessage(brokeEmbed);
                    }
                    catch(err){
                        // dm's disabled
                    }
                }

                await app.cd.setCD(message.author.id, 'attack', app.itemdata[item].cooldown.seconds * 1000);

                let randDmg = Math.floor(((Math.floor(Math.random() * (damageMax - damageMin + 1)) + damageMin) + bonusDamage) * row.scaledDamage);

                let target = await pickTarget(app, message, randUsers);

                if(!target){
                    return message.channel.createMessage('❌ There was an error trying to find someone to attack! Please try again or report this in the support server.');
                }

                const victimRow = await app.player.getRow(target.id);
                let chance = Math.floor(Math.random() * 100) + 1; // 1-100
                let luck = victimRow.luck >= 10 ? 10 : victimRow.luck;

                if(chance <= luck){
                    if(weaponBroke){
                        return message.channel.createMessage(`🍀 <@${target.id}> EVADED **${message.member.nick || message.member.username}**'s attack! How lucky!\n\n${app.icons.minus}**${message.member.nick || message.member.username}**'s ${app.itemdata[item].icon}\`${item}\` broke.`);
                    }
                    else{
                        return message.channel.createMessage(`🍀 <@${target.id}> EVADED **${message.member.nick || message.member.username}**'s attack! How lucky!`);
                    }
                }
                
                // not lucky, continue attack
                else if(victimRow.health - randDmg <= 0){
                    // player was killed
                    
                    let randomItems = await app.itm.getRandomUserItems(target.id);
                    let xpGained = randomItems.items.length * 50;
                    let moneyStolen = Math.floor(victimRow.money * .75);

                    // passive shield, protects same player from being attacked for 24 hours
                    await app.cd.setCD(target.id, 'passive_shield', app.config.cooldowns.daily * 1000);

                    await app.itm.removeItem(target.id, randomItems.amounts);
                    await app.itm.addItem(message.author.id, randomItems.amounts);
                    await app.player.removeMoney(target.id, moneyStolen);
                    await app.player.addMoney(message.author.id, moneyStolen);

                    await app.player.addPoints(message.author.id, xpGained); // 50 xp for each item stolen

                    await app.query(`UPDATE scores SET kills = kills + 1 WHERE userId = ${message.author.id}`); // add 1 to kills
                    await app.query(`UPDATE scores SET deaths = deaths + 1 WHERE userId = ${target.id}`);
                    await app.query(`UPDATE scores SET health = 100 WHERE userId = ${target.id}`);

                    if(victimRow.power >= -3){
                        await app.query(`UPDATE scores SET power = power - 2 WHERE userId = ${target.id}`);
                    }
                    else{
                        await app.query(`UPDATE scores SET power = -5 WHERE userId = ${target.id}`);
                    }

                    if(row.kills + 1 >= 20){
                        await app.itm.addBadge(message.author.id, 'specialist');
                    }
                    if(row.kills + 1 >= 100){
                        await app.itm.addBadge(message.author.id, 'hitman');
                    }
                    
                    const killedReward = new app.Embed()
                    .setTitle('Loot Received')
                    .setColor(7274496)
                    .addField('Money', app.common.formatNumber(moneyStolen))
                    .addField("Items (" + randomItems.items.length + ")", randomItems.items.length !== 0 ? randomItems.display.join('\n') : 'They had no items to steal!')
                    .setFooter('⭐ ' + xpGained + ' XP earned!')
                    
                    message.channel.createMessage({
                        content: await generateAttackString(app, message, target, victimRow, randDmg, item, ammoUsed, weaponBroke, true), 
                        embed: killedReward.embed
                    });

                    // send notifications
                    if(victimRow.notify2) notifyDeathVictim(app, message, target, item, randDmg, randomItems.items.length !== 0 ? randomItems.display : ['You had nothing they could steal!']);
                    if(serverInfo.killChan !== undefined && serverInfo.killChan !== 0 && serverInfo.killChan !== ''){
                        sendToKillFeed(app, message.author, serverInfo.killChan, target, item, randDmg, randomItems, moneyStolen);
                    }
                    logKill(app, message.member, target, item, ammoUsed, randDmg, moneyStolen, randomItems)
                }
                else{
                    // normal attack
                    if(item === "peck_seed"){
                        await app.cd.setCD(target.id, 'peck', app.config.cooldowns.peck_seed * 1000);
                        
                        message.channel.createMessage(generateAttackString(app, message, target, victimRow, randDmg, item, ammoUsed, weaponBroke, false));
                    }
                    else{
                
                        message.channel.createMessage(generateAttackString(app, message, target, victimRow, randDmg, item, ammoUsed, weaponBroke, false));
                    }

                    await app.query(`UPDATE scores SET health = health - ${randDmg} WHERE userId = ${target.id}`);
                    if(victimRow.notify2) notifyAttackVictim(app, message, target, item, randDmg, victimRow);
                }
            }

            // attack is not random, requires a target
            else if(!member){
                return message.reply('❌ You need to mention someone to attack.');
            }
            else{
                const victimRow = await app.player.getRow(member.id);
                const playRow = await app.query(`SELECT * FROM userGuilds WHERE userId ="${member.id}" AND guildId = "${message.channel.guild.id}"`);
                const victimShield = await app.cd.getCD(member.id, 'shield');
                const victimPassiveShield = await app.cd.getCD(member.id, 'passive_shield');
                const victimPeckCD = await app.cd.getCD(member.id, 'peck');

                if(member.id === app.bot.user.id){
                    return message.channel.createMessage("ow...");
                }
                else if(member.id === message.author.id){
                    return message.reply("❌ You can't attack yourself!");
                }
                else if(!victimRow){
                    return message.reply("❌ The person you're trying to attack doesn't have an account!");
                }
                else if(row.clanId !== 0 && victimRow.clanId === row.clanId){
                    return message.reply("❌ You can't attack members of your own clan!");
                }
                else if(!playRow.length){
                    return message.reply(`❌ **${member.nick || member.username}** has not activated their account in this server!`);
                }
                else if(victimShield){
                    return message.reply(`🛡 **${member.nick || member.username}** has a shield active!\nThey are untargetable for \`${victimShield}\`.`);
                }
                else if(victimPassiveShield){
                    return message.reply(`🛡 **${member.nick || member.username}** was killed recently and has a **passive shield**!\nThey are untargetable for \`${victimPassiveShield}\`.`);
                }
                else if(item === 'peck_seed' && victimPeckCD){
                    return message.reply(`**${member.nick || member.username}** is already under the effects of a ${app.itemdata['peck_seed'].icon}\`peck_seed\`!`);
                }

                let ammoUsed
                let bonusDamage = 0;
                let damageMin = app.itemdata[item].minDmg;
                let damageMax = app.itemdata[item].maxDmg;
                let weaponBroke = app.itemdata[item].breaksOnUse;
                
                try{
                    ammoUsed = getAmmo(app, item, row, userItems);

                    if(ammoUsed){
                        bonusDamage = app.itemdata[ammoUsed].damage;
                        await app.itm.removeItem(message.author.id, ammoUsed, 1);
                    }
                }
                catch(err){
                    return message.reply("❌ You don't have any ammo for that weapon!");
                }

                // player attacked, remove passive shield
                if(passiveShieldCD) await app.cd.clearCD(message.author.id, 'passive_shield');

                // remove ammo here
                if(app.itemdata[item].breaksOnUse === true){
                    await app.itm.removeItem(message.author.id, item, 1);
                }
                else if(Math.random() <= parseFloat(app.itemdata[item].chanceToBreak)){
                    weaponBroke = true;
                    await app.itm.removeItem(message.author.id, item, 1);
                    await app.itm.addItem(message.author.id, app.itemdata[item].recyclesTo.materials);
                    
                    const brokeEmbed = new app.Embed()
                    .setTitle('💥 Unfortunately, your ' + app.itemdata[item].icon + '`' + item + '` broke from your last attack!')
                    .setDescription('After rummaging through the pieces you were able to find:\n' + app.itm.getDisplay(app.itemdata[item].recyclesTo.materials).join('\n'))
                    .setColor(14831897)
                
                    try{
                        let dm = await message.author.getDMChannel();
                        await dm.createMessage(brokeEmbed);
                    }
                    catch(err){
                        // dm's disabled
                    }
                }

                await app.cd.setCD(message.author.id, 'attack', app.itemdata[item].cooldown.seconds * 1000);

                let randDmg = Math.floor(((Math.floor(Math.random() * (damageMax - damageMin + 1)) + damageMin) + bonusDamage) * row.scaledDamage);
                let chance = Math.floor(Math.random() * 100) + 1; // 1-100
                let luck = victimRow.luck >= 10 ? 10 : victimRow.luck;

                if(chance <= luck){
                    if(weaponBroke){
                        return message.channel.createMessage(`🍀 <@${member.id}> EVADED **${message.member.nick || message.member.username}**'s attack! How lucky!\n\n${app.icons.minus}**${message.member.nick || message.member.username}**'s ${app.itemdata[item].icon}\`${item}\` broke.`);
                    }
                    else{
                        return message.channel.createMessage(`🍀 <@${member.id}> EVADED **${message.member.nick || message.member.username}**'s attack! How lucky!`);
                    }
                }

                // not lucky, continue attack
                else if(victimRow.health - randDmg <= 0){
                    // player was killed
                    
                    let randomItems = await app.itm.getRandomUserItems(member.id);
                    let xpGained = randomItems.items.length * 50;
                    let moneyStolen = Math.floor(victimRow.money * .75);

                    // passive shield, protects same player from being attacked for 24 hours
                    await app.cd.setCD(member.id, 'passive_shield', app.config.cooldowns.daily * 1000);

                    await app.itm.removeItem(member.id, randomItems.amounts);
                    await app.itm.addItem(message.author.id, randomItems.amounts);
                    await app.player.removeMoney(member.id, moneyStolen);
                    await app.player.addMoney(message.author.id, moneyStolen);

                    await app.player.addPoints(message.author.id, xpGained); // 50 xp for each item stolen

                    await app.query(`UPDATE scores SET kills = kills + 1 WHERE userId = ${message.author.id}`); // add 1 to kills
                    await app.query(`UPDATE scores SET deaths = deaths + 1 WHERE userId = ${member.id}`);
                    await app.query(`UPDATE scores SET health = 100 WHERE userId = ${member.id}`);

                    if(victimRow.power >= -3){
                        await app.query(`UPDATE scores SET power = power - 2 WHERE userId = ${member.id}`);
                    }
                    else{
                        await app.query(`UPDATE scores SET power = -5 WHERE userId = ${member.id}`);
                    }

                    if(row.kills + 1 >= 20){
                        await app.itm.addBadge(message.author.id, 'specialist');
                    }
                    if(row.kills + 1 >= 100){
                        await app.itm.addBadge(message.author.id, 'hitman');
                    }
                    
                    const killedReward = new app.Embed()
                    .setTitle('Loot Received')
                    .setColor(7274496)
                    .addField('Money', app.common.formatNumber(moneyStolen))
                    .addField("Items (" + randomItems.items.length + ")", randomItems.items.length !== 0 ? randomItems.display.join('\n') : 'They had no items to steal!')
                    .setFooter('⭐ ' + xpGained + ' XP earned!')
                    
                    message.channel.createMessage({
                        content: await generateAttackString(app, message, member, victimRow, randDmg, item, ammoUsed, weaponBroke, true), 
                        embed: killedReward.embed
                    });

                    // send notifications
                    if(victimRow.notify2) notifyDeathVictim(app, message, member, item, randDmg, randomItems.items.length !== 0 ? randomItems.display : ['You had nothing they could steal!']);
                    if(serverInfo.killChan !== undefined && serverInfo.killChan !== 0 && serverInfo.killChan !== ''){
                        sendToKillFeed(app, message.author, serverInfo.killChan, member, item, randDmg, randomItems, moneyStolen);
                    }
                    logKill(app, message.member, member, item, ammoUsed, randDmg, moneyStolen, randomItems)
                }
                else{
                    // normal attack
                    if(item === "peck_seed"){
                        await app.cd.setCD(member.id, 'peck', app.config.cooldowns.peck_seed * 1000);
                        
                        message.channel.createMessage(generateAttackString(app, message, member, victimRow, randDmg, item, ammoUsed, weaponBroke, false));
                    }
                    else{
                
                        message.channel.createMessage(generateAttackString(app, message, member, victimRow, randDmg, item, ammoUsed, weaponBroke, false));
                    }

                    await app.query(`UPDATE scores SET health = health - ${randDmg} WHERE userId = ${member.id}`);
                    if(victimRow.notify2) notifyAttackVictim(app, message, member, item, randDmg, victimRow);
                }
            }

        }
        else{
            return message.reply(`❌ That item cannot be used on yourself or other players. \`${message.prefix}use <item> <@user>\``);
        }
    },
}

function getAmmo(app, item, row, userItems){
    if(app.itemdata[item].ammo.length >= 1){
        if(app.itemdata[item].ammo.includes(row.ammo) && userItems[row.ammo] >= 1){
            return row.ammo;
        }
        else{
            for(let ammo of app.itemdata[item].ammo){
                if(userItems[ammo] >= 1){
                    return ammo;
                }
            }

            if(app.itemdata[item].ammoOptional !== true){
                throw new Error('No Ammo');
            }
            
            return undefined;
        }
    }
    else{
        return undefined;
    }
}

function logKill(app, killer, victim, item, ammo, damage, moneyStolen, itemsLost){
    try{
        const embed = new app.Embed()
        .setTitle('Kill Log')
        .setColor(2713128)
        .setDescription(`**Weapon**: \`${item}\` - **${damage} damage**\n**Ammo**: ${ammo ? '`' + ammo + '`' : 'Not required'}`)
        .addField('Killer', (killer.username + '#' + killer.discriminator) + ' ID: ```\n' + killer.id + '```')
        .addField('Victim', (victim.username + '#' + victim.discriminator) + ' ID: ```\n' + victim.id + '```')
        .addField('Items Stolen', itemsLost.items.length !== 0 ? itemsLost.display.join('\n') : 'Nothing', true)
        .addField('Money Stolen', app.common.formatNumber(moneyStolen), true)
        .setTimestamp()
        
        app.messager.messageLogs(embed);
    }
    catch(err){
        console.warn(err);
    }
}

function generateAttackString(app, message, victim, victimRow, damage, itemUsed, ammoUsed, itemBroke, killed){
    let finalStr;

    if(ammoUsed && itemUsed === 'bat'){
        finalStr = `**ITS A GRAND SLAM!** <@${message.author.id}> fires a ${app.itemdata[ammoUsed].icon}\`${ammoUsed}\` directly at <@${victim.id}>'s face using a ${app.itemdata[itemUsed].icon}\`${itemUsed}\`. **${damage}** damage dealt!`
    }
    else{
        finalStr = app.itemdata[itemUsed].phrase.replace('{attacker}', `<@${message.author.id}>`)
        .replace('{victim}', `<@${victim.id}>`)
        .replace('{weaponIcon}', app.itemdata[itemUsed].icon)
        .replace('{weapon}', itemUsed)
        .replace('{ammoIcon}', ammoUsed ? app.itemdata[ammoUsed].icon : '')
        .replace('{ammo}', ammoUsed)
        .replace('{damage}', damage);
    }

    if(killed){
        finalStr += `\n${app.icons.death_skull} **${victim.nick || victim.username} DIED!**`
    }
    else{
        if(Math.random() <= .5) finalStr += `\n**${victim.nick || victim.username}** is spared with ${app.player.getHealthIcon(victimRow.health - damage, victimRow.maxHealth)} **${victimRow.health - damage}** health.`;
        else finalStr += `\n**${victim.nick || victim.username}** is left with ${app.player.getHealthIcon(victimRow.health - damage, victimRow.maxHealth)} **${victimRow.health - damage}** health.`;
    }

    if(itemUsed == 'peck_seed'){
        finalStr += `\n**${victim.nick || victim.username}** was turned into a chicken and cannot use any commands for **2** hours!`;
    }

    if(itemBroke){
        switch(itemUsed){
            case "fish": finalStr += `\n\n${app.icons.minus}**${message.member.nick || message.member.username}**'s ${app.itemdata[itemUsed].icon}\`${itemUsed}\` split!`; break;
            default: finalStr += `\n\n${app.icons.minus}**${message.member.nick || message.member.username}**'s ${app.itemdata[itemUsed].icon}\`${itemUsed}\` broke.`;
        }
    }

    return finalStr;
}

function generateAttackMobString(app, message, monsterRow, damage, itemUsed, ammoUsed, itemBroke, killed, moneyStolen){
    const monster = app.mobdata[monsterRow.monster];
    let finalStr = app.itemdata[itemUsed].phrase.replace('{attacker}', `<@${message.author.id}>`)
    .replace('{victim}', monster.mentioned)
    .replace('{weaponIcon}', app.itemdata[itemUsed].icon)
    .replace('{weapon}', itemUsed)
    .replace('{ammoIcon}', ammoUsed ? app.itemdata[ammoUsed].icon : '')
    .replace('{ammo}', ammoUsed)
    .replace('{damage}', damage);
    
    if(killed){
        finalStr += `\n${app.icons.death_skull} ${monster.mentioned.charAt(0).toUpperCase() + monster.mentioned.slice(1)} DIED!`
    }
    else{
        finalStr += `\n${monster.mentioned.charAt(0).toUpperCase() + monster.mentioned.slice(1)} is left with ${app.icons.health.full} **${monsterRow.health - damage}** health.`;
    }

    if(itemUsed == 'peck_seed'){
        finalStr += `\n${monster.mentioned.charAt(0).toUpperCase() + monster.mentioned.slice(1)} resisted the effects of the ${app.itemdata[itemUsed].icon}\`${itemUsed}\`!`;
    }

    if(moneyStolen){
        finalStr += `\n\n**${message.member.nick || message.member.username}** dealt **${Math.floor((damage / monsterRow.health).toFixed(2) * 100)}%** of ${monster.mentioned}'s current health and managed to steal **${app.common.formatNumber(moneyStolen)}**.`;
    }

    if(itemBroke && moneyStolen){
        finalStr += `\n${app.icons.minus}**${message.member.nick || message.member.username}**'s ${app.itemdata[itemUsed].icon}\`${itemUsed}\` broke.`;
    }
    else if(itemBroke){
        finalStr += `\n\n${app.icons.minus}**${message.member.nick || message.member.username}**'s ${app.itemdata[itemUsed].icon}\`${itemUsed}\` broke.`;
    }

    return finalStr;
}

function generateMobAttack(app, message, monsterRow, playerRow, damage, itemUsed, ammoUsed, killed){
    const monster = app.mobdata[monsterRow.monster];
    let finalStr = "";

    if(ammoUsed){
        // weapon uses ammo
        finalStr = `${monster.mentioned.charAt(0).toUpperCase() + monster.mentioned.slice(1)} fires a ${app.itemdata[ammoUsed].icon}\`${ammoUsed}\` straight at <@${message.author.id}> using a ${itemUsed.icon}\`${itemUsed.name}\`! **${damage}** damage dealt!`;
    }
    else{
        // melee weapon
        finalStr = `${monster.mentioned.charAt(0).toUpperCase() + monster.mentioned.slice(1)} smashes <@${message.author.id}> with a ${itemUsed.icon}\`${itemUsed.name}\` dealing **${damage}** damage!`;
    }

    if(killed){
        finalStr += `\n${app.icons.death_skull} **${message.member.nick || message.member.username} DIED!**`
    }
    else{
        finalStr += `\n**${message.member.nick || message.member.username}** is left with ${app.player.getHealthIcon(playerRow.health - damage, playerRow.maxHealth)} **${playerRow.health - damage}** health.`;
    }

    return finalStr;
}

async function getRandomPlayers(app, userId, guild){ // returns a random userId from the attackers guild
    const userRows = await app.query(`SELECT * FROM userGuilds WHERE guildId ="${guild.id}" ORDER BY LOWER(userId)`);
    const userClan = await app.player.getRow(userId);
    let guildUsers = [];
    let members = [];
    
    for(var i = 0; i < userRows.length; i++){
        try{
            const hasShield = await app.cd.getCD(userRows[i].userId, 'shield');
            const passiveShield = await app.cd.getCD(userRows[i].userId, 'passive_shield');
            const userClanId = (await app.query(`SELECT clanId FROM scores WHERE userId ="${userRows[i].userId}"`))[0];

            if(userRows[i].userId !== userId){
                if(!hasShield && !passiveShield && (userClan.clanId === 0 || userClan.clanId !== userClanId.clanId)){
                    guildUsers.push(userRows[i].userId);
                }
            }
        }
        catch(err){
            console.log(err);
        }
    }

    const shuffled = guildUsers.sort(() => 0.5 - Math.random()); // Shuffle
    let rand = shuffled.slice(0, 3); // Pick 3 random id's

    for(let id of rand){
        let member = await app.common.fetchMember(guild, id);
        
        if(!member){
            rand.splice(rand.indexOf(id), 1);
            console.log(id + ' member not found.');
        }
        else{
            members.push(member);
        }
    }

    return {
        users: rand,
        members: members,
        activeCount: userRows.length
    }
}

async function pickTarget(app, message, selection){
    if(selection.activeCount < RANDOM_SELECTION_MINIMUM || selection.users.length < 3){
        return selection.members[0];
    }
    else{
        try{
            const userdata = {
                user1: await app.player.getRow(selection.users[0]),
                user2: await app.player.getRow(selection.users[1]),
                user3: await app.player.getRow(selection.users[2])
            };
            const atkEmbed = new app.Embed()
            .setAuthor((message.author.username + '#' + message.author.discriminator), message.author.avatarURL)
            .setTitle('Pick someone to attack!')
            .setDescription(`Type 1, 2, or 3 to select.\n
            1. ${app.player.getBadge(userdata.user1.badge)} **${(selection.members[0]).username + '#' + (selection.members[0]).discriminator}** ${app.icons.health.full} ${userdata.user1.health} - ${app.common.formatNumber(userdata.user1.money)} - ${(await app.itm.getItemCount(await app.itm.getItemObject(selection.users[0]), userdata.user1)).itemCt} items\n
            2. ${app.player.getBadge(userdata.user2.badge)} **${(selection.members[1]).username + '#' + (selection.members[1]).discriminator}** ${app.icons.health.full} ${userdata.user2.health} - ${app.common.formatNumber(userdata.user2.money)} - ${(await app.itm.getItemCount(await app.itm.getItemObject(selection.users[1]), userdata.user2)).itemCt} items\n
            3. ${app.player.getBadge(userdata.user3.badge)} **${(selection.members[2]).username + '#' + (selection.members[2]).discriminator}** ${app.icons.health.full} ${userdata.user3.health} - ${app.common.formatNumber(userdata.user3.money)} - ${(await app.itm.getItemCount(await app.itm.getItemObject(selection.users[2]), userdata.user3)).itemCt} items`)
            .setColor(13451564)
            .setFooter('You have 15 seconds to choose. Otherwise one will be chosen for you.')

            const botMessage = await message.channel.createMessage(atkEmbed);

            const collector = app.msgCollector.collectors[`${message.author.id}_${message.channel.id}`].collector;
            
            return new Promise(resolve => {
                collector.on('collect', m => {
                    if(m.content === '1'){
                        botMessage.delete();
                        app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);
                        resolve(selection.members[0]);
                    }
                    else if(m.content === '2'){
                        botMessage.delete();
                        app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);
                        resolve(selection.members[1]);
                    }
                    else if(m.content === '3'){
                        botMessage.delete();
                        app.msgCollector.stopCollector(`${message.author.id}_${message.channel.id}`);
                        resolve(selection.members[2]);
                    }
                });
                collector.on('end', reason => {
                    if(reason === 'time'){
                        botMessage.delete();
                        resolve(selection.members[Math.floor(Math.random() * selection.members.length)]);
                    }
                });
            });
        }
        catch(err){
            console.log(err);
            //if bot is lagging and attack message does not send...
        }
    }
    
}

async function notifyAttackVictim(app, message, victim, itemUsed, damage, victimRow){
    const notifyEmbed = new app.Embed()
    .setTitle('You were attacked!')
    .setDescription(`${(message.author.username + '#' + message.author.discriminator)} hit you for **${damage}** damage using a ${app.itemdata[itemUsed].icon}\`${itemUsed}\`.
    
    Health: ${app.player.getHealthIcon(victimRow.health - damage, victimRow.maxHealth)} **${victimRow.health - damage} / ${victimRow.maxHealth}**`)
    .setColor(16610383)

    try{
        let dm = await victim.user.getDMChannel();
        await dm.createMessage(notifyEmbed);
    }
    catch(err){
        // user disabled DMs
    }
}
async function notifyDeathVictim(app, message, victim, itemUsed, damage, itemsLost){
    const notifyEmbed = new app.Embed()
    .setTitle('You were killed!')
    .setDescription(`${(message.author.username + '#' + message.author.discriminator)} hit you for **${damage}** damage using a ${app.itemdata[itemUsed].icon}\`${itemUsed}\`.`)
    .addField('Items Lost:', itemsLost.join('\n'))
    .setColor(16600911)

    try{
        let dm = await victim.user.getDMChannel();
        await dm.createMessage(notifyEmbed);
    }
    catch(err){
        // user disabled DMs
    }
}

async function sendToKillFeed(app, killer, channelID, victim, itemName, itemDmg, itemsStolen, moneyStolen, monster = false){
    const killEmbed = new app.Embed()
    .setDescription((monster ? killer.username : "<@" + killer.id + ">") + " 🗡 " + ("<@" + victim.user.id + ">") + " 💀")
    .addField('Weapon Used', `${monster ? app.mobdata[killer.id].weapon.icon : app.itemdata[itemName].icon}\`${itemName}\` - **${itemDmg} damage**`)
    .addField('Items Stolen', itemsStolen.items.length !== 0 ? itemsStolen.display.join('\n') : 'Nothing', true)
    .addField('Money Stolen', app.common.formatNumber(moneyStolen), true)
    .setColor(16734296)
    .setTimestamp()

    try{
        await app.bot.createMessage(channelID, killEmbed);
    }
    catch(err){
        // no killfeed channel found
    }
}