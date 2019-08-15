const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const boxes = require('../methods/open_box.js');
const open = require('../methods/open_care_package.js');
const config = require('../json/_config.json');
const itemdata = require('../json/completeItemList.json');
const airdrop = require('../utils/airdrop.js');
const general = require('../methods/general');

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
        var itemUsed = methods.getCorrectedItemInfo(args[0]);
        var userOldID = args[1];

        const serverInf = await query(`SELECT * FROM guildInfo WHERE guildId = ${message.guild.id}`);

        try{
            const userRow = (await query(`SELECT * FROM scores WHERE userId = "${message.author.id}"`))[0];
            const itemRow = await general.getItemObject(message.author.id);

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
                else if(itemUsed == "care_package" && itemRow.care_package >= 1){
                    open.open_package(message, lang);
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
                    let usedStatPts = userRow.used_stats;
                    methods.removeitem(message.author.id, 'reroll_scroll', 1);
                    query(`UPDATE scores SET stats = stats + ${usedStatPts} WHERE userId = ${message.author.id}`);
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
                    .setDescription("Restored **"+usedStatPts+"** skill points.")
                    .setFooter("Attributes reset.")
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
                    else if(message.client.sets.activeShield.has(userNameID) && !(itemUsed == "awp" && itemRow.awp >= 1 && itemRow['50_cal'] >= 1)){
                        return message.reply(lang.use.errors[3].replace('{0}', (await methods.getShieldTime(userNameID)) ));
                    }
                    else if(message.client.sets.weapCooldown.has(message.author.id)){
                        message.delete();
                        return message.reply(lang.use.errors[9].replace('{0}', (await methods.getAttackCooldown(message.author.id)) ));
                    }
                    else{ // All conditions met, start applying damage
                        let ammoToUse = "";
                        let bonusDamage = 0;
                        let damageMin = itemdata[itemUsed].minDmg;
                        let damageMax = itemdata[itemUsed].maxDmg;

                        if(itemRow[itemUsed] >= 1){
                            if(itemdata[itemUsed].ammo.length >= 1){ //remove ammo

                                for(var i = 0; i < itemdata[itemUsed].ammo.length; i++){
                                    if(itemRow[itemdata[itemUsed].ammo[i]] >= 1){
                                        ammoToUse = itemdata[itemUsed].ammo[i];
                                        if(ammoToUse == "50_cal"){
                                            bonusDamage = 20;
                                        }
                                        else if(ammoToUse == "baseball"){
                                            bonusDamage = 12;
                                        }
                                        methods.removeitem(message.author.id, ammoToUse, 1);
                                        break;
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
                                methods.removeitem(message.author.id, itemUsed, 1);
                                methods.additem(message.author.id, itemdata[itemUsed].recyclesTo.materials);
                                weaponBreakAlert(message, itemUsed);
                            }

                            let randDmg = Math.floor(((Math.floor(Math.random() * (damageMax - damageMin + 1)) + damageMin) + bonusDamage) * userRow.scaledDamage);
                            
                            hitOrMiss(message, userNameID, itemUsed, victimRow, userRow, randDmg, itemdata[itemUsed].breaksOnUse, lang);
                            
                            methods.addToWeapCooldown(message, message.author.id, itemUsed);
                        }
                        else{
                            return message.reply(lang.use.errors[2]);
                        }
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

async function hitOrMiss(message, userNameID, itemUsed, victimRow, userRow, damage, isBroken, lang){//FUNCTION THAT ACTUALLY HANDLES DAMAGE DEALT
    let chance = Math.floor(Math.random() * 100) + 1; //return 1-100
    let luck = victimRow.luck >= 10 ? 10 : victimRow.luck;

    var finalString = '';

    if(chance <= luck){
        if(isBroken){
            //finalString += `🍀<@${userNameID}> EVADED <@`+ message.author.id + `>'s attack! How lucky!\nThe ${itemUsed} slipped from your hands!`;
            return message.channel.send(`🍀<@${userNameID}> EVADED <@`+ message.author.id + `>'s attack! How lucky!\nThe ${itemUsed} slipped from your hands!`);
        }
        else{
            //finalString += `🍀<@${userNameID}> EVADED <@`+ message.author.id + `>'s attack! How lucky!`;
            return message.channel.send(`🍀<@${userNameID}> EVADED <@`+ message.author.id + `>'s attack! How lucky!`);
        }
    }
    else if(victimRow.health - damage <= 0){
        if(isBroken){
            finalString += `<@${message.author.id}>` + ` hit <@${userNameID}> with a ` + itemUsed + ` for **${damage}** DAMAGE AND KILLED THEM! <:POGGERS:461045666987114498>\nThe ${itemUsed} broke!`;
            //message.channel.send(`<@${message.author.id}>` + ` hit <@${userNameID}> with a ` + itemUsed + ` for **${damage}** DAMAGE AND KILLED THEM! <:POGGERS:461045666987114498>\nThe ${itemUsed} broke!`);
        }
        else{
            finalString += `<@${message.author.id}>` + ` hit <@${userNameID}> with a ` + itemUsed + ` for **${damage}** DAMAGE AND KILLED THEM! <:POGGERS:461045666987114498>`;
            //message.channel.send(`<@${message.author.id}>` + ` hit <@${userNameID}> with a ` + itemUsed + ` for **${damage}** DAMAGE AND KILLED THEM! <:POGGERS:461045666987114498>`);
        }

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
        message.channel.send(finalString, {embed: killedReward});

        methods.sendtokillfeed(message, message.author.id, userNameID, itemUsed, damage, randomItems[0], methods.formatMoney(victimRow.money));

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
    }
    else{
        query(`UPDATE scores SET health = ${parseInt(victimRow.health) - damage} WHERE userId = ${userNameID}`);
        if(isBroken){
            message.channel.send(`<@${message.author.id}>` + ` hit <@${userNameID}> with a ` + itemUsed + ` for **${damage}** DAMAGE!\nThey now have **${victimRow.health - damage}** health!\nThe ${itemUsed} broke.`);
        }
        else{
            message.channel.send(`<@${message.author.id}>` + ` hit <@${userNameID}> with a ` + itemUsed + ` for **${damage}** DAMAGE!\nThey now have **${victimRow.health - damage}** health!`);
        }
    }
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
        const atkEmbed = new Discord.RichEmbed()
        .setTitle('Pick someone to attack!')
        .setDescription(`1. **${(await general.getUserInfo(message, selection.users[0])).tag}**\n
        2. **${(await general.getUserInfo(message, selection.users[1])).tag}**\n
        3. **${(await general.getUserInfo(message, selection.users[2])).tag}**`)
        .setColor(13215302)
        .setFooter('You have 15 seconds to choose. Otherwise one will be chosen for you.')

        const botMessage = await message.reply({embed: atkEmbed});
        await botMessage.react('\u0031\u20E3');
        await botMessage.react('\u0032\u20E3');
        await botMessage.react('\u0033\u20E3');
        const filter = (reaction, user) => {
            return ['\u0031\u20E3', '\u0032\u20E3', '\u0033\u20E3'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        try{
            const collected = await botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] });
            const reaction = collected.first();

            botMessage.delete();
            if(reaction.emoji.name == '\u0031\u20E3'){
                return selection.users[0];
            }
            else if(reaction.emoji.name == '\u0032\u20E3'){
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
    }
    
}