const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const boxes = require('../methods/open_box.js');
const config = require('../json/_config.json');
const itemdata = require('../json/completeItemList.json');
const airdrop = require('../utils/airdrop.js');
const general = require('../methods/general');
const icons = require('../json/icons');

module.exports = {
    name: 'use',
    aliases: ['attack', 'heal'],
    description: 'Use items on yourself or use weapons to attack others!',
    hasArgs: true,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        var itemUsed = general.parseArgsWithSpaces(args[0], args[1], args[2], false, false, false);
        var userOldID = general.parseArgsWithSpaces(args[0], args[1], args[2], false, false, true);
        console.log(itemUsed);
        console.log(userOldID);

        const serverInf = await query(`SELECT * FROM guildInfo WHERE guildId = ${message.guild.id}`);

        try{
            var userRow = (await query(`SELECT * FROM scores WHERE userId = "${message.author.id}"`))[0];
            var itemRow = await general.getItemObject(message.author.id);

            if(itemdata[itemUsed] == undefined){
                return message.reply(lang.use.errors[0].replace('{0}', prefix));
            }
            else if(itemdata[itemUsed].isItem){ // ITEMS TIME!!!!!!!!!!!!!!!!!!!
                let useAmount = general.getNum(userOldID) > 10 ? 10 : general.getNum(userOldID); // Allows max 10 items used, otherwise set to 1-10

                if(itemUsed == "item_box" && itemRow.item_box >= useAmount){
                    boxes.open_box(message, lang, 'item_box', useAmount);
                }
                else if(itemUsed == "ultra_box" && itemRow.ultra_box >= useAmount){
                    boxes.open_box(message, lang, 'ultra_box', useAmount);
                }
                else if(itemUsed == "candy_pail" && itemRow.candy_pail >= useAmount){
                    boxes.open_box(message, lang, 'candy_pail', useAmount);
                }
                else if(itemUsed == "present" && itemRow.present >= useAmount){
                    boxes.open_box(message, lang, 'present', useAmount);
                }
                else if(itemUsed == "care_package" && itemRow.care_package >= useAmount){
                    boxes.open_box(message, lang, 'care_package', useAmount);
                }
                else if(itemUsed == "supply_signal" && itemRow.supply_signal >= 1){
                    // Add a 30 second timeout before sending airdrop
                    message.reply('📻 Requesting immediate airdrop...').then(msg => {
                        setTimeout(() => {
                            message.channel.send('**📻 Airdrop arriving in `30 seconds`!**');
                        }, 3000);
                        setTimeout(() => {
                            message.channel.send('**📻 `10 seconds`!**');
                        }, 20000);
                        setTimeout(() => {
                            message.channel.send('**📻 `5`...**');
                        }, 25000);
                        setTimeout(() => {
                            message.channel.send('**📻 `4`...**');
                        }, 26000);
                        setTimeout(() => {
                            message.channel.send('**📻 `3`...**');
                        }, 27000);
                        setTimeout(() => {
                            airdrop.callAirdrop(message.client, message.guild.id, 'care_package', false, message.channel.id);
                        }, 30000);
                    });
                    methods.removeitem(message.author.id, itemUsed, 1);
                }
                else if(itemdata[itemUsed].isShield && itemRow[itemUsed] >= 1){
                    if(message.client.sets.activeShield.has(message.author.id)){
                        return message.reply(lang.use.items[3].replace('{0}', (await methods.getShieldTime(message.author.id)) ));
                    }
                    query(`UPDATE cooldowns SET ${itemdata[itemUsed].shieldInfo.shieldRow} = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                    methods.removeitem(message.author.id, itemUsed, 1);

                    message.client.shard.broadcastEval(`this.sets.activeShield.add('${message.author.id}')`);

                    let timeObj = {userId: message.author.id, timer: setTimeout(() => {
                        message.client.shard.broadcastEval(`this.sets.activeShield.delete('${message.author.id}')`);
                        message.client.shard.broadcastEval(`
                            this.shieldTimes.forEach(arrObj => {
                
                                if(arrObj.userId == ${message.author.id}){
                                    //stop the timer
                                    clearTimeout(arrObj.timer);
                        
                                    //remove from airdropTimes array
                                    this.shieldTimes.splice(this.shieldTimes.indexOf(arrObj), 1);
                        
                                    console.log('canceled a timeout');
                                }
                        
                            });
                        `);
                        query(`UPDATE cooldowns SET ${itemdata[itemUsed].shieldInfo.shieldRow} = ${0} WHERE userId = ${message.author.id}`);
                    }, itemdata[itemUsed].shieldInfo.seconds * 1000)};

                    message.client.shieldTimes.push(timeObj);

                    message.reply(lang.use.items[4].replace('{0}', itemUsed));
                }
                else if(itemdata[itemUsed].isHeal && itemRow[itemUsed] >= 1){
                    if(message.client.sets.healCooldown.has(message.author.id)){
                        return message.reply(lang.use.items[6].replace('{0}', (await methods.getHealCooldown(message.author.id))));
                    }
                    let minHeal = itemdata[itemUsed].healMin;
                    let maxHeal = itemdata[itemUsed].healMax;
                    
                    let randHeal = (Math.floor(Math.random() * (maxHeal - minHeal + 1)) + minHeal);
                    let userMaxHeal = userRow.maxHealth - userRow.health;

                    if(userMaxHeal == 0){
                        return message.reply(lang.use.items[5]);
                    }
                    else if(userMaxHeal > randHeal){
                        query(`UPDATE scores SET health = ${userRow.health + randHeal} WHERE userId = ${message.author.id}`);
                        methods.removeitem(message.author.id, itemUsed, 1);
                        message.reply(lang.use.items[0].replace('{0}', randHeal));
                    }
                    else if(userMaxHeal <= randHeal){
                        query(`UPDATE scores SET health = ${userRow.health + userMaxHeal} WHERE userId = ${message.author.id}`);
                        methods.removeitem(message.author.id, itemUsed, 1);
                        message.reply(lang.use.items[1].replace('{0}', userMaxHeal));
                    }
                    methods.addToHealCooldown(message, message.author.id, itemUsed);
                }
                else if(itemdata[itemUsed].givesMoneyOnUse && itemRow[itemUsed] >= 1){
                    let minAmt = itemdata[itemUsed].itemMin;
                    let maxAmt = itemdata[itemUsed].itemMax;
                    
                    let randAmt = Math.floor((Math.random() * (maxAmt - minAmt + 1)) + minAmt);
                    methods.addmoney(message.author.id, randAmt);
                    methods.removeitem(message.author.id, itemUsed, 1);
                    message.reply(lang.use.items[2].replace('{0}', itemUsed).replace('{1}', methods.formatMoney(randAmt)));
                }
                else if(itemUsed == "reroll_scroll" && itemRow.reroll_scroll >= 1){
                    methods.removeitem(message.author.id, 'reroll_scroll', 1);
                    query(`UPDATE scores SET maxHealth = ${100} WHERE userId = ${message.author.id}`);
                    query(`UPDATE scores SET luck = ${0} WHERE userId = ${message.author.id}`);
                    query(`UPDATE scores SET scaledDamage = ${1.00} WHERE userId = ${message.author.id}`);
                    query(`UPDATE scores SET used_stats = ${0} WHERE userId = ${message.author.id}`);
                    if(userRow.health > 100){
                        query(`UPDATE scores SET health = ${100} WHERE userId = ${message.author.id}`);
                    }
                    let msgEmbed = new Discord.RichEmbed()
                    .setAuthor(message.member.displayName, message.author.avatarURL)
                    .setTitle("Successfully used 📜`reroll_scroll`")
                    .setDescription("Your skills have been reset.")
                    .setColor(14202368)
                    message.channel.send(msgEmbed);
                }
                else if(itemUsed == "xp_potion" && itemRow.xp_potion >= 1){
                    const cdRow = (await query(`SELECT * FROM cooldowns WHERE userId="${message.author.id}"`))[0];
            
                    if(message.client.sets.xpPotCooldown.has(message.author.id)){
                        message.reply(lang.use.items[7].replace('{0}', ((180 * 1000 - ((new Date()).getTime() - cdRow.xpTime)) / 1000).toFixed(0)));
                        return;
                    }
            
                    query(`UPDATE cooldowns SET xpTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
            
                    message.client.shard.broadcastEval(`this.sets.xpPotCooldown.add('${message.author.id}')`);
                    setTimeout(() => {
                        message.client.shard.broadcastEval(`this.sets.xpPotCooldown.delete('${message.author.id}')`);
                        query(`UPDATE cooldowns SET xpTime = ${0} WHERE userId = ${message.author.id}`);
                    }, 180 * 1000);
            
                    methods.removeitem(message.author.id, 'xp_potion', 1);
                    query(`UPDATE scores SET points = points + ${75} WHERE userId = ${message.author.id}`);
                    let msgEmbed = new Discord.RichEmbed()
                    .setAuthor(message.member.displayName, message.author.avatarURL)
                    .setTitle("Successfully used `xp_potion`")
                    .setDescription("Gained **75 XP**!")
                    .setColor(14202368)
                    message.channel.send(msgEmbed);
                }
                else{
                    return message.reply(lang.use.errors[2]);
                }
            }
            else if(itemdata[itemUsed].isWeap){ // Weapon usage
                try{
                    if(userOldID == "random" || userOldID == "rand" || serverInf[0].randomOnly == 1){
                        const randUsers = await randomUser(message);

                        if(randUsers.users[0] == undefined){
                            return message.reply(lang.use.errors[10]);
                        }
                        if(!itemRow[itemUsed]){
                            return message.reply(lang.use.errors[2]);
                        }
                        else if(message.client.sets.weapCooldown.has(message.author.id)){
                            return message.reply(lang.use.errors[9].replace('{0}', (await methods.getAttackCooldown(message.author.id)) ));
                        }
                        
                        userOldID = 'random';
                        var userNameID = await pickTarget(message, randUsers);
                    }
                    else if(!general.isUser([userOldID])){
                        return message.reply(lang.errors[1]);
                    }
                    else{
                        var userNameID = general.getUserId([userOldID]); //RETURNS BASE ID WITHOUT <@ OR <@! BUT ONLY IF PLAYER MENTIONED SOMEONE
                    }

                    await message.client.fetchUser(userNameID, false); // Makes sure mention is a valid user.
                    const victimRow = (await query(`SELECT * FROM scores WHERE userId = '${userNameID}'`))[0];
                    const playRow = await query(`SELECT * FROM userGuilds WHERE userId ="${userNameID}" AND guildId = "${message.guild.id}"`);
                    userRow = (await query(`SELECT * FROM scores WHERE userId = "${message.author.id}"`))[0];
                    itemRow = await general.getItemObject(message.author.id);

                    if(userNameID === message.client.user.id){
                        return message.channel.send(lang.use.weapons[3]);
                    }
                    else if(userNameID === message.author.id){
                        return message.reply(lang.use.errors[4]);
                    }
                    else if(!victimRow){
                        return message.reply(lang.use.errors[5]);
                    }
                    else if(userRow.clanId !== 0 && victimRow.clanId == userRow.clanId){
                        return message.reply(lang.use.errors[11]);
                    }
                    else if(message.client.sets.activeShield.has(message.author.id)){ // CHECK IF PLAYER HAS SHIELD ACTIVE
                        return message.reply(lang.use.errors[6]);
                    }
                    else if(!playRow.length){
                        return message.reply(lang.use.errors[7]);
                    }
                    else if(message.client.sets.activeShield.has(userNameID)){
                        return message.reply(lang.use.errors[3].replace('{0}', (await methods.getShieldTime(userNameID)) ));
                    }
                    else if(message.client.sets.weapCooldown.has(message.author.id)){
                        message.delete();
                        return message.reply(lang.use.errors[9].replace('{0}', (await methods.getAttackCooldown(message.author.id)) ));
                    }
                    else if(!itemRow[itemUsed] >= 1){
                        return message.reply(lang.use.errors[2]);
                    }
                    else if(itemUsed == 'peck_seed' && message.client.sets.peckCooldown.has(userNameID)){
                        return message.reply('That player is already under the effects of a `peck_seed`!');
                    }
                    else{ // All conditions met, start applying damage
                        let ammoToUse = "";
                        let bonusDamage = 0;
                        let damageMin = itemdata[itemUsed].minDmg;
                        let damageMax = itemdata[itemUsed].maxDmg;
                        let weaponBroke = itemdata[itemUsed].breaksOnUse;

                        if(itemdata[itemUsed].ammo.length >= 1){ //remove ammo
                            if(itemdata[itemUsed].ammo.includes(userRow.ammo) && itemRow[userRow.ammo] >= 1){
                                // use players preferred ammo
                                ammoToUse = userRow.ammo;
                                    
                                bonusDamage = itemdata[ammoToUse].damage;

                                methods.removeitem(message.author.id, ammoToUse, 1);
                            }
                            else{
                                for(var i = 0; i < itemdata[itemUsed].ammo.length; i++){
                                    if(itemRow[itemdata[itemUsed].ammo[i]] >= 1){
                                        ammoToUse = itemdata[itemUsed].ammo[i];
                                        
                                        bonusDamage = itemdata[ammoToUse].damage;

                                        methods.removeitem(message.author.id, ammoToUse, 1);
                                        break;
                                    }
                                }
                            }
                            

                            if(ammoToUse == "" && itemdata[itemUsed].ammoOptional !== true){
                                return message.reply(lang.use.errors[8]);
                            }
                        }

                        if(itemdata[itemUsed].breaksOnUse == true){
                            methods.removeitem(message.author.id, itemUsed, 1);
                        }
                        else if(Math.random() <= parseFloat(itemdata[itemUsed].chanceToBreak)){
                            weaponBroke = true;
                            methods.removeitem(message.author.id, itemUsed, 1);
                            methods.additem(message.author.id, itemdata[itemUsed].recyclesTo.materials);
                            weaponBreakAlert(message, itemUsed);
                        }

                        let randDmg = Math.floor(((Math.floor(Math.random() * (damageMax - damageMin + 1)) + damageMin) + bonusDamage) * userRow.scaledDamage);
                        
                        hitOrMiss(message, userNameID, itemUsed, ammoToUse, victimRow, userRow, randDmg, weaponBroke, lang);
                        
                        methods.addToWeapCooldown(message, message.author.id, itemUsed);
                    }
                }
                catch(err){
                    return message.reply(lang.errors[1]);
                }
            }
            else{
                return message.reply(lang.use.errors[1].replace('{0}', prefix));
            }
        }
        catch(err){
            console.log(err);
            return message.reply(lang.use.errors[0].replace('{0}', prefix));
        }
    },
}

