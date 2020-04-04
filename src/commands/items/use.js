// const Discord = require('discord.js');
// const { query } = require('../mysql.js');
// const methods = require('../methods/methods.js');
// const boxes = require('../methods/open_box.js');
// const config = require('../json/_config.json');
// const itemdata = require('../json/completeItemList.json');
// const general = require('../methods/general');
//const icons = require('../json/icons');
const RANDOM_SELECTION_MINIMUM = 10; // # of active players required for an attack menu to show when using random

module.exports = {
    name: 'use',
    aliases: ['attack', 'heal'],
    description: 'Use items on yourself or use weapons to attack others!',
    long: 'Use an item on yourself or attack another user with a weapon.',
    args: {"item": "Item to use.", "@user": "User to attack item with."},
    examples: ["use ak47 @blobfysh","use medkit","use rock random"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        let member = app.parse.members(message, message.args)[0];
        let amount = app.parse.numbers(message.args)[0] || 1;
        let item = app.parse.items(message.args)[0];

        if(!item){
            return message.reply(`❌ You need to specify an item to use! \`${message.prefix}use <item>\`. For more information and examples, type \`${message.prefix}help use\`.`);
        }
        else if(member && !app.itemdata[item].isWeap){
            // tried using item on someone
            return message.reply('❌ That item cannot be used to attack another player.');
        }
        else if(app.itemdata[item].isItem){
            const userItems = await app.itm.getItemObject(message.author.id);
            if(amount > 10) amount = 10;

            if(!await app.itm.hasItems(message.author.id, item, amount)){
                return message.reply(`❌ You don't have enough of that item! You have **${userItems[item] || 0}x** ${app.itemdata[item].icon}\`${item}\``);
            }

            if(['item_box', 'ultra_box', 'candy_pail', 'present', 'care_package'].includes(item)){
                // open box
                if(!await app.itm.hasSpace(message.author.id)){
                    return message.reply("❌ **You don't have enough space in your inventory!** You can clear up space by selling some items.");
                }

                await app.itm.removeItem(message.author.id, item, amount);

                let results = app.itm.openBox(item, amount, row.luck);
                
                await app.itm.addItem(message.author.id, results.itemAmounts);
                await app.player.addPoints(message.author.id, results.xp);

                const embedInfo = new app.Embed()
                .setAuthor(message.member.effectiveName, message.author.avatarURL)
                .setColor(14202368)
                if(amount === 1){
                    embedInfo.setTitle('You received ' + results.display.join());
                    embedInfo.setFooter('⭐ ' + results.xp + ' XP earned!')

                    if(app.itemdata[results.itemAmounts[0].split('|')[0]].image != ""){
                        embedInfo.setImage(app.itemdata[results.itemAmounts[0].split('|')[0]].image);
                    }
                }
                else{
                    embedInfo.setFooter('⭐ ' + results.xp + ' XP earned!');
                    embedInfo.setDescription(results.display.join('\n'));
                    embedInfo.setTitle(amount + " boxes opened.");
                }

                message.channel.createMessage(embedInfo);
            }
            else if(item === 'supply_signal'){
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
                        .setTitle(`A \`care_package\` has arrived`)
                        .setDescription(`Use \`${message.prefix}claimdrop\` to claim it!`)
                        .setImage(app.itemdata['care_package'].image)
                        .setColor(13215302)
                        app.query(`UPDATE guildInfo SET dropItemChan = '${message.channel.id}' WHERE guildId = ${message.guild.id}`);
                        app.query(`UPDATE guildInfo SET dropItem = 'care_package' WHERE guildId = ${message.guild.id}`);
                        
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
                    message.reply(`You have healed for \`${randHeal}\` HP! Current HP: ${app.player.getHealthIcon(row.health + randHeal, row.maxHealth)} ${row.health + randHeal}/${row.maxHealth}`);
                }
                else if(userMaxHeal <= randHeal){
                    await app.query(`UPDATE scores SET health = health + ${userMaxHeal} WHERE userId = '${message.author.id}'`);
                    await app.itm.removeItem(message.author.id, item, 1);
                    message.reply(`You have healed for \`${userMaxHeal}\` HP! Current HP: ${app.player.getHealthIcon(row.health + userMaxHeal, row.maxHealth)} ${row.health + userMaxHeal}/${row.maxHealth}`);
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

                const msgEmbed = new app.Embed()
                .setAuthor(message.member.effectiveName, message.author.avatarURL)
                .setTitle("Successfully used 📜`reroll_scroll`")
                .setDescription("Your skills have been reset.")
                .setColor(14202368)
                message.channel.createMessage(msgEmbed);
            }
            else if(item === 'xp_potion'){
                const xpCD = await app.cd.getCD(message.author.id, 'xp_potion');
        
                if(xpCD){
                    return message.reply(`You need to wait \`${xpCD}\` before using another ${app.itemdata['xp_potion'].icon}\`xp_potion\`.`);
                }
                
                await app.cd.setCD(message.author.id, 'xp_potion', app.config.cooldowns.xp_potion * 1000);
                await app.itm.removeItem(message.author.id, 'xp_potion', 1);
                await app.query(`UPDATE scores SET points = points + 75 WHERE userId = '${message.author.id}'`);
                
                const msgEmbed = new app.Embed()
                .setAuthor(message.member.effectiveName, message.author.avatarURL)
                .setTitle("Successfully used `xp_potion`")
                .setDescription("Gained **75 XP**!")
                .setColor(14202368)
                message.channel.createMessage(msgEmbed);
            }
        }
        else if(app.itemdata[item].isWeap){
            const userItems = await app.itm.getItemObject(message.author.id);
            const serverInfo = (await app.query(`SELECT * FROM guildInfo WHERE guildId = ${message.guild.id}`))[0];
            const attackCD = await app.cd.getCD(message.author.id, 'attack');
            const shieldCD = await app.cd.getCD(message.author.id, 'shield');
            // item is a weapon, start checking for member
            
            if(!await app.itm.hasItems(message.author.id, item, 1)){
                return message.reply(`❌ You don't have that weapon.`);
            }
            else if(attackCD){
                return message.reply(`❌ You need to wait \`${attackCD}\` before attacking again.`);
            }
            else if(shieldCD){
                return message.reply(`❌ You can't attack while you have a shield active! \`${shieldCD}\` remaining.`);
            }
            
            // check if attack is random
            if(['rand', 'random'].some(arg => message.args.includes(arg)) || serverInfo.randomOnly === 1){
                const randUsers = await getRandomPlayers(app, message.author.id, message.guild);

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
                    return message.reply("❌ You don't have any ammo for that weapon!");
                }


                if(app.itemdata[item].breaksOnUse === true){
                    await app.itm.removeItem(message.author.id, item, 1);
                }
                else if(Math.random() <= parseFloat(app.itemdata[item].chanceToBreak)){
                    weaponBroke = true;
                    await app.itm.removeItem(message.author.id, item, 1);
                    await app.itm.addItem(message.author.id, app.itemdata[item].recyclesTo.materials);
                    
                    const brokeEmbed = new app.Embed()
                    .setTitle('💥 Unfortunately, your ' + app.itemdata[item].icon + '`' + item + '` broke from your last attack!')
                    .setDescription('After rummaging through the pieces you were able to find: ```fix\n' + app.itemdata[item].recyclesTo.display + '```')
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

                const victimRow = await app.player.getRow(target.id);
                let chance = Math.floor(Math.random() * 100) + 1; // 1-100
                let luck = victimRow.luck >= 10 ? 10 : victimRow.luck;

                if(chance <= luck){
                    if(weaponBroke){
                        return message.channel.createMessage(`🍀<@${target.id}> EVADED **${message.member.effectiveName}**'s attack! How lucky!\n${app.icons.minus}**${message.member.effectiveName}**'s ${app.itemdata[item].icon}${item} broke.`);
                    }
                    else{
                        return message.channel.createMessage(`🍀<@${target.id}> EVADED **${message.member.effectiveName}**'s attack! How lucky!`);
                    }
                }
                
                // not lucky, continue attack
                else if(victimRow.health - randDmg <= 0){
                    // player was killed
                    
                    let randomItems = await app.itm.getRandomUserItems(target.id);
                    let xpGained = randomItems.items.length * 50;
                    await app.itm.removeItem(target.id, randomItems.amounts);
                    await app.itm.addItem(message.author.id, randomItems.amounts);
                    await app.player.removeMoney(target.id, victimRow.money);
                    await app.player.addMoney(message.author.id, victimRow.money);

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
                    
                    const killedReward = new app.Embed()
                    .setTitle('LOOT RECEIVED')
                    .setDescription("Money: " + app.common.formatNumber(victimRow.money) + "\nExperience: `" + xpGained + "xp`")
                    .setColor(7274496)
                    .addField("Items", randomItems.items.length !== 0 ? randomItems.display.join('\n') : 'They had no items to steal!')
                    
                    message.channel.createMessage({
                        content: await generateAttackString(app, message, target, victimRow, randDmg, item, ammoUsed, weaponBroke, true), 
                        embed: killedReward.embed
                    });

                    // send notifications
                    if(victimRow.notify2) notifyDeathVictim(app, message, target, item, randDmg, randomItems.items.length !== 0 ? randomItems.display : 'You had nothing they could steal!');
                    if(serverInfo.killChan !== undefined && serverInfo.killChan !== 0 && serverInfo.killChan !== ''){
                        sendToKillFeed(app, message, serverInfo.killChan, target, item, randDmg);
                    }
                    logKill(app, message.member, target, item, ammoUsed, randDmg, victimRow.money, randomItems.items.length !== 0 ? randomItems.display : 'Nothing')
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
                const playRow = await app.query(`SELECT * FROM userGuilds WHERE userId ="${member.id}" AND guildId = "${message.guild.id}"`);
                const victimShield = await app.cd.getCD(member.id, 'shield');
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
                    return message.reply("❌ That user has not activated their account in this server!");
                }
                else if(victimShield){
                    return message.reply(`🛡 This person has a shield active!\nThey are untargetable for \`${victimShield}\`.`);
                }
                else if(item === 'peck_seed' && victimPeckCD){
                    return message.reply('That player is already under the effects of a `peck_seed`!');
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
                    .setDescription('After rummaging through the pieces you were able to find: ```fix\n' + app.itemdata[item].recyclesTo.display + '```')
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
                        return message.channel.createMessage(`🍀<@${member.id}> EVADED **${message.member.effectiveName}**'s attack! How lucky!\n${app.icons.minus}**${message.member.effectiveName}**'s ${app.itemdata[item].icon}${item} broke.`);
                    }
                    else{
                        return message.channel.createMessage(`🍀<@${member.id}> EVADED **${message.member.effectiveName}**'s attack! How lucky!`);
                    }
                }

                // not lucky, continue attack
                else if(victimRow.health - randDmg <= 0){
                    // player was killed
                    
                    let randomItems = await app.itm.getRandomUserItems(member.id);
                    let xpGained = randomItems.items.length * 50;
                    await app.itm.removeItem(member.id, randomItems.amounts);
                    await app.itm.addItem(message.author.id, randomItems.amounts);
                    await app.player.removeMoney(member.id, victimRow.money);
                    await app.player.addMoney(message.author.id, victimRow.money);

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
                    
                    const killedReward = new app.Embed()
                    .setTitle('LOOT RECEIVED')
                    .setDescription("Money: " + app.common.formatNumber(victimRow.money) + "\nExperience: `" + xpGained + "xp`")
                    .setColor(7274496)
                    .addField("Items", randomItems.items.length !== 0 ? randomItems.display.join('\n') : 'They had no items to steal!')
                    
                    message.channel.createMessage({
                        content: await generateAttackString(app, message, member, victimRow, randDmg, item, ammoUsed, weaponBroke, true), 
                        embed: killedReward.embed
                    });

                    // send notifications
                    if(victimRow.notify2) notifyDeathVictim(app, message, member, item, randDmg, randomItems.items.length !== 0 ? randomItems.display : 'You had nothing they could steal!');
                    if(serverInfo.killChan !== undefined && serverInfo.killChan !== 0 && serverInfo.killChan !== ''){
                        sendToKillFeed(app, message, serverInfo.killChan, member, item, randDmg);
                    }
                    logKill(app, message.member, member, item, ammoUsed, randDmg, victimRow.money, randomItems.items.length !== 0 ? randomItems.display : 'Nothing')
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
        .setTitle('💀 Kill Log')
        .setColor(16721703)
        .setDescription(`**Weapon**: ${app.itemdata[item].icon}\`${item}\` - **${damage} damage**\n**Ammo**: ${app.itemdata[ammo].icon}\`${ammo}\``)
        .addField('Killer', killer.tag + ' ID: ' + killer.id)
        .addField('Victim', victim.tag + ' ID: ' + victim.id)
        .addField('Items Stolen', itemsLost.join('\n'), true)
        .addField('Money Stolen', app.common.formatNumber(moneyStolen), true)
        .setTimestamp()
        
        app.messager.messageLogs(embed);
    }
    catch(err){
        console.warn(require('util').inspect(err));
    }
}

function generateAttackString(app, message, victim, victimRow, damage, itemUsed, ammoUsed, itemBroke, killed){
    let weaponRarity = app.itemdata[itemUsed].rarity;
    let finalStr = "";

    if(ammoUsed){
        // weapon uses ammo
        finalStr = `<@${message.author.id}> fires a ${app.itemdata[ammoUsed].icon}\`${ammoUsed}\` straight through <@${victim.id}>'s chest using a ${app.itemdata[itemUsed].icon}\`${itemUsed}\`! **${damage}** damage dealt!`;
    }
    else{
        // melee weapon
        switch(weaponRarity){
            case "Common": finalStr = `<@${message.author.id}> slapped <@${victim.id}> with a ${app.itemdata[itemUsed].icon}\`${itemUsed}\` dealing **${damage}** damage!`; break;
            case "Uncommon": finalStr = `<@${message.author.id}> smacks <@${victim.id}> with a ${app.itemdata[itemUsed].icon}\`${itemUsed}\` dealing **${damage}** damage!`; break;
            case "Rare": finalStr = `<@${message.author.id}> uses a ${app.itemdata[itemUsed].icon}\`${itemUsed}\` on <@${victim.id}> dealing **${damage}** damage!`; break;
            default: finalStr = `<@${message.author.id}> attacks <@${victim.id}> with a ${app.itemdata[itemUsed].icon}\`${itemUsed}\` dealing **${damage}** damage!`; break;
        }
    }

    if(killed){
        finalStr += `\n${app.icons.death_skull} **${victim.effectiveName} DIED!**`
    }
    else{
        if(Math.random() <= .5) finalStr += `\n**${victim.effectiveName}** is spared with ${app.player.getHealthIcon(victimRow.health - damage, victimRow.maxHealth)} **${victimRow.health - damage}** health.`;
        else finalStr += `\n**${victim.effectiveName}** is left with ${app.player.getHealthIcon(victimRow.health - damage, victimRow.maxHealth)} **${victimRow.health - damage}** health.`;
    }

    if(itemUsed == 'peck_seed'){
        finalStr += `\n**${victim.effectiveName}** was turned into a chicken and cannot use any commands for **2** hours!`;
    }

    if(itemBroke){
        finalStr += `\n${app.icons.minus}**${message.member.effectiveName}**'s ${app.itemdata[itemUsed].icon}\`${itemUsed}\` broke.`;
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
            const userClanId = (await app.query(`SELECT clanId FROM scores WHERE userId ="${userRows[i].userId}"`))[0];

            if(userRows[i].userId !== userId){
                if(!hasShield && (userClan.clanId === 0 || userClan.clanId !== userClanId.clanId)){
                    guildUsers.push(userRows[i].userId);
                }
            }
        }
        catch(err){
            console.log(require('util').inspect(err));
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
                user1: (await app.query(`SELECT money, health, maxHealth, badge FROM scores WHERE userId = '${selection.users[0]}'`))[0],
                user2: (await app.query(`SELECT money, health, maxHealth, badge FROM scores WHERE userId = '${selection.users[1]}'`))[0],
                user3: (await app.query(`SELECT money, health, maxHealth, badge FROM scores WHERE userId = '${selection.users[2]}'`))[0]
            };
            const atkEmbed = new app.Embed()
            .setAuthor(message.author.tag, message.author.avatarURL)
            .setTitle('Pick someone to attack!')
            .setDescription(`Type 1, 2, or 3 to select.\n
            1. ${app.player.getBadge(userdata.user1.badge)} **${(selection.members[0]).tag}** ${app.player.getHealthIcon(userdata.user1.health, userdata.user1.maxHealth)} ${userdata.user1.health} - ${app.common.formatNumber(userdata.user1.money)} - ${(await app.itm.getItemCount(selection.users[0])).itemCt} items\n
            2. ${app.player.getBadge(userdata.user2.badge)} **${(selection.members[1]).tag}** ${app.player.getHealthIcon(userdata.user2.health, userdata.user2.maxHealth)} ${userdata.user2.health} - ${app.common.formatNumber(userdata.user2.money)} - ${(await app.itm.getItemCount(selection.users[1])).itemCt} items\n
            3. ${app.player.getBadge(userdata.user3.badge)} **${(selection.members[2]).tag}** ${app.player.getHealthIcon(userdata.user3.health, userdata.user3.maxHealth)} ${userdata.user3.health} - ${app.common.formatNumber(userdata.user3.money)} - ${(await app.itm.getItemCount(selection.users[2])).itemCt} items`)
            .setColor(13215302)
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
    .setDescription(`${message.author.tag} hit you for **${damage}** damage using a: ${app.itemdata[itemUsed].icon}\`${itemUsed}\`.
    
    Health: ${app.player.getHealthIcon(victimRow.health - damage, victimRow.maxHealth)}\`${victimRow.health - damage}/${victimRow.maxHealth}\``)
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
    .setDescription(`${message.author.tag} hit you for **${damage}** damage using a: ${app.itemdata[itemUsed].icon}\`${itemUsed}\`.`)
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

async function sendToKillFeed(app, message, channelID, victim, itemName, itemDmg){
    const killEmbed = new app.Embed()
    .setTitle(message.author.tag + " 🗡 " + victim.user.tag + " 💀")
    .setDescription(`**Weapon**: ${app.itemdata[itemName].icon}\`${itemName}\` - **${itemDmg} damage**`)
    .setColor(16721703)
    .setTimestamp()

    try{
        await app.bot.createMessage(channelID, killEmbed);
    }
    catch(err){
        // no killfeed channel found
    }
}