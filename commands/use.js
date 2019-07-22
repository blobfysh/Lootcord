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
    aliases: [''],
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
        const randUser  = await methods.randomUser(message);

        if(userOldID !== undefined || serverInf[0].randomOnly == 1){
            if(userOldID == "random" || userOldID == "rand" || serverInf[0].randomOnly == 1){
                if(randUser == undefined && (itemdata[itemUsed] !== undefined && itemdata[itemUsed].isWeap)){
                    return message.reply(lang.use.errors[10]);
                }
                else if(itemdata[itemUsed] !== undefined && itemdata[itemUsed].isWeap){
                    userOldID = 'random';
                }
                
                var userNameID = randUser;
            }
            else var userNameID = general.getUserId(userOldID); //RETURNS BASE ID WITHOUT <@ OR <@! BUT ONLY IF PLAYER MENTIONED SOMEONE
        }

        try{
            const row = (await query(`SELECT * FROM items i
            INNER JOIN scores s
            ON i.userId = s.userId
            WHERE s.userId="${message.author.id}"`))[0];

            if(itemdata[itemUsed] == undefined){
                return message.reply(lang.use.errors[0].replace('{0}', prefix));
            }
            else if(itemdata[itemUsed].isItem){ // ITEMS TIME!!!!!!!!!!!!!!!!!!!
                let useAmount = general.getNum(userOldID) > 10 ? 10 : general.getNum(userOldID); // Allows max 10 items used, otherwise set to 1-10

                if(itemUsed == "item_box" && row.item_box >= useAmount){
                    boxes.open_box(message, lang, 'item_box', useAmount);
                }
                else if(itemUsed == "ultra_box" && row.ultra_box >= useAmount){
                    boxes.open_box(message, lang, 'ultra_box', useAmount);
                }
                else if(itemUsed == "care_package" && row.care_package >= 1){
                    open.open_package(message, lang);
                }
                else if(itemUsed == "supply_signal" && row.supply_signal >= 1){
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
                    query(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);
                }
                else if(itemdata[itemUsed].isShield && row[itemUsed] >= 1){
                    if(message.client.sets.activeShield.has(message.author.id)){
                        return message.reply(lang.use.items[3].replace('{0}', (await methods.getShieldTime(message.author.id)) ));
                    }
                    query(`UPDATE cooldowns SET ${itemdata[itemUsed].shieldInfo.shieldRow} = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                    query(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);

                    message.reply(lang.use.items[4].replace('{0}', itemUsed));

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
                }
                else if(itemdata[itemUsed].isHeal && row[itemUsed] >= 1){
                    if(message.client.sets.healCooldown.has(message.author.id)){
                        return message.reply(lang.use.items[6].replace('{0}', (await methods.getHealCooldown(message.author.id))));
                    }
                    let minHeal = itemdata[itemUsed].healMin;
                    let maxHeal = itemdata[itemUsed].healMax;
                    
                    let randHeal = (Math.floor(Math.random() * (maxHeal - minHeal + 1)) + minHeal);
                    let userMaxHeal = row.maxHealth - row.health;

                    if(userMaxHeal == 0){
                        return message.reply(lang.use.items[5]);
                    }
                    else if(userMaxHeal > randHeal){
                        query(`UPDATE scores SET health = ${row.health + randHeal} WHERE userId = ${message.author.id}`);
                        message.reply(lang.use.items[0].replace('{0}', randHeal));
                        query(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);
                    }
                    else if(userMaxHeal <= randHeal){
                        query(`UPDATE scores SET health = ${row.health + userMaxHeal} WHERE userId = ${message.author.id}`);
                        message.reply(lang.use.items[1].replace('{0}', userMaxHeal));
                        query(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);
                    }
                    methods.addToHealCooldown(message, message.author.id, itemUsed);
                }
                else if(itemdata[itemUsed].givesMoneyOnUse && row[itemUsed] >= 1){
                    let minAmt = itemdata[itemUsed].itemMin;
                    let maxAmt = itemdata[itemUsed].itemMax;
                    
                    let randAmt = Math.floor((Math.random() * (maxAmt - minAmt + 1)) + minAmt);

                    message.reply(lang.use.items[2].replace('{0}', itemUsed).replace('{1}', methods.formatMoney(randAmt))); //itemUsed    methods.formatMoney(randAmt)
                    query(`UPDATE scores SET money = ${parseInt(row.money) + randAmt} WHERE userId = ${message.author.id}`);
                    query(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);
                }
                else if(itemUsed == "reroll_scroll" && row.reroll_scroll >= 1){
                    methods.resetSkills(message, message.author.id);
                }
                else if(itemUsed == "xp_potion" && row.xp_potion >= 1){
                    methods.addxp(message, 75, message.author.id, lang);
                }
                else{
                    return message.reply(lang.use.errors[2]);
                }
            }
            else if(itemdata[itemUsed].isWeap && userNameID){ // Weapon usage
                try{
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
                    else if(row.clanId !== 0 && victimRow.clanId == row.clanId){
                        return message.reply(lang.use.errors[11]);
                    }
                    else if(message.client.sets.activeShield.has(message.author.id)){ // CHECK IF PLAYER HAS SHIELD ACTIVE
                        return message.reply(lang.use.errors[6]);
                    }
                    else if(!playRow.length){
                        return message.reply(lang.use.errors[7]);
                    }
                    else if(message.client.sets.activeShield.has(userNameID) && !(itemUsed == "awp" && row.awp >= 1 && row['50_cal'] >= 1)){
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

                        if(row[itemUsed] >= 1){
                            if(itemdata[itemUsed].ammo.length >= 1){ //remove ammo

                                for(var i = 0; i < itemdata[itemUsed].ammo.length; i++){
                                    if(row[itemdata[itemUsed].ammo[i]] >= 1){
                                        ammoToUse = itemdata[itemUsed].ammo[i];
                                        if(ammoToUse == "50_cal"){
                                            bonusDamage = 20;
                                        }
                                        else if(ammoToUse == "baseball"){
                                            bonusDamage = 12;
                                        }
                                        query(`UPDATE items SET ${ammoToUse} = ${row[ammoToUse] - 1} WHERE userId = ${message.author.id}`);
                                        break;
                                    }
                                }

                                if(ammoToUse == "" && itemdata[itemUsed].ammoOptional !== true){
                                    return message.reply(lang.use.errors[8]);
                                }
                            }

                            if(itemdata[itemUsed].breaksOnUse == true){
                                query(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);
                            }
                            else if(Math.random() <= parseFloat(itemdata[itemUsed].chanceToBreak)){
                                query(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);
                                methods.additem(message.author.id, itemdata[itemUsed].recyclesTo.materials);
                                weaponBreakAlert(message, itemUsed);
                            }

                            let randDmg = Math.floor(((Math.floor(Math.random() * (damageMax - damageMin + 1)) + damageMin) + bonusDamage) * row.scaledDamage);
                            
                            hitOrMiss(message, userNameID, itemUsed, victimRow, row, randDmg, itemdata[itemUsed].breaksOnUse, lang);
                            
                            methods.addToWeapCooldown(message, message.author.id, itemUsed);
                        }
                        else{
                            return message.reply(lang.use.errors[2]);
                        }
                    }
                }
                catch(err){
                    console.log(err);
                    return message.reply(lang.errors[1]);
                }
            }
            else if(!userNameID){
                return message.reply(lang.use.errors[0].replace('{0}', prefix));
            }
            else{
                return message.reply(lang.use.errors[1].replace('{0}', prefix));
            }
        }
        catch(err){
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

        const victimItems = (await query(`SELECT * FROM items WHERE userId ="${userNameID}"`))[0];
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