async function weaponBreakAlert(message, itemUsed){
    const brokeEmbed = new Discord.RichEmbed()
    .setTitle('💥 Unfortunately, your `' + itemUsed + '` broke from your last attack!')
    .setDescription('After rummaging through the pieces you were able to find: ```fix\n' + itemdata[itemUsed].recyclesTo.display + '```')
    .setColor(14831897)

    try{
        await message.author.send(brokeEmbed);
    }
    catch(err){
        message.reply({embed: brokeEmbed});
    }
}

async function hitOrMiss(message, userNameID, itemUsed, ammoUsed, victimRow, userRow, damage, isBroken, lang){//FUNCTION THAT ACTUALLY HANDLES DAMAGE DEALT
    let chance = Math.floor(Math.random() * 100) + 1; //return 1-100
    let luck = victimRow.luck >= 10 ? 10 : victimRow.luck;

    if(chance <= luck){
        if(isBroken){
            return message.channel.send(`🍀<@${userNameID}> EVADED <@`+ message.author.id + `>'s attack! How lucky!\n**${message.author.username}**'s ${itemUsed} broke.`);
        }
        else{
            return message.channel.send(`🍀<@${userNameID}> EVADED <@`+ message.author.id + `>'s attack! How lucky!`);
        }
    }
    else if(victimRow.health - damage <= 0){
        const victimItems = await general.getItemObject(userNameID);
        let victimItemCount = [];
        let amountToGive = 1;

        Object.keys(itemdata).forEach(key => {
            if(victimItems[key]){
                if(itemdata[key].canBeStolen){
                    victimItemCount.push(itemdata[key]);
                }
            }
        });
        
        if(victimItemCount.length == 0){
            amountToGive = 0;
        }
        else if(victimItemCount.length <= 9){
            amountToGive = 2;
        }
        else{
            amountToGive = Math.floor(victimItemCount.length/5);
        }

        const randomItems = await methods.randomItems(message.author.id, userNameID, amountToGive);
        var xpToGive = amountToGive * 50;
        
        query(`UPDATE scores SET money = ${parseInt(userRow.money) + victimRow.money} WHERE userId = ${message.author.id}`);
        query(`UPDATE scores SET points = ${userRow.points + xpToGive} WHERE userId = ${message.author.id}`);
        query(`UPDATE scores SET kills = ${userRow.kills + 1} WHERE userId = ${message.author.id}`); // add 1 to kills

        if(victimRow.power >= -3){
            query(`UPDATE scores SET power = power - 2 WHERE userId = ${userNameID}`);
        }
        else{
            query(`UPDATE scores SET power = -5 WHERE userId = ${userNameID}`);
        }
        query(`UPDATE scores SET health = ${100} WHERE userId = ${userNameID}`);
        query(`UPDATE scores SET money = ${0} WHERE userId = ${userNameID}`);
        query(`UPDATE scores SET deaths = ${victimRow.deaths + 1} WHERE userId = ${userNameID}`); // add 1 to deaths for killed user

        const killedReward = new Discord.RichEmbed()
        .setTitle(`LOOT RECEIVED`)
        .setDescription("Money: " + methods.formatMoney(victimRow.money) + "\nExperience: `" + xpToGive + "xp`")
        .setColor(7274496)
        .addField("**ITEMS**", amountToGive !== 0 ? randomItems[0] : randomItems)
        message.channel.send(await generateAttackString(message, userNameID, victimRow, damage, itemUsed, ammoUsed, isBroken, true), {embed: killedReward});

        methods.sendtokillfeed(message, message.author.id, userNameID, itemUsed, damage, randomItems[0], methods.formatMoney(victimRow.money));
        if(victimRow.notify2) notifyDeathVictim(message, userNameID, itemUsed, damage, amountToGive !== 0 ? randomItems[0] : 'You had nothing!')

        return message.client.shard.broadcastEval(`
            const channel = this.channels.get('${config.logChannel}');
    
            if(channel){
                channel.send({embed: {
                        color: 16721703,
                        title: "💀**Kill Log**",
                        description: "Weapon used: \`${itemUsed} : ${damage} damage\`",
                        fields: [
                            {
                                name: "KILLER",
                                value: "\`${message.author.tag} : ${message.author.id}\`"
                            },
                            {
                                name: "VICTIM",
                                value: "\`${(await general.getUserInfo(message, userNameID)).tag} : ${userNameID}\`"
                            },
                            {
                                name: "Items stolen",
                                value: "${amountToGive !== 0 ? randomItems[1] : 'No items stolen'}",
                                inline: true
                            },
                            {
                                name: "Money stolen",
                                value: "$${victimRow.money}",
                                inline: true
                            }
                        ],
                    }
                });
                true;
            }
            else{
                false;
            }
        `).then(console.log);
    }
    else if(itemUsed.toLowerCase() == "peck_seed"){
        query(`UPDATE cooldowns SET peckTime = ${(new Date()).getTime()} WHERE userId = ${userNameID}`);

        message.client.shard.broadcastEval(`this.sets.peckCooldown.add('${userNameID}')`);
        setTimeout(() => {
            message.client.shard.broadcastEval(`this.sets.peckCooldown.delete('${userNameID}')`);
            query(`UPDATE cooldowns SET peckTime = ${0} WHERE userId = ${userNameID}`);
        }, 7200 * 1000);
        query(`UPDATE scores SET health = ${parseInt(victimRow.health) - damage} WHERE userId = ${userNameID}`);
        message.channel.send(lang.use.weapons[2].replace('{0}', '<@' + message.author.id + '>').replace('{1}', '<@' + userNameID + '>').replace('{2}', damage).replace('{3}', itemUsed).replace('{4}', victimRow.health - damage));
        
        if(victimRow.notify2) notifyAttackVictim(message, userNameID, itemUsed, damage, victimRow);
    }
    else{
        query(`UPDATE scores SET health = ${parseInt(victimRow.health) - damage} WHERE userId = ${userNameID}`);

        message.channel.send(await generateAttackString(message, userNameID, victimRow, damage, itemUsed, ammoUsed, isBroken, false));

        if(victimRow.notify2) notifyAttackVictim(message, userNameID, itemUsed, damage, victimRow);
    }
}

async function generateAttackString(message, victimId, victimRow, damage, itemUsed, ammoUsed, itemBroke, killed){
    let weaponRarity = itemdata[itemUsed].rarity;
    let finalStr = "";
    let victim = await general.getUserInfo(message, victimId);

    if(ammoUsed !== ""){
        // weapon uses ammo
        finalStr = `<@${message.author.id}> fires a ${itemdata[ammoUsed].icon}\`${ammoUsed}\` straight through <@${victimId}>'s chest using a ${itemdata[itemUsed].icon}\`${itemUsed}\`! **${damage}** damage dealt!`;
    }
    else{
        // melee weapon
        switch(weaponRarity){
            case "Common": finalStr = `<@${message.author.id}> slapped <@${victimId}> with a ${itemdata[itemUsed].icon}\`${itemUsed}\` dealing **${damage}** damage!`; break;
            case "Uncommon": finalStr = `<@${message.author.id}> smacks <@${victimId}> with a ${itemdata[itemUsed].icon}\`${itemUsed}\` dealing **${damage}** damage!`; break;
            case "Rare": finalStr = `<@${message.author.id}> uses a ${itemdata[itemUsed].icon}\`${itemUsed}\` on <@${victimId}> dealing **${damage}** damage!`; break;
            default: finalStr = `<@${message.author.id}> attacks <@${victimId}> with a ${itemdata[itemUsed].icon}\`${itemUsed}\` dealing **${damage}** damage!`; break;
        }
    }

    if(killed){
        finalStr += ` ${icons.death_skull} **${victim.username} DIED!**`
    }
    else{
        if(Math.random() <= .5) finalStr += ` **${victim.username}** is spared with ${methods.getHealthIcon(victimRow.health - damage, victimRow.maxHealth)} **${victimRow.health - damage}** health.`;
        else finalStr += ` **${victim.username}** is left with ${methods.getHealthIcon(victimRow.health - damage, victimRow.maxHealth)} **${victimRow.health - damage}** health.`;
    }

    if(itemBroke){
        finalStr += `\n${icons.minus}**${message.author.username}**'s \`${itemUsed}\` broke.`;
    }

    return finalStr;
}

async function randomUser(message, weapon = ''){ // returns a random userId from the attackers guild
    const userRows = await query(`SELECT * FROM userGuilds WHERE guildId ="${message.guild.id}" ORDER BY LOWER(userId)`);
    const userClan = (await query(`SELECT clanId FROM scores WHERE userId ="${message.author.id}"`))[0];
    var guildUsers = [];
    
    for(var i = 0; i < userRows.length; i++){
        try{
            const userClanId = (await query(`SELECT clanId FROM scores WHERE userId ="${userRows[i].userId}"`))[0];
            if((await general.getUserInfo(message, userRows[i].userId, true)).displayName){
                if(userRows[i].userId !== message.author.id){ // make sure message author isn't attacked by self
                    if(!message.client.sets.activeShield.has(userRows[i].userId)){
                        if(userClan.clanId == 0 || userClan.clanId !== userClanId.clanId){
                            guildUsers.push(userRows[i].userId);
                        }
                    }
                }
            }
        }
        catch(err){
            console.log(err);
        }
    }

    const shuffled = guildUsers.sort(() => 0.5 - Math.random()); // Shuffle
    var rand = shuffled.slice(0, 3); // Pick 3 random id's
    //var rand = guildUsers[Math.floor(Math.random() * guildUsers.length)];
    return {
        users: rand,
        serverCount: userRows.length
    }
}

async function pickTarget(message, selection){
    if(selection.serverCount < 10 || selection.users.length < 3){
        return selection.users[0];
    }
    else{
        message.client.shard.broadcastEval(`this.sets.activeCmdCooldown.add('${message.author.id}')`);

        try{
            const userdata = {
                user1: (await query(`SELECT money, health, maxHealth FROM scores WHERE userId = '${selection.users[0]}'`))[0],
                user2: (await query(`SELECT money, health, maxHealth FROM scores WHERE userId = '${selection.users[1]}'`))[0],
                user3: (await query(`SELECT money, health, maxHealth FROM scores WHERE userId = '${selection.users[2]}'`))[0]
            };
            const atkEmbed = new Discord.RichEmbed()
            .setTitle('Pick someone to attack!')
            .setDescription(`Type 1, 2, or 3 to select.\n
            1. **${(await general.getUserInfo(message, selection.users[0])).tag}** ${methods.getHealthIcon(userdata.user1.health, userdata.user1.maxHealth)}${userdata.user1.health} - ${methods.formatMoney(userdata.user1.money)} - ${(await methods.getitemcount(selection.users[0])).itemCt} items\n
            2. **${(await general.getUserInfo(message, selection.users[1])).tag}** ${methods.getHealthIcon(userdata.user2.health, userdata.user2.maxHealth)}${userdata.user2.health} - ${methods.formatMoney(userdata.user2.money)} - ${(await methods.getitemcount(selection.users[1])).itemCt} items\n
            3. **${(await general.getUserInfo(message, selection.users[2])).tag}** ${methods.getHealthIcon(userdata.user3.health, userdata.user3.maxHealth)}${userdata.user3.health} - ${methods.formatMoney(userdata.user3.money)} - ${(await methods.getitemcount(selection.users[2])).itemCt} items`)
            .setColor(13215302)
            .setFooter('You have 15 seconds to choose. Otherwise one will be chosen for you.')

            const botMessage = await message.reply({embed: atkEmbed});
            const filter = (m) => {
                return ['1', '2', '3'].includes(m.content) && m.author.id === message.author.id;
            };

            try{
                const collected = await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] });
                const userChoice = collected.first();
                
                botMessage.delete();
                if(userChoice.content == '1'){
                    return selection.users[0];
                }
                else if(userChoice.content == '2'){
                    return selection.users[1];
                }
                else{
                    return selection.users[2];
                }
            }
            catch(err){
                botMessage.delete();
                return selection.users[Math.floor(Math.random() * selection.users.length)];
            }
            finally{
                message.client.shard.broadcastEval(`this.sets.activeCmdCooldown.delete('${message.author.id}')`);
            }
        }
        catch(err){
            //if bot is lagging and attack message does not send...
            message.client.shard.broadcastEval(`this.sets.activeCmdCooldown.delete('${message.author.id}')`);
        }
    }
    
}

async function notifyAttackVictim(message, victimId, itemUsed, damage, victimRow){
    const notifyEmbed = new Discord.RichEmbed()
    .setTitle('You were attacked!')
    .setDescription(`${message.author.tag} hit you for **${damage}** damage using a: \`${itemUsed}\`.
    
    Health: ${methods.getHealthIcon(victimRow.health - damage, victimRow.maxHealth)}\`${victimRow.health - damage}/${victimRow.maxHealth}\``)
    .setColor(16610383)

    try{
        const victim = await general.getUserInfo(message, victimId);
        await victim.send(notifyEmbed);
    }
    catch(err){
        // user disabled DMs
    }
}
async function notifyDeathVictim(message, victimId, itemUsed, damage, itemsLost){
    const notifyEmbed = new Discord.RichEmbed()
    .setTitle('You were killed!')
    .setDescription(`${message.author.tag} hit you for **${damage}** damage using a: \`${itemUsed}\`.`)
    .addField('Items Lost:', itemsLost)
    .setColor(16600911)

    try{
        const victim = await general.getUserInfo(message, victimId);
        await victim.send(notifyEmbed);
    }
    catch(err){
        // user disabled DMs
    }
}