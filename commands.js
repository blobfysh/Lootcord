const Discord = require("discord.js");
const methods = require("./methods")
const config = require('./json/_config.json');
const botInfo = require('./json/_update_info.json');
const Jimp = require("jimp"); //jimp library allows realtime editing of images
const fs = require("fs");
const cryptorjs = require("cryptorjs");
const cryptor = new cryptorjs(config.encryptionAuth);
const itemdata = require("./json/completeItemList");

let deleteCooldown = new Set(); //for delete command
let gambleCooldown = new Set();

const deactivateCdSeconds = 86400 //24 hours
const mittenShieldCd = 1800; //30 minutes
const ironShieldCd = 7200; //2 hours
const goldShieldCd = 28800 //8 hours
const gambleCdSeconds = 60; //5 minutes
const voteCdSeconds = 43300; //12.01 hours
const peckCdSeconds = 7200; //2 hours in seconds
const scrambleCdSeconds = 900; //15 minutes
const triviaCdSeconds = 900;
const hourlyCdSeconds = 3600;
const healCdSeconds = 1800; //seconds in a half-hour
const weapCdSeconds = 3600; //seconds in an hour
/*
let jackpotCooldown = new Set(); //holds guild id, prevents from using jackpot multiple times in same server
const jackpotCdSeconds = 600;
*/

class Commands {
    //SET ITEMS DESCRIPTIONS BASED ON LANGUAGE
    ItemDescLang(message, userLang){

    }
    //ITEMS
    profile(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            let args = message.content.split(" ").slice(1);
            let userOldID = args[0];//RETURNS ID WITH <@ OR <@!
            if(userOldID !== undefined){
                if(!userOldID.startsWith("<@")){
                    message.reply("You need to mention someone!");
                    return;
                }
                let userNameID = args[0].replace(/[<@!>]/g, '');
                userProfile(userNameID, false);
            }
            else{
                userProfile(message.author.id, true);
            }
            function userProfile(userId, isSelf){
                sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
                    if(!row){
                        return message.reply("The person you're trying to search doesn't have an account!");
                    }
                    const profileEmbed = new Discord.RichEmbed()
                    .setColor(13215302)
                    .setAuthor(message.guild.members.get(userId).displayName + "'s Profile", client.users.get(userId).avatarURL)
                    .setDescription(row.kills+ " Kills | "+row.deaths+" Deaths ("+(row.kills/ row.deaths).toFixed(2)+" K/D)")
                    .addField("💗 Vitality", row.health + "/" + row.maxHealth + " HP")
                    .addField("💥 Strength", (row.scaledDamage).toFixed(2) + "x damage")
                    .addField("🍀 Luck", row.luck)
                    .addBlankField()
                    .addField("=== Backpack ===", "**" + row.backpack + "**", true)
                    .setFooter("🌟 " + row.stats + " Available skill points")
                    if(row.deaths == 0){
                        profileEmbed.setDescription(row.kills+ " Kills | "+row.deaths+" Deaths ("+row.kills+" K/D)")
                    }
                    message.channel.send(profileEmbed);
                });
            }
        });
    }
    inventory(message, sql, totalXpNeeded, xpNeeded, moddedUsers, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
            let args = message.content.split(" ").slice(1);
            let userOldID = args[0];

            if(userOldID !== undefined){
                if(!userOldID.startsWith("<@")){
                    message.reply("You need to mention someone!");
                    return;
                }
                let userNameID = args[0].replace(/[<@!>]/g, '');
                makeInventory(userNameID);
            }
            else{
                makeInventory(message.author.id);
            }
            function makeInventory(userId){
                sql.get(`SELECT * FROM items i
                JOIN scores s
                ON i.userId = s.userId
                WHERE s.userId="${userId}"`).then(userRow => {
                    if(!userRow){
                        return message.reply("The person you're trying to search doesn't have an account!");
                    }
                    methods.getuseritems(sql, userId, {amounts: true}).then(usersItems => {
                        methods.getitemcount(sql, userId).then(itemCt => {
                            var ultraItemList = usersItems.ultra;
                            var legendItemList = usersItems.legendary;
                            var epicItemList = usersItems.epic;
                            var rareItemList = usersItems.rare;
                            var uncommonItemList = usersItems.uncommon;
                            var commonItemList = usersItems.common;
                            var limitedItemList = usersItems.limited;

                            function userRate(){
                                let itemScore = 0;
                                itemScore += ultraItemList.length * 30;
                                itemScore += legendItemList.length * 20;
                                itemScore += epicItemList.length * 10;
                                itemScore += rareItemList.length * 5;
                                itemScore += uncommonItemList.length * 2;
                                itemScore += commonItemList.length * 1;
                                itemScore += (userRow.level * 5) - 5;
                                if(userRow.health <= 50){
                                    itemScore = itemScore/2
                                }
                                else if(userRow.health <= 60){
                                    itemScore = itemScore * 0.66;
                                }
                                else if(userRow.health <= 70){
                                    itemScore = itemScore * .8;
                                }
                                return itemScore.toFixed(2);
                            }
                            let userScoreImage = "";
                            let userScoreColor = 0;
                            let userRating = userRate();
                            if(userRating <= 30){
                                userScoreImage = "https://cdn.discordapp.com/attachments/501120454136692737/501971708585050133/pixelbnner.png";
                                userScoreColor = 720640;
                            }
                            else if(userRating <= 55){
                                userScoreImage = "https://cdn.discordapp.com/attachments/501120454136692737/501971770098843668/pixelbnner2good-Recovered.png";
                                userScoreColor = 16761856;
                            }
                            else if(userRating <= 120){
                                userScoreImage = "https://cdn.discordapp.com/attachments/501120454136692737/501971821483261953/pixelbnner3stronk.png";
                                userScoreColor = 16734464;
                            }
                            else{
                                userScoreImage = "https://cdn.discordapp.com/attachments/501120454136692737/501971878873923599/pixelbnner4HITMAN.png";
                                userScoreColor = 16761204;
                            }

                            totalXpNeeded = 0;
                            for(var i = 1; i <= userRow.level;i++){
                                xpNeeded = Math.floor(50*(i**1.7));
                                totalXpNeeded += xpNeeded;
                                if(i == userRow.level){
                                    break;
                                }
                            }

                            const embedInfo = new Discord.RichEmbed()
                            .setColor(userScoreColor)
                            .setAuthor(`${message.guild.members.get(userId).displayName}'s Inventory`, client.users.get(userId).avatarURL)
                            .setImage(userScoreImage)
                            if(totalXpNeeded - userRow.points <= 0){
                                embedInfo.addField("Level : "+ userRow.level,"`0 xp until level " + (userRow.level) + "`", true)
                            }
                            else{
                                embedInfo.addField("Level : "+ userRow.level,"`" + (totalXpNeeded - userRow.points) +" xp until level " + (userRow.level + 1) + "`", true)
                            }
                            if(ironShieldActive.has(userId)){
                                embedInfo.addField("🛡SHIELD ACTIVE", "`" + ((ironShieldCd * 1000 - ((new Date()).getTime() - userRow.ironShieldTime)) / 60000).toFixed(1) + " minutes`", true);
                            }
                            if(goldShieldActive.has(userId)){
                                embedInfo.addField("🛡SHIELD ACTIVE", "`" + ((goldShieldCd * 1000 - ((new Date()).getTime() - userRow.goldShieldTime)) / 60000).toFixed(1) + " minutes`", true);
                            }
                            if(mittenShieldActive.has(userId)){
                                embedInfo.addField("🛡SHIELD ACTIVE", "`" + ((mittenShieldCd * 1000 - ((new Date()).getTime() - userRow.mittenShieldTime)) / 60000).toFixed(1) + " minutes`", true);
                            }
                            embedInfo.addField("❤Health",`${userRow.health}/${userRow.maxHealth}`)
                            embedInfo.addField("💵Money : " + methods.formatMoney(userRow.money),"\u200b")
                            if(moddedUsers.has(userId)){
                                embedInfo.setFooter("Inventory space: " + itemCt.capacity + " max | This user is a Lootcord moderator! 💪");
                            }
                            else{
                                embedInfo.setFooter("Inventory space: " + itemCt.capacity + " max");
                            }
                            if(ultraItemList != ""){
                                let newList = ultraItemList.join('\n');
                                embedInfo.addField("<:UnboxUltra:526248982691840003>Ultra", "```" + newList + "```", true);
                            }
                            if(legendItemList != ""){
                                let newList = legendItemList.join('\n');
                                embedInfo.addField("<:UnboxLegendary:526248970914234368>Legendary", "```" + newList + "```", true);
                            }
                            if(epicItemList != ""){
                                let newList = epicItemList.join('\n');
                                embedInfo.addField("<:UnboxEpic:526248961892155402>Epic", "```" + newList + "```", true);
                            }
                            if(rareItemList != ""){
                                let newList = rareItemList.join('\n');
                                embedInfo.addField("<:UnboxRare:526248948579434496>Rare", "```" + newList + "```", true);
                            }
                            if(uncommonItemList != ""){
                                let newList = uncommonItemList.join('\n');
                                embedInfo.addField("<:UnboxUncommon:526248928891371520>Uncommon", "```" + newList + "```", true);
                            }
                            if(commonItemList != ""){
                                let newList = commonItemList.join('\n');
                                embedInfo.addField("<:UnboxCommon:526248905676029968>Common", "```" + newList + "```", true);
                            }
                            if(limitedItemList != ""){
                                let newList = limitedItemList.join('\n');
                                embedInfo.addField("🎁Limited", "```" + newList + "```", true);
                            }
                            if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == ""&& limitedItemList == ""){
                                embedInfo.addField("This inventory is empty! :(", "\u200b");
                            }
                            message.channel.send(embedInfo);
                        });
                    });
                }).catch(err => {
                    message.reply("Inventory lookup failed! Make sure you mention the user.")
                });
            }
        });
    }

    use(message, sql, prefix){//split into separate methods
        let args = message.content.split(" ").slice(1);
        args = args.filter(item => {return item;});//removes empty elements from args array
        let itemUsed = args[0];
        let userOldID = args[1];                          //RETURNS ID WITH <@ OR <@!
        itemUsed = methods.getCorrectedItemInfo(itemUsed, false, false);
        methods.randomUser(message, sql).then(randUser => {
        if(userOldID !== undefined){
            if(userOldID == "random" || userOldID == "rand"){
                var userNameID = randUser;
            }
            else var userNameID = args[1].replace(/[<@!>]/g, '');  //RETURNS BASE ID WITHOUT <@ OR <@! BUT ONLY IF PLAYER MENTIONED SOMEONE
        }
        sql.get(`SELECT * FROM items i
        JOIN scores s
        ON i.userId = s.userId
        WHERE s.userId="${message.author.id}"`).then(row => {                                     //GRABS INFORMATION FOR PLAYER          //
            if(!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!"); //checks for author id in sql items table(see if it doesnt exist)
            else if(itemdata[itemUsed] == undefined){
                return message.reply('You need to specify an item and mention a user to attack! `'+prefix+'use <item> <@user>`');
            }
            else if(itemdata[itemUsed].isItem){    //ITEMS TIME!!!!!!!!!!!!!!!!!!!
                //CODE FOR ITEMS, NOT WEAPONS
                if(userOldID == undefined || !Number.isInteger(parseInt(userOldID)) || userOldID % 1 !== 0 || userOldID < 1){
                    userOldID = 1;
                }
                else if(userOldID > 10){
                    userOldID = 10;
                }
                if(itemUsed.toLowerCase() == "item_box" && row.item_box >= userOldID || itemUsed.toLowerCase() == "box" && row.item_box >= userOldID){
                    methods.openbox(message, sql, "item_box", userOldID);
                }
                else if(itemUsed.toLowerCase() == "ultra_box" && row.ultra_box >= userOldID || itemUsed.toLowerCase() == "ultra" && row.ultra_box >= userOldID){
                    methods.openbox(message, sql, "ultra_box", userOldID);
                }
                else if(itemUsed.toLowerCase() == "ammo_box" && row.ammo_box >= userOldID || itemUsed.toLowerCase() == "ammo" && row.ammo_box >= userOldID){
                    methods.openbox(message, sql, "ammo_box", userOldID);
                }
                else if(itemUsed.toLowerCase() == "ultra_ammo" && row.ultra_ammo >= userOldID){
                    methods.openbox(message, sql, "ultra_ammo", userOldID);
                }
                else if(itemUsed == "stocking" && row.stocking >= 1){
                    let chance = Math.floor(Math.random() * 201) //1-200
                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(hpRow => {
                        if(chance <= 50){
                            message.reply("You open the stocking to find...\n```$500```");
                            sql.run(`UPDATE scores SET money = ${hpRow.money + 500} WHERE userId = ${message.author.id}`);
                        }
                        else if(chance <= 100){
                            message.reply("You open the stocking to find...\n```$2000```");
                            sql.run(`UPDATE scores SET money = ${hpRow.money + 2000} WHERE userId = ${message.author.id}`);
                        }
                        else{
                            message.reply("You open the stocking to find...\n```A lump of coal...```\nBetter luck next time...");
                        }
                    });
                    sql.run(`UPDATE items SET stocking = ${row.stocking - 1} WHERE userId = ${message.author.id}`);
                }
                else if(itemUsed.toLowerCase() == "mittens" && row.mittens >= 1){
                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(hpRow => {
                        if(ironShieldActive.has(message.author.id)){
                            message.reply("Your current shield is still active for  `" + ((ironShieldCd * 1000 - ((new Date()).getTime() - hpRow.ironShieldTime)) / 60000).toFixed(1) + " minutes`!");
                            return;
                        }
                        else if(goldShieldActive.has(message.author.id)){
                            message.reply("Your current shield is still active for  `" + ((goldShieldCd * 1000 - ((new Date()).getTime() - hpRow.goldShieldTime)) / 60000).toFixed(1) + " minutes`!");
                            return;
                        }
                        else if(mittenShieldActive.has(message.author.id)){
                            message.reply("Your current shield is still active for  `" + ((mittenShieldCd * 1000 - ((new Date()).getTime() - hpRow.mittenShieldTime)) / 60000).toFixed(1) + " minutes`!");
                            return;
                        }
                        sql.run(`UPDATE scores SET mittenShieldTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                        mittenShieldActive.add(message.author.id);
                        message.reply("You have activated `mittens`!");
                        sql.run(`UPDATE items SET mittens = ${row.mittens - 1} WHERE userId = ${message.author.id}`);
                        setTimeout(() => {
                            mittenShieldActive.delete(message.author.id)
                            sql.run(`UPDATE scores SET mittenShieldTime = ${0} WHERE userId = ${message.author.id}`);
                        }, mittenShieldCd * 1000);
                    });
                }
                else if(itemUsed.toLowerCase() == "iron_shield" && row.iron_shield >= 1){
                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(hpRow => {
                        if(ironShieldActive.has(message.author.id)){
                            message.reply("Your current shield is still active for  `" + ((ironShieldCd * 1000 - ((new Date()).getTime() - hpRow.ironShieldTime)) / 60000).toFixed(1) + " minutes`!");
                            return;
                        }
                        else if(goldShieldActive.has(message.author.id)){
                            message.reply("Your current shield is still active for  `" + ((goldShieldCd * 1000 - ((new Date()).getTime() - hpRow.goldShieldTime)) / 60000).toFixed(1) + " minutes`!");
                            return;
                        }
                        else if(mittenShieldActive.has(message.author.id)){
                            message.reply("Your current shield is still active for  `" + ((mittenShieldCd * 1000 - ((new Date()).getTime() - hpRow.mittenShieldTime)) / 60000).toFixed(1) + " minutes`!");
                            return;
                        }
                        sql.run(`UPDATE scores SET ironShieldTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                        ironShieldActive.add(message.author.id);
                        message.reply("You have activated `iron_shield`!");
                        sql.run(`UPDATE items SET iron_shield = ${row.iron_shield - 1} WHERE userId = ${message.author.id}`);
                        setTimeout(() => {
                            ironShieldActive.delete(message.author.id)
                            sql.run(`UPDATE scores SET ironShieldTime = ${0} WHERE userId = ${message.author.id}`);
                        }, ironShieldCd * 1000);
                    });
                }
                else if(itemUsed.toLowerCase() == "gold_shield" && row.gold_shield >= 1){
                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(hpRow => {
                        if(ironShieldActive.has(message.author.id)){
                            message.reply("Your current shield is still active for  `" + ((ironShieldCd * 1000 - ((new Date()).getTime() - hpRow.ironShieldTime)) / 60000).toFixed(1) + " minutes`!");
                            return;
                        }
                        else if(goldShieldActive.has(message.author.id)){
                            message.reply("Your current shield is still active for  `" + ((goldShieldCd * 1000 - ((new Date()).getTime() - hpRow.goldShieldTime)) / 60000).toFixed(1) + " minutes`!");
                            return;
                        }
                        else if(mittenShieldActive.has(message.author.id)){
                            message.reply("Your current shield is still active for  `" + ((mittenShieldCd * 1000 - ((new Date()).getTime() - hpRow.mittenShieldTime)) / 60000).toFixed(1) + " minutes`!");
                            return;
                        }
                        sql.run(`UPDATE scores SET goldShieldTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                        goldShieldActive.add(message.author.id);
                        message.reply("You have activated `gold_shield`!");
                        sql.run(`UPDATE items SET gold_shield = ${row.gold_shield - 1} WHERE userId = ${message.author.id}`);
                        setTimeout(() => {
                            goldShieldActive.delete(message.author.id)
                            sql.run(`UPDATE scores SET goldShieldTime = ${0} WHERE userId = ${message.author.id}`);
                        }, goldShieldCd * 1000);
                    });
                }
                else if(itemdata[itemUsed].isHeal && row[itemUsed] >= 1){
                    methods.getHealCooldown(sql, message.author.id).then(healCdTime => {
                        if(healCooldown.has(message.author.id)){
                            return message.reply("You need to wait  " + healCdTime + "  before healing again.");
                        }
                        let minHeal = itemdata[itemUsed].healMin;
                        let maxHeal = itemdata[itemUsed].healMax;
                        
                        let randHeal = (Math.floor(Math.random() * (maxHeal - minHeal + 1)) + minHeal);
                        let userMaxHeal = row.maxHealth - row.health;

                        if(userMaxHeal == 0){
                            return message.reply("You are already max health!");
                        }
                        else if(userMaxHeal > randHeal){
                            sql.run(`UPDATE scores SET health = ${row.health + randHeal} WHERE userId = ${message.author.id}`);
                            message.reply("You have healed for `" + randHeal + "` HP!");
                            sql.run(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);
                        }
                        else if(userMaxHeal <= randHeal){
                            sql.run(`UPDATE scores SET health = ${row.health + userMaxHeal} WHERE userId = ${message.author.id}`);
                            message.reply("You have healed for `" + userMaxHeal + "` HP and hit your max health limit!");
                            sql.run(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);
                        }
                        methods.addToHealCooldown(sql, message.author.id, itemUsed);
                    });
                }
                else if(itemdata[itemUsed].givesMoneyOnUse && row[itemUsed] >= 1){
                    let minAmt = itemdata[itemUsed].itemMin;
                    let maxAmt = itemdata[itemUsed].itemMax;
                    
                    let randAmt = Math.floor((Math.random() * (maxAmt - minAmt + 1)) + minAmt);

                    message.reply("You open the " + itemUsed + " to find...\n```"+ methods.formatMoney(randAmt) + "```");
                    sql.run(`UPDATE scores SET money = ${row.money + randAmt} WHERE userId = ${message.author.id}`);
                    sql.run(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);
                }
                else if(itemUsed == "reroll_scroll" && row.reroll_scroll >= 1 || itemUsed == "reroll" && row.reroll_scroll >= 1){
                    //call method
                    methods.resetSkills(message, sql, message.author.id);
                }
                else if(itemUsed == "xp_potion" && row.xp_potion >= 1 || itemUsed == "xp_pot" && row.xp_potion >= 1){
                    //call method
                    methods.addxp(message, sql, 75, message.author.id);
                }
                else{
                    return message.reply("You don't have enough of that item!");
                }
            }
            ///////////////////////////////////WEAPON-CODING BEYOND THIS POINT/////////////////////////////////////////
            else if(itemdata[itemUsed].isWeap){
                sql.get(`SELECT * FROM scores WHERE userId ='${userNameID}'`).then(victimRow => {             //GRABS INFORMATION FOR PLAYERS TARGET  //
                    function hitOrMiss(damage, isBroken){                                                           //FUNCTION THAT ACTUALLY HANDLES DAMAGE DEALT
                        let chance = Math.floor(Math.random() * 100) + 1; //return 1-100
                        let luck = victimRow.luck >= 20 ? 20 : victimRow.luck;
                        if(chance <= luck){
                            if(isBroken){
                                return message.channel.send(`🍀<@${userNameID}> EVADED <@`+ message.author.id + `>'s attack! How lucky!\nThe ${itemUsed} slipped from your hands!`);
                            }
                            else{
                                return message.channel.send(`🍀<@${userNameID}> EVADED <@`+ message.author.id + `>'s attack! How lucky!`);
                            }
                        }
                        else{
                            if(victimRow.health - damage <= 0){
                                //CODE FOR IF YOU KILL TARGET
                                if(isBroken){
                                    message.channel.send(`<@${message.author.id}>` + ` hit <@${userNameID}> with a ` + itemUsed + ` for **${damage}** DAMAGE AND KILLED THEM! <:POGGERS:461045666987114498>\nThe ${itemUsed} broke!`);
                                }
                                else{
                                    message.channel.send(`<@${message.author.id}>` + ` hit <@${userNameID}> with a ` + itemUsed + ` for **${damage}** DAMAGE AND KILLED THEM! <:POGGERS:461045666987114498>`);
                                }
                                sql.get(`SELECT * FROM items WHERE userId ="${userNameID}"`).then(victimItems => { 
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
                                        amountToGive = Math.floor(victimItemCount.length/5)
                                    }

                                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(userRow => {
                                        methods.randomItems(sql, message.author.id, userNameID, amountToGive).then(result => {
                                        
                                            sql.run(`UPDATE scores SET money = ${userRow.money + victimRow.money} WHERE userId = ${message.author.id}`);
                                            sql.run(`UPDATE scores SET points = ${userRow.points + 100} WHERE userId = ${message.author.id}`);
                                            sql.run(`UPDATE scores SET kills = ${userRow.kills + 1} WHERE userId = ${message.author.id}`); //add 1 to kills
        
                                            sql.run(`UPDATE scores SET health = ${100} WHERE userId = ${userNameID}`);
                                            sql.run(`UPDATE scores SET money = ${0} WHERE userId = ${userNameID}`);
                                            sql.run(`UPDATE scores SET deaths = ${victimRow.deaths + 1} WHERE userId = ${userNameID}`); //add 1 to deaths for killed user
        
                                            const killedReward = new Discord.RichEmbed()  
                                            .setTitle(`LOOT RECEIVED`)
                                            .setDescription("Money : " + methods.formatMoney(victimRow.money) + "\nExperience : `100xp`")
                                            .setColor(7274496)
                                            .addField("**ITEMS**", result)
                                            message.channel.send(killedReward);

                                            methods.sendtokillfeed(message, sql, message.author.id, userNameID, itemUsed, damage, result, methods.formatMoney(victimRow.money));
        
                                            const embedInfo = new Discord.RichEmbed()
                                            .setTitle("💀**Kill Log**\n\nKILLER: `" + message.author.tag + " : " + message.author.id + "`\nVICTIM: `"+ client.users.get(userNameID).tag +" : " + userNameID + "`")
                                            .setDescription("Weapon used: `"+itemUsed+" : "+damage+" damage`")
                                            .addField("Items stolen", result, true)
                                            .addField("Money stolen", "$"+victimRow.money, true)
                                            .setTimestamp()
                                            .setColor(16721703)
                                            client.guilds.get("454163538055790604").channels.get("500467081226223646").send(embedInfo);
                                        });
                                    });
                                });
                            }
                            else{
                                if(itemUsed.toLowerCase() == "peck_seed"){//TURNS ENEMY INTO A CHICKEN
                                    sql.run(`UPDATE scores SET peckTime = ${(new Date()).getTime()} WHERE userId = ${userNameID}`); 
                                    peckCooldown.add(userNameID);
                                    setTimeout(() => {
                                        peckCooldown.delete(userNameID);
                                        sql.run(`UPDATE scores SET peckTime = ${0} WHERE userId = ${userNameID}`);
                                    }, peckCdSeconds * 1000);
                                    sql.run(`UPDATE scores SET health = ${victimRow.health - damage} WHERE userId = ${userNameID}`);
                                    message.channel.send(`<@${message.author.id}>` + ` HIT <@${userNameID}> FOR ${damage} DAMAGE TURNING THEM INTO A **CHICKEN** using ` + itemUsed + `!!!\nThey now have **${victimRow.health - damage}** health and can't use any commands for 2 hours!`);
                                }
                                else{
                                    sql.run(`UPDATE scores SET health = ${victimRow.health - damage} WHERE userId = ${userNameID}`);
                                    if(isBroken){
                                        message.channel.send(`<@${message.author.id}>` + ` hit <@${userNameID}> with a ` + itemUsed + ` for **${damage}** DAMAGE!\nThey now have **${victimRow.health - damage}** health!\nThe ${itemUsed} broke.`);
                                    }
                                    else{
                                        message.channel.send(`<@${message.author.id}>` + ` hit <@${userNameID}> with a ` + itemUsed + ` for **${damage}** DAMAGE!\nThey now have **${victimRow.health - damage}** health!`);
                                    }
                                    
                                }
                                return;
                            }
                        }
                    }
                    if(userOldID == undefined || !userOldID.startsWith("<@") && !userOldID.startsWith("rand")){                     //CHECKING FOR ERRORS IN MENTION
                        return message.reply('You need to mention someone!');
                    }
                    else if(userNameID === client.user.id){        //CHECK IF PLAYER ATTACKS BOT
                        return message.channel.send(`ow`);
                    }
                    else if(userNameID === message.author.id){        //CHECK IF PLAYER ATTACKS BOT
                        return message.reply(`You can't attack yourself!`);
                    }
                    else if(!victimRow){                                 //MAKE SURE TARGET HAS AN ACCOUNT BY CHECKING FOR THEIR ID IN SCORES TABLE
                        return message.reply(`The person you're trying to attack doesn't have an account!`);
                    }
                    else if(ironShieldActive.has(message.author.id) || goldShieldActive.has(message.author.id) || mittenShieldActive.has(message.author.id)){        //CHECK IF PLAYER HAS SHIELD ACTIVE
                        return message.reply("You can't attack while you have a shield active!");
                    }
                    else{//FINALLY START CHECKING WHAT WEAPON THEY USE AND APPLYING DAMAGE
                        sql.get(`SELECT * FROM userGuilds WHERE userId ="${userNameID}" AND guildId = "${message.guild.id}"`).then(playRow => {
                            if(!playRow){
                                return message.reply("This user has not activated their account in this server!");
                            }
                            else if(mittenShieldActive.has(userNameID)){        //CHECK IF PLAYER HAS SHIELD ACTIVE
                                if(itemUsed == "awp" && row.awp >= 1 && row.bmg_50cal >= 1){
                                }
                                else{
                                    return message.reply("This person is wearing `mittens`!\nThey are untargetable for `" + ((mittenShieldCd * 1000 - ((new Date()).getTime() - victimRow.mittenShieldTime)) / 60000).toFixed(1) + " minutes`!");
                                }
                            }
                            else if(ironShieldActive.has(userNameID)){        //CHECK IF PLAYER HAS SHIELD ACTIVE
                                if(itemUsed == "awp" && row.awp >= 1 && row.bmg_50cal >= 1){
                                }
                                else{
                                    return message.reply("This person is using an `iron_shield`!\nThey are untargetable for `" + ((ironShieldCd * 1000 - ((new Date()).getTime() - victimRow.ironShieldTime)) / 60000).toFixed(1) + " minutes`!");
                                }
                            }
                            else if(goldShieldActive.has(userNameID)){        //CHECK IF PLAYER HAS SHIELD ACTIVE
                                if(itemUsed == "awp" && row.awp >= 1 && row.bmg_50cal >= 1){
                                }
                                else{
                                    return message.reply("This person is using a `gold_shield`!\nThey are untargetable for `" + ((goldShieldCd * 1000 - ((new Date()).getTime() - victimRow.goldShieldTime)) / 60000).toFixed(1) + " minutes`!");
                                } 
                            }
                            sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(CDRow => {
                                if(weapCooldown.has(message.author.id)){
                                    methods.getAttackCooldown(sql, message.author.id).then(timeLeft => {
                                        message.delete();
                                        message.reply("You need to wait  " + timeLeft + "  before attacking again.");
                                    });
                                }
                                else{                                       //WEAPONS!!!!!!!!!!!!!
                                    let ammoToUse = "";
                                    let bonusDamage = 0;
                                    let damageMin = itemdata[itemUsed].minDmg;
                                    let damageMax = itemdata[itemUsed].maxDmg;

                                    if(row[itemUsed] >= 1){
                                        if(itemdata[itemUsed].ammo.length >= 1){//remove ammo
                                            for(var i = 0; i < itemdata[itemUsed].ammo.length; i++){
                                                if(row[itemdata[itemUsed].ammo[i]] >= 1){
                                                    ammoToUse = itemdata[itemUsed].ammo[i];
                                                    if(ammoToUse == "bmg_50cal"){
                                                        bonusDamage = 20;
                                                    }
                                                    else if(ammoToUse == "baseball"){
                                                        bonusDamage = 12;
                                                    }
                                                    sql.run(`UPDATE items SET ${ammoToUse} = ${row[ammoToUse] - 1} WHERE userId = ${message.author.id}`);
                                                    break;
                                                }
                                            }
                                            if(ammoToUse == "" && itemdata[itemUsed].ammoOptional !== true){
                                                return message.reply("You don't have any ammo for that weapon!");
                                            }
                                        }
                                        if(itemdata[itemUsed].breaksOnUse == true){
                                            sql.run(`UPDATE items SET ${itemUsed} = ${row[itemUsed] - 1} WHERE userId = ${message.author.id}`);
                                        }

                                        let randDmg = Math.floor(((Math.floor(Math.random() * (damageMax - damageMin + 1)) + damageMin) + bonusDamage) * row.scaledDamage);
                                        
                                        hitOrMiss(randDmg, itemdata[itemUsed].breaksOnUse);
                                        
                                        methods.addToWeapCooldown(sql, message.author.id, itemUsed);
                                    }
                                    else{
                                        return message.reply(`You don't have that item!`);
                                    }
                                    //in future add users to separate cooldown sets
                                }
                            });
                        });
                    }
                }).catch((err) => {
                    return message.reply('ERROR: ```'+err+'```');
                });
            }
            else{
                return message.reply('That item cannot be used to attack and is not a consumable. `'+prefix+'use <item> <@user>`');
            }
        }).catch((err) => {
            return message.reply('You need to specify an item and mention a user to attack! `'+prefix+'use <item> <@user>`');
        });
        });
    }
    
    craft(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
        if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
        let args = message.content.split(" ").slice(1);
        let craftItem = args[0];
        craftItem = methods.getCorrectedItemInfo(craftItem, false, false);
        let sellAmount = 1;
        let itemPrice = "";
        let recycleMin = 0;
        let recycleMax = 1;
        let extraScrap = "";
        let chance = Math.random();
        if(itemdata[craftItem] !== undefined){
            //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
            if(itemdata[craftItem].craftedWith == ""){
                return message.reply("That cannot be crafted!");
            }
            itemPrice = itemdata[craftItem].craftedWith.display;
            const embedInfo = new Discord.RichEmbed()
            .setTitle("Craft `" + craftItem + "` for")
            .setDescription("```" + itemPrice +"```")
            .setColor(0)
            .setImage("https://cdn.discordapp.com/attachments/454163538886524928/527740857525207060/redLine.png")
            .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/527739509740142592/UnboxUltra.png")
            message.channel.send(message.author, {embed : embedInfo}).then(botMessage => {
                botMessage.react('✅').then(() => botMessage.react('❌'));
                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                .then(collected => {
                    const reaction = collected.first();

                    if(reaction.emoji.name === '✅'){
                        botMessage.delete();
                        methods.hasitems(sql, message.author.id, itemdata[craftItem].craftedWith.materials).then(result => {
                            if(result){
                                message.reply("Successfully crafted `" + craftItem + "`!");
                                methods.removeitem(sql, message.author.id, itemdata[craftItem].craftedWith.materials);
                                methods.additem(sql, message.author.id, craftItem, 1);
                            }
                            else{
                                message.reply("You are missing the required materials for this item!");
                            }
                        });
                    }
                    else{
                        botMessage.delete();
                    }
                }).catch(collected => {
                    botMessage.delete();
                    message.reply("You didn't react in time!");
                });
            });
        }
        else{
            message.reply("Use `"+prefix+"help craft` to see how to use this command!");
        }
    });
    }
    recycle(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
        if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
        let args = message.content.split(" ").slice(1);
        let sellItem = args[0];
        sellItem = methods.getCorrectedItemInfo(sellItem, false, false);

        if(itemdata[sellItem] !== undefined){
            if(itemdata[sellItem].recyclesTo == ""){
                return message.reply("That item cannot be recycled.");
            }

            let recyclePrice = itemdata[sellItem].recyclesTo.display;

            const embedInfo = new Discord.RichEmbed()
            .setTitle("Recycle `" + sellItem + "` for")
            .setDescription("```" + recyclePrice +"```")
            .setColor(0)
            .setImage("https://cdn.discordapp.com/attachments/454163538886524928/527630489851265025/goldLine.png")
            .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/527391190975381505/LC_Recycle.png")
            .setFooter("You will need " + methods.getTotalItmCountFromList(itemdata[sellItem].recyclesTo.materials) + " open slots in your inventory to recycle this.")
            
            message.channel.send(message.author, {embed : embedInfo}).then(botMessage => {
                botMessage.react('✅').then(() => botMessage.react('❌'));
                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                .then(collected => {
                    const reaction = collected.first();

                    if(reaction.emoji.name === '✅'){
                        botMessage.delete();
                        methods.hasitems(sql, message.author.id, sellItem, 1).then(userHasItem => {
                            if(!userHasItem) return message.reply("You don't have that item!");
                            
                            methods.hasenoughspace(sql, message.author.id, methods.getTotalItmCountFromList(itemdata[sellItem].recyclesTo.materials)).then(result => {
                                if(!result) return message.reply("**You don't have enough space in your inventory!** You can clear up space by selling some items.");

                                methods.additem(sql, message.author.id, itemdata[sellItem].recyclesTo.materials);
                                methods.removeitem(sql, message.author.id, sellItem, 1);
                                message.reply("`" + sellItem + "` recycled for ```" + recyclePrice + "```");
                            });
                        });
                    }
                    else{
                        botMessage.delete();
                    }
                }).catch(collected => {
                    botMessage.delete();
                    message.reply("You didn't react in time!");
                });
            });
        }
        else{
            message.reply("I don't recognize that item. `recycle <item>`");
        }
    });
    }
    item(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
            let args = message.content.split(" ").slice(1);
            let itemSearched = args[0];
            itemSearched = methods.getCorrectedItemInfo(itemSearched, false, false);

            if(itemdata[itemSearched] !== undefined){
                let itemDamage = itemdata[itemSearched].damage;
                let itemBuyCurr = itemdata[itemSearched].buy.currency;
                let itemBuyPrice = itemdata[itemSearched].buy.amount;
                let itemSellPrice = itemdata[itemSearched].sell;
                let itemAmmo = itemdata[itemSearched].ammo;
                let itemAmmoFor = itemdata[itemSearched].isAmmo;
                let itemRarity = itemdata[itemSearched].rarity;
                let itemInfo = itemdata[itemSearched].desc;
                let itemImg = itemdata[itemSearched].image;
                let itemRecyclesTo = itemdata[itemSearched].recyclesTo;
                let itemCraftedWith = itemdata[itemSearched].craftedWith;
                let itemCooldown = itemdata[itemSearched].cooldown;
                let isBound = itemdata[itemSearched].canBeStolen;
                let itemRarityColor = 0;

                if(itemRarity == "Ultra"){
                    itemRarityColor = 16711778;
                }
                else if(itemRarity == "Legendary"){
                    itemRarityColor = 16312092;
                }
                else if(itemRarity == "Limited"){
                    itemRarityColor = 13391388;
                }
                else if(itemRarity == "Epic"){
                    itemRarityColor = 12390624;
                }
                else if(itemRarity == "Rare"){
                    itemRarityColor = 30463;
                }
                else if(itemRarity == "Uncommon"){
                    itemRarityColor = 4755200;
                }
                else{
                    itemRarityColor = 10197915;
                }
                var embedItem = new Discord.RichEmbed()
                .setTitle(`🏷**${itemSearched} Info**`)
                .setColor(itemRarityColor)
                .setThumbnail(itemImg)
                if(!isBound){
                    embedItem.setDescription(itemInfo + "```css\nThis item binds to the user when received, and cannot be traded or stolen.```");
                    //embedItem.addField("***This item is protected***", "||```css\nThis item binds to the user when received, and cannot be traded or stolen.```||")
                }
                else{
                    embedItem.setDescription(itemInfo);
                }
                if(itemCooldown !== ""){
                    embedItem.addField("***Rarity***", itemRarity, true)
                    embedItem.addField("**Cooldown**", "`" + itemCooldown.display + "`")
                }
                else{
                    embedItem.addField("***Rarity***", itemRarity)
                }
                if(itemDamage !== ""){
                    embedItem.addField("💥Damage", itemDamage, true)
                }
                if(itemAmmo !== "" && itemAmmo !== "N/A"){
                    embedItem.addField("🔻Ammo Required", itemAmmo, true)
                }
                if(itemAmmoFor.length >= 1){
                    embedItem.addField("🔻Ammo for", itemAmmoFor, true)
                }

                if(itemBuyCurr !== undefined && itemBuyCurr == "money"){
                    embedItem.addField("Cost", "📥 Buy : " + methods.formatMoney(itemBuyPrice) + " | 📤 Sell : " + methods.formatMoney(itemSellPrice))
                }
                else if(itemBuyCurr !== undefined){
                    embedItem.addField("Cost", "📥 Buy : " + itemBuyPrice + "`" + itemBuyCurr +"` | 📤 Sell : " + methods.formatMoney(itemSellPrice))
                }
                else if(itemSellPrice !== ""){
                    embedItem.addField("Cost", "📤 Sell : " + methods.formatMoney(itemSellPrice))
                }
                
                if(itemRecyclesTo.materials !== undefined){
                    embedItem.addBlankField();
                    embedItem.addField("Recycles into", "```"+ itemRecyclesTo.display +"```", true)
                }
                if(itemCraftedWith !== ""){
                    embedItem.addField("Items required to craft", "```"+ itemCraftedWith.display +"```", true)
                }
                message.channel.send(embedItem);
            }
            else if(itemSearched == ""){
                let commonList = methods.getitems("common", {});
                let uncommonList = methods.getitems("uncommon", {});
                let rareList = methods.getitems("rare", {});
                let epicList = methods.getitems("epic", {});
                let legendList = methods.getitems("legendary", {});
                let ultraList = methods.getitems("ultra", {});
                let limitList = methods.getitems("limited", {});

                const embedInfo = new Discord.RichEmbed()
                .setColor(0)
                .setTitle("Full Items List")
                .setURL("https://lootcord.com/items")
                .addField("<:UnboxCommon:526248905676029968>Common","`" + commonList.sort().join("`\n`") + "`", true)
                .addField("<:UnboxUncommon:526248928891371520>Uncommon","`" + uncommonList.sort().join("`\n`") + "`", true)
                .addField("<:UnboxRare:526248948579434496>Rare","`" + rareList.sort().join("`\n`") + "`", true)
                .addField("<:UnboxEpic:526248961892155402>Epic","`" + epicList.sort().join("`\n`") + "`", true)
                .addField("<:UnboxLegendary:526248970914234368>Legendary","`" + legendList.sort().join("`\n`") + "`", true)
                .addField("<:UnboxUltra:526248982691840003>Ultra","`" + ultraList.sort().join("`\n`") + "`", true)
                .setFooter("Use "+prefix+"item <item> to retrieve more information!")
                return message.channel.send(embedInfo);
            }
            else{
                message.reply("That item isn't in my database! Use `"+prefix+"items` to see a full list!");
            }
        }).catch((err) => {
            console.log(err);
            message.reply("That item isn't in my database! Use `"+prefix+"items` to see a full list!");
            return;
        });
    }
    buy(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            methods.getGamesData(sql).then(gamesRow => {
                if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
                let args = message.content.split(" ").slice(1);
                let buyItem = args[0];
                buyItem = methods.getCorrectedItemInfo(buyItem, false, false);
                let buyAmount = args[1];

                if(itemdata[buyItem] !== undefined){
                    let currency = itemdata[buyItem].buy.currency;
                    let itemPrice = itemdata[buyItem].buy.amount;
                    if(itemPrice == undefined){
                        message.reply("That item is not for sale!");
                    }
                    else{                                                         //CODE FOR BUYING ITEM
                        if(buyAmount == undefined || !Number.isInteger(parseInt(buyAmount)) || buyAmount % 1 !== 0 || buyAmount < 1){
                            buyAmount = 1;
                        }
                        else if(buyAmount > 20) buyAmount = 20;
                        message.delete();

                        methods.buyitem(message, sql, buyItem, parseInt(buyAmount), itemPrice, currency, false);
                    }
                }
                else if(gamesRow[buyItem] !== undefined){
                    //code for buying game here
                    let gameAmount = gamesRow[buyItem].gameAmount;
                    let currency = gamesRow[buyItem].gameCurrency;
                    let itemPrice = gamesRow[buyItem].gamePrice;
                    buyAmount = 1;

                    if(gameAmount <= 0){
                        return message.reply("That game is sold out! 😞");
                    }
                    methods.buyitem(message, sql, buyItem, parseInt(buyAmount), itemPrice, currency, true);
                }
                else{
                    message.reply("You need to enter a valid item to buy! `"+prefix+"buy <item> <amount>`");
                }
            });
        });
    }
    sellall(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
                let args = message.content.split(" ").slice(1);
                let sellItem = args[0];

                console.log(itemdata[3])
                if(sellItem !== undefined){
                    sellItem = sellItem.toLowerCase();
                    let itemType = "";
                    let commonTotal = 0;
                    let totalAmount = 0;
                    //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
                    let itemsToCheck = methods.getitems(sellItem.charAt(0).toUpperCase() + sellItem.slice(1), {});

                    if(itemsToCheck.length < 1){
                        return message.reply("You need to enter a valid type to sell! `"+prefix+"sellall <rarity>`");
                    }
                    else{
                        //iterate array and sell
                        for (var i = 0; i < itemsToCheck.length; i++) {
                            if(itemRow[itemsToCheck[i]] >= 1){
                                totalAmount += itemRow[itemsToCheck[i]];
                                commonTotal += (itemRow[itemsToCheck[i]] * itemdata[itemsToCheck[i]].sell);
                            }
                        }
                    }
                    if(totalAmount <= 0){
                        return message.reply("You don't have any items of that quality.");
                    }
                    message.delete();
                    message.reply("Sell " + totalAmount + "x `" + sellItem +"` items for " + methods.formatMoney(commonTotal) + "?").then(botMessage => {
                        botMessage.react('✅').then(() => botMessage.react('❌'));
                        const filter = (reaction, user) => {
                            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                        };
                        botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                        .then(collected => {
                            const reaction = collected.first();

                            if(reaction.emoji.name === '✅'){
                                botMessage.delete();
                                sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow2 => {
                                    let testAmount = 0;//used to verify user didnt alter inventory while selling.
                                    let testTotalItems = 0;
                                    for (var i = 0; i < itemsToCheck.length; i++) {
                                        if(itemRow2[itemsToCheck[i]] >= 1){
                                            testTotalItems += itemRow2[itemsToCheck[i]];
                                            testAmount += (itemRow2[itemsToCheck[i]] * itemdata[itemsToCheck[i]].sell);
                                        }
                                    }
                                    
                                    if(testTotalItems == totalAmount && testAmount == commonTotal){
                                        //VERIFIED
                                        methods.addmoney(sql, message.author.id, parseInt(commonTotal));
                                        for (var i = 0; i < itemsToCheck.length; i++) {
                                            sql.run(`UPDATE items SET ${itemsToCheck[i]} = ${0} WHERE userId = ${message.author.id}`);
                                        }

                                        message.reply(`Successfully sold all ${sellItem} items.`);
                                    }
                                    else{
                                        message.reply(`Sellall failed. Your inventory was altered during the sale.`);
                                    }
                                });
                            }
                            else{
                                botMessage.delete();
                            }
                        }).catch(collected => {
                            botMessage.delete();
                            message.reply("You didn't react in time!");
                        });
                    });
                }
                else{
                    let commonTotal = 0;
                    let totalAmount = 0;
                    //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
                    let itemsToCheck = methods.getitems("all", {exclude: "limited"});

                    for (var i = 0; i < itemsToCheck.length; i++) {
                        if(itemRow[itemsToCheck[i]] >= 1){
                            totalAmount += itemRow[itemsToCheck[i]];
                            commonTotal += (itemRow[itemsToCheck[i]] * itemdata[itemsToCheck[i]].sell);
                        }
                    }
                    if(totalAmount <= 0){
                        return message.reply("You don't have any items of that quality.");
                    }

                    message.reply("Sell " + totalAmount + "x items for " + methods.formatMoney(commonTotal) + "?").then(botMessage => {
                        botMessage.react('✅').then(() => botMessage.react('❌'));
                        const filter = (reaction, user) => {
                            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                        };
                        botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                        .then(collected => {
                            const reaction = collected.first();

                            if(reaction.emoji.name === '✅'){
                                botMessage.delete();
                                sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow2 => {
                                    let testAmount = 0;//used to verify user didnt alter inventory while selling.
                                    let testTotalItems = 0;
                                    for (var i = 0; i < itemsToCheck.length; i++) {
                                        if(itemRow2[itemsToCheck[i]] >= 1){
                                            testTotalItems += itemRow2[itemsToCheck[i]];
                                            testAmount += (itemRow2[itemsToCheck[i]] * itemdata[itemsToCheck[i]].sell);
                                        }
                                    }
                                    
                                    if(testTotalItems == totalAmount && testAmount == commonTotal){
                                        //VERIFIED
                                        methods.addmoney(sql, message.author.id, parseInt(commonTotal));
                                        for (var i = 0; i < itemsToCheck.length; i++) {
                                            sql.run(`UPDATE items SET ${itemsToCheck[i]} = ${0} WHERE userId = ${message.author.id}`);
                                        }

                                        message.reply(`Successfully sold all items.`);
                                    }
                                    else{
                                        message.reply(`Sellall failed. Your inventory was altered during the sale.`);
                                    }
                                });
                            }
                            else{
                                botMessage.delete();
                            }
                        }).catch(collected => {
                            botMessage.delete();
                            message.reply("You didn't react in time!");
                        });
                    });
                }
            });
        });
    }
    sell(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
                let args = message.content.split(" ").slice(1);
                let sellItem = args[0];
                sellItem = methods.getCorrectedItemInfo(sellItem, false, false);
                let sellAmount = args[1];

                if(itemdata[sellItem] !== undefined){
                    let itemPrice = itemdata[sellItem].sell;
                    
                    if(itemPrice !== ""){
                        if(sellAmount == undefined || !Number.isInteger(parseInt(sellAmount)) || sellAmount % 1 !== 0 || sellAmount < 1){
                            sellAmount = 1;
                        }
                        else if(sellAmount > 30){
                            sellAmount = 30;
                        }
                        message.delete();
                        message.reply("Sell " + sellAmount + "x `" + sellItem + "` for " + methods.formatMoney(itemPrice * sellAmount) + "?").then(botMessage => {
                            botMessage.react('✅').then(() => botMessage.react('❌'));
                            const filter = (reaction, user) => {
                                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                            };
                            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                            .then(collected => {
                                const reaction = collected.first();

                                if(reaction.emoji.name === '✅'){
                                    botMessage.delete();
                                    methods.hasitems(sql, message.author.id, sellItem, sellAmount).then(hasitem => {
                                        if(hasitem){
                                            methods.addmoney(sql, message.author.id, parseInt(itemPrice * sellAmount));
                                            methods.removeitem(sql, message.author.id, sellItem, sellAmount);
                                            message.reply("Successfully sold " + sellAmount + "x " + sellItem + " for " + methods.formatMoney(itemPrice * sellAmount) + ".");
                                        }
                                        else{
                                            message.reply("You don't have enough of that item!");
                                        }
                                    });
                                }
                                else{
                                    botMessage.delete();
                                }
                            }).catch(collected => {
                                botMessage.delete();
                                message.reply("You didn't react in time!");
                            });
                        });
                    }
                    else{
                        message.reply("You can't sell that item!");
                    }
                }
                else if(sellItem.startsWith("common") || sellItem.startsWith("uncommon") || sellItem.startsWith("rare") || sellItem.startsWith("epic") || sellItem.startsWith("legendary")){
                    message.reply("Use the `"+prefix+"sellall` command to sell all items of the same rarity.");
                    return;
                }
                else{
                    message.reply("You need to enter a valid item to sell! `"+prefix+"sell <item> <amount>`");
                }
            });
        });
    }
    shop(message, sql, prefix){
        sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            var shopItem = methods.getitems("all",{});
            for (var i = 0; i < shopItem.length; i++) {
                let rarity = itemdata[shopItem[i]].rarity;
                //let rarityCode = rarity == "Common" ? 1 : rarity == "Uncommon" ? 2 : rarity == "Rare" ? 3 : rarity == "Epic" ? 4 : rarity == "Legendary" ? 5 : rarity == "Ultra" ? 6 : 7;
                let rarityCode = itemdata[shopItem[i]].shopOrderCode;

                if(itemdata[shopItem[i]].buy !== ""){
                    shopItem[i] = [itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "📥 " + methods.formatMoney(itemdata[shopItem[i]].buy.amount) + " ", "📤 " + methods.formatMoney(itemdata[shopItem[i]].sell), rarityCode];
                }
                else if(itemdata[shopItem[i]].sell !== ""){
                    shopItem[i] = [itemdata[shopItem[i]].icon + "`" + shopItem[i] + "`", "","📤 "+methods.formatMoney(itemdata[shopItem[i]].sell), rarityCode];
                }
                else{
                    shopItem.splice(i,1);
                }
            }

            shopItem.sort(function(a,b) {
                if(a[3] < b[3]) return -1;//3 index is rarity

                else if(a[3] > b[3]) return 1;

                else if(a[3] == b[3]){//if rarityCode is the same, we compare names

                    if(a[0] < b[0]) return -1; //0 index is item name

                    else if(a[0] > b[0]) return 1;
                    
                    return 0;
                }
                return 0;
            });
            let pageNum = 0;
            let itemFilteredItems = [];
            let maxPage = Math.ceil(shopItem.length/8);

            //get home page method for shop
            methods.getHomePage(sql).then(homePage => {

                message.channel.send(homePage).then(botMessage => {
                    botMessage.react('◀').then(() => botMessage.react('▶')).then(() => botMessage.react('❌'));
                    return botMessage;
                }).then((collectorMsg) => { 
                    const collector = collectorMsg.createReactionCollector((reaction, user) => user.id === message.author.id && reaction.emoji.name === "◀" || user.id === message.author.id && reaction.emoji.name === "▶" || user.id === message.author.id && reaction.emoji.name === "❌");
                    setTimeout(() => {          //STOPS COLLECTING AFTER 2 MINUTES TO REDUCE MEMORY USAGE
                        collector.stop();
                    }, 120000);
                    collector.on("collect", reaction => {
                        const chosen = reaction.emoji.name;
                        if(chosen === "◀"){
                            if(pageNum > 1){
                                pageNum -= 1;
                                editEmbed();
                            }
                            else if(pageNum == 1){
                                pageNum = 0;
                                collectorMsg.edit(homePage);
                            }
                            reaction.remove(message.author.id);
                            //previous page
                        }else if(chosen === "▶"){
                            if(pageNum < maxPage){
                                pageNum += 1;
                                editEmbed();
                            }
                            reaction.remove(message.author.id);
                            // Next page
                        }else if(chosen === "❌"){
                            // Stop navigating pages
                            collectorMsg.delete();
                        }
                        function editEmbed(){
                            itemFilteredItems = [];
                            let indexFirst = (8 * pageNum) - 8;
                            let indexLast = (8 * pageNum) - 1;
                            const newEmbed = new Discord.RichEmbed({
                                footer: {
                                    text: `Page ${pageNum}/${maxPage}`
                                },
                                color: 0
                            });
                            newEmbed.setTitle(`**ITEM SHOP**`)
                            newEmbed.setDescription("📥 Buy 📤 Sell\nUse `buy (ITEM)` to purchase and `sell (ITEM)` to sell items.")
                            newEmbed.setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/497356681139847168/thanbotShopIcon.png")
                            shopItem.forEach(function (itemVar) {
                                try{
                                    if(shopItem.indexOf(itemVar) >= indexFirst && shopItem.indexOf(itemVar) <= indexLast){
                                        itemFilteredItems.push(itemVar);
                                        newEmbed.addField(itemVar[0], itemVar[1] + itemVar[2], true);
                                    }
                                }
                                catch(err){
                                }
                            });
                            collectorMsg.edit(newEmbed);
                        }
                    });
                    collector.on("end", reaction => {
                    });
                });
            });
        });
    }

    trade(message, sql, prefix){    //updated 3.8 multi-item trades
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if(!row) return message.reply("You don't have an account. Use " + prefix + "play to make one!");
            sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                let args = message.content.split(" ").slice(1);
                let userOldID = args[0];                          //RETURNS ID WITH <@ OR <@!
                if(userOldID == undefined){
                    message.reply("Command takes `"+prefix+"trade <@user>`");
                }
                else if(!userOldID.startsWith("<@")){                     //CHECKING FOR ERRORS IN MENTION
                    return message.reply('You need to mention someone! `'+prefix+'trade <@user>`');
                }
                else{           //check the mention further
                    var userNameID = args[0].replace(/[<@!>]/g, '');  //RETURNS BASE ID WITHOUT <@ OR <@! BUT ONLY IF PLAYER MENTIONED SOMEONE
                    sql.get(`SELECT * FROM items WHERE userId ="${userNameID}"`).then(victimItemRow => {
                    sql.get(`SELECT * FROM scores WHERE userId ="${userNameID}"`).then(victimRow => {
                    sql.get(`SELECT * FROM userGuilds WHERE userId ="${userNameID}" AND guildId = "${message.guild.id}"`).then(playRow => {
                        if(userNameID === client.user.id){        //CHECK IF PLAYER TRADES BOT
                            return message.reply(`I respectfully DECLINE`);
                        }
                        else if(message.author.id === userNameID){
                            return message.reply("You can't trade with yourself!");
                        }
                        else if(!victimItemRow){                                 //MAKE SURE TARGET HAS AN ACCOUNT BY CHECKING FOR THEIR ID IN ITEMS TABLE
                            return message.reply(`The person you're trying to trade doesn't have an account!`);
                        }
                        else if(!playRow){
                            return message.reply(`This user has not activated their account in this server!`);
                        }
                        else if(peckCooldown.has(userNameID)){
                            return message.reply("The person you're trying to trade is under the effects of `peck_seed`");
                        }
                        else{ //BEGIN TRADE
                            message.channel.send(userOldID + ", " + message.member.displayName + " would like to trade with you!").then(botMessage => {
                                botMessage.react('✅').then(() => botMessage.react('❌'));
                                const filter = (reaction, user) => {
                                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === userNameID;
                                };
                                botMessage.awaitReactions(filter, {max: 1, time: 30000, errors: ['time'] })
                                .then(collected => {
                                    const reaction = collected.first();
    
                                    if(reaction.emoji.name === '✅'){//trades accepted
                                        botMessage.delete();
                                        const tradeWindow = new Discord.RichEmbed()
                                        .setTitle("**🔃Trade window**")
                                        .setColor(2713128)
                                        .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/500519995277574145/thanbox_emptysmall.png")
                                        .addField("🔵"+message.member.displayName + "'s MONEY", "$0",true)
                                        .addField("🔴"+message.guild.members.get(userNameID).displayName + "'s MONEY", "$0",true)
                                        .addField("🔵"+message.member.displayName + "'s items", "no items", true)
                                        .addField("🔴"+message.guild.members.get(userNameID).displayName + "'s items", "no items",true)
                                        .setFooter("Commands : "+prefix+"add <item> <amount> | "+prefix+"addmoney <amount> | "+prefix+"accept | "+prefix+"cancel")
                                        message.channel.send(tradeWindow);

                                        const collector = new Discord.MessageCollector(message.channel, m => m.author.id == message.author.id || m.author.id == userNameID, { time: 300000 });
                                        let player1money = 0; //this is message.author.id ie. the person who started trade
                                        let player2money = 0; //this is person asked to trade with (usernameID)
                                        
                                        let player1items = [];
                                        let player1itemsAmounts = [];
                                        let player1display = [];
                                        let player2items = [];
                                        let player2itemsAmounts = [];
                                        let player2display = [];

                                        let isPlayer1 = 0; //0 means trade was cancelled, 1 means player1 accepted, 2 means player2 accepted
                                        
                                        function activeWindow(option, tradeCode = '1000'){
                                            if(option == 1){
                                                const activeWindow = new Discord.RichEmbed()
                                                .setTitle(tradeCode == '1000' ? "**🔃Trade log**" : "**❌Trade incompleted** `" + tradeCode + "`")
                                                .setDescription(message.guild.members.get(userNameID).user.username + " ID : " + userNameID + " TRADED WITH\n" + message.author.username + " ID : " + message.author.id)
                                                .setColor(tradeCode == '1000' ? 2713128 : 1)
                                                .setThumbnail(tradeCode == '1000' ? "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/white-heavy-check-mark_2705.png" : "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/microsoft/153/cross-mark_274c.png")
                                                .addField(message.author.username + "'s MONEY", "$" + player1money,true)
                                                .addField(message.guild.members.get(userNameID).user.username + "'s MONEY", "$" + player2money,true)
                                                .setFooter("Keep an eye on users that trade high-value for low-value")
                                                if(player1items.length > 0){
                                                    activeWindow.addField(message.author.username + "'s items",player1display.join("\n"), true);
                                                }
                                                else{
                                                    activeWindow.addField(message.author.username + "'s items","no items", true);
                                                }
                                                if(player2items.length > 0){
                                                    activeWindow.addField(message.guild.members.get(userNameID).user.username + "'s items", player2display.join("\n"), true);
                                                }
                                                else{
                                                    activeWindow.addField(message.guild.members.get(userNameID).user.username + "'s items", "no items", true);
                                                }
                                                //VVV TRADE CODE HANDLING VVV
                                                var errorCodes = {
                                                    _0001: message.author.username + " didn't have enough space in their inventory.",
                                                    _0002: message.guild.members.get(userNameID).user.username +" didn't have enough space in their inventory.",
                                                    _0003: message.guild.members.get(userNameID).user.username +" didn't have enough money.",
                                                    _0004: message.author.username +" didn't have enough money.",
                                                    _0005: message.guild.members.get(userNameID).user.username +" didn't have the items they originally wanted to trade.",
                                                    _0006: message.author.username +" didn't have the items they originally wanted to trade.",
                                                }
                                                if(tradeCode !== '1000'){
                                                    activeWindow.setFooter(tradeCode + " => " + errorCodes["_" + tradeCode]);
                                                }
                                                
                                                client.guilds.get("454163538055790604").channels.get(config.logChannel).send(activeWindow);
                                            }
                                            else{
                                                const activeWindow = new Discord.RichEmbed()
                                                .setTitle("**🔃Trade window**")
                                                .setColor(2713128)
                                                .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/500519995277574145/thanbox_emptysmall.png")
                                                .addField("🔵"+message.member.displayName + "'s MONEY", methods.formatMoney(player1money),true)
                                                .addField("🔴"+message.guild.members.get(userNameID).displayName + "'s MONEY", methods.formatMoney(player2money),true)
                                                .setFooter("Commands : "+prefix+"add <item> <amount> | "+prefix+"remove <item> | "+prefix+"addmoney <amount> | "+prefix+"accept | "+prefix+"cancel")
                                                if(player1items.length > 0){
                                                    activeWindow.addField("🔵"+message.member.displayName + "'s items",player1display.join("\n"), true);
                                                }
                                                else{
                                                    activeWindow.addField("🔵"+message.member.displayName + "'s items","no items", true)
                                                }
                                                if(player2items.length > 0){
                                                    activeWindow.addField("🔴"+message.guild.members.get(userNameID).displayName + "'s items", player2display.join("\n"), true);
                                                }
                                                else{
                                                    activeWindow.addField("🔴"+message.guild.members.get(userNameID).displayName + "'s items", "no items", true)
                                                }
                                                message.channel.send(activeWindow);
                                            }
                                        }
                                        collector.on("collect", response => {
                                            if(response.content.startsWith(prefix + "cancel")){
                                                message.channel.send("Trade has been cancelled.");
                                                collector.stop();
                                            }
                                            else if(response.content.startsWith(prefix + "accept")){
                                                if(response.member.id == message.author.id){
                                                    isPlayer1 = 1;
                                                }
                                                else{
                                                    isPlayer1 = 2;
                                                }
                                                collector.stop();
                                            }
                                            else if(response.content.startsWith(prefix + "addmoney")){
                                                let args = response.content.split(" ").slice(1);
                                                let tradeAmount = args[0];
                                                if(tradeAmount % 1 !== 0 || tradeAmount <= 0){
                                                    response.reply("You need to put an amount! `"+prefix+"addmoney <amount>`");
                                                }
                                                else{
                                                    if(response.member.id == message.author.id){
                                                        player1money += parseInt(tradeAmount);
                                                        methods.hasmoney(sql, response.member.id, player1money).then(result => {
                                                            console.log(result);
                                                            if(!result){
                                                                response.reply("You don't have enough money!");
                                                                player1money -= parseInt(tradeAmount);
                                                            }
                                                            activeWindow();
                                                        });
                                                    }
                                                    else{
                                                        player2money += parseInt(tradeAmount);
                                                        methods.hasmoney(sql, response.member.id, player2money).then(result => {
                                                            if(!result){
                                                                response.reply("You don't have enough money!");
                                                                player2money -= parseInt(tradeAmount);
                                                            }
                                                            activeWindow();
                                                        });
                                                    }
                                                }
                                            }
                                            else if(response.content.startsWith(prefix+ "remove")){
                                                let args = response.content.split(" ").slice(1);
                                                let removeThis = args[0];
                                                removeThis = methods.getCorrectedItemInfo(removeThis, false, false);
                                                if(itemdata[removeThis] == undefined){
                                                    if(removeThis == "money"){
                                                        if(response.member.id == message.author.id){
                                                            player1money = 0;
                                                            response.reply("Money removed.");
                                                        }
                                                        else{
                                                            player2money = 0;
                                                            response.reply("Money removed.");
                                                        }
                                                        activeWindow();
                                                    }
                                                    else response.reply("That item doesn't exist!");
                                                }
                                                else{
                                                    if(response.member.id == message.author.id){
                                                        if(player1items.includes(removeThis)){
                                                            for(var i = 0; i < player1items.length; i++){
                                                                if(player1items[i] == removeThis){
                                                                    //remove item
                                                                    player1items.splice(i, 1);
                                                                    player1display.splice(i, 1);
                                                                    player1itemsAmounts.splice(i, 1);
                                                                    response.reply("Item `"+removeThis+"` removed.");
                                                                    activeWindow();
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        else response.reply("That item isn't in the trade.");
                                                    }
                                                    else{
                                                        if(player2items.includes(removeThis)){
                                                            for(var i = 0; i < player2items.length; i++){
                                                                if(player2items[i] == removeThis){
                                                                    //remove item
                                                                    player2items.splice(i, 1);
                                                                    player2display.splice(i, 1);
                                                                    player2itemsAmounts.splice(i, 1);
                                                                    response.reply("Item `"+removeThis+"` removed.");
                                                                    activeWindow();
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        else response.reply("That item isn't in the trade.");
                                                    }
                                                }
                                            }
                                            else if(response.content.startsWith(prefix+"add")){
                                                let args = response.content.split(" ").slice(1);
                                                let itemName = args[0];
                                                let itemAmount = args[1];
                                                itemName = methods.getCorrectedItemInfo(itemName, false, false);
                                                if(itemdata[itemName] == undefined){
                                                    response.reply("That item doesn't exist!");
                                                }
                                                else if(!itemdata[itemName].canBeStolen){
                                                    response.reply("You can't trade that item!");
                                                }
                                                else{
                                                    if(itemAmount == undefined || !Number.isInteger(parseInt(itemAmount)) || itemAmount % 1 !== 0 || itemAmount < 1){
                                                        itemAmount = 1;
                                                    }
                                                    if(response.member.id == message.author.id){
                                                        if(player1items.includes(itemName)){
                                                            response.reply("You already have that item in the trade.");
                                                            // USE REMOVE COMMAND INSTEAD OF THIS
                                                        }
                                                        else{
                                                            methods.hasitems(sql, response.member.id, itemName, itemAmount).then(result => {
                                                                if(result){
                                                                    player1items.push(itemName);
                                                                    player1itemsAmounts.push(itemName+"|"+itemAmount);
                                                                    player1display.push(itemName+"("+itemAmount+"x)");
                                                                }
                                                                else response.reply("You don't have enough of that item.");
                                                                activeWindow();
                                                            });
                                                        }
                                                        /*
                                                        if(player1items.includes(itemName)){
                                                            response.reply("You can only trade one of each item at a time!");
                                                        }
                                                        else{
                                                            player1items.push(itemName);
                                                            if(eval(`!itemRow.${itemName}`)){
                                                                response.reply("You don't have that item!");
                                                                player1items.pop();
                                                            }
                                                            activeWindow();
                                                        }
                                                        */
                                                    }
                                                    else{
                                                        if(player2items.includes(itemName)){
                                                            response.reply("You already have that item in the trade.");
                                                        }
                                                        else{
                                                            methods.hasitems(sql, response.member.id, itemName, itemAmount).then(result => {
                                                                if(result){
                                                                    player2items.push(itemName);
                                                                    player2itemsAmounts.push(itemName+"|"+itemAmount);
                                                                    player2display.push(itemName+"("+itemAmount+"x)");
                                                                }
                                                                else response.reply("You don't have enough of that item.");
                                                                activeWindow();
                                                            });  
                                                        }
                                                    }
                                                }
                                            }
                                        });
                                        collector.on("end", response => {
                                            function swapItems(){
                                                return methods.hasenoughspace(sql, message.author.id, methods.getTotalItmCountFromList(player2itemsAmounts) - methods.getTotalItmCountFromList(player1itemsAmounts)).then(messageAuthorHasEnough => {
                                                    if(messageAuthorHasEnough){
                                                        return methods.hasenoughspace(sql, userNameID, methods.getTotalItmCountFromList(player1itemsAmounts) - methods.getTotalItmCountFromList(player2itemsAmounts)).then(player2HasEnough => {
                                                            if(player2HasEnough){
                                                                return methods.hasmoney(sql, userNameID, player2money).then(result => {
                                                                    //give player2money to player1
                                                                    if(result){
                                                                        return methods.hasmoney(sql, message.author.id, player1money).then(result => {
                                                                            if(result){
                                                                                return methods.hasitems(sql, userNameID, player2itemsAmounts).then(result => {
                                                                                    if(result){
                                                                                        return methods.hasitems(sql, message.author.id, player1itemsAmounts).then(result => {
                                                                                            if(result){
                                                                                                //finally trade items
                                                                                                /*
                                                                                                methods.addmoney(sql, message.author.id, player2money);
                                                                                                methods.addmoney(sql, userNameID, player1money);
                                                                                                methods.removemoney(sql, userNameID, player2money);
                                                                                                methods.removemoney(sql, message.author.id, player1money);
                                                                                                */
                                                                                                methods.trademoney(sql, message.author.id, player1money, userNameID, player2money);
                
                                                                                                methods.additem(sql, message.author.id, player2itemsAmounts);
                                                                                                methods.removeitem(sql, userNameID, player2itemsAmounts);
                                                                                                methods.additem(sql, userNameID, player1itemsAmounts);
                                                                                                methods.removeitem(sql, message.author.id, player1itemsAmounts);
                                                                                                message.channel.send("✅ Trade completed!");
                                                                                                return '1000';
                                                                                            }
                                                                                            else message.channel.send("❌Trade could not be complete! `0006`")//player1 didnt have the items they wanted to trade
                                                                                            return '0006';
                                                                                        });
                                                                                    }
                                                                                    else message.channel.send("❌Trade could not be completed! `0005`")//player2 didnt have the items they wanted to trade
                                                                                    return '0005';
                                                                                });
                                                                            }
                                                                            else message.channel.send("❌Trade could not be completed! `0004`")//player1 didn't have enough money
                                                                            return '0004';
                                                                        });
                                                                    }
                                                                    else message.channel.send("❌Trade could not be completed! `0003`")//player2 didn't have enough money
                                                                    return '0003';
                                                                });
                                                            }
                                                            else message.channel.send("❌" + message.guild.members.get(userNameID).displayName + " doesn't have enough space in their inventory to complete this trade!");
                                                            return '0002';
                                                        });
                                                    }
                                                    else message.channel.send("❌" + message.member.displayName + " doesn't have enough space in their inventory to complete this trade!");
                                                    return '0001';
                                                });
                                            }
                                            let playerGiveTotal = player1money - player2money;
                                            if(isPlayer1 === 1){
                                                message.channel.send(userOldID + ", " + message.member.displayName + " has accepted the trade! Do you accept?").then(botMessage => {
                                                    botMessage.react('✅').then(() => botMessage.react('❌'));
                                                    const filter = (reaction, user) => {
                                                        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === userNameID;
                                                    };
                                                    botMessage.awaitReactions(filter, {max: 1, time: 25000, errors: ['time'] })
                                                    .then(collected => {
                                                        const reaction = collected.first();
                        
                                                        if(reaction.emoji.name === '✅'){
                                                            botMessage.delete();
                                                            swapItems().then(tradeCode => {
                                                                activeWindow(1, tradeCode); //sends log to mods
                                                            }); //verifies users have items before completing trade.
                                                        }
                                                        else{
                                                            botMessage.delete();
                                                            message.channel.send(userOldID + " declined.");
                                                        }
                                                    }).catch(collected => {
                                                        console.error();
                                                        botMessage.delete();
                                                        message.reply("They didn't react in time!");
                                                    });
                                                });
                                            }
                                            else if(isPlayer1 === 2){
                                                message.channel.send(message.author + ", " + message.guild.members.get(userNameID).displayName + " has accepted the trade! Do you accept?").then(botMessage => {
                                                    botMessage.react('✅').then(() => botMessage.react('❌'));
                                                    const filter = (reaction, user) => {
                                                        return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                                                    };
                                                    botMessage.awaitReactions(filter, {max: 1, time: 25000, errors: ['time'] })
                                                    .then(collected => {
                                                        const reaction = collected.first();
                        
                                                        if(reaction.emoji.name === '✅'){
                                                            botMessage.delete();
                                                            swapItems().then(tradeCode => {
                                                                activeWindow(1, tradeCode); //sends log to mods
                                                            });
                                                        }
                                                        else{
                                                            botMessage.delete();
                                                            message.channel.send(message.author + " declined.");
                                                        }
                                                    }).catch(collected => {
                                                        console.log(collected);
                                                        botMessage.delete();
                                                        message.channel.send(userOldID+", They didn't react in time!");
                                                    });
                                                });
                                            }
                                        });
                                    }
                                    else{
                                        botMessage.delete();
                                    }
                                }).catch(collected => {
                                    botMessage.delete();
                                    message.reply("They didn't react in time!");
                                });
                            });
                        }
                    });
                    });
                    });
                }
            });
        });
    }

    backpack(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            methods.getitemcount(sql, message.author.id).then(itemCt => {
                if(row.backpack !== "none"){
                    message.reply("\n**Backpack equipped:** `" + row.backpack + "`\n**Inventory space:** `" + itemCt.capacity + "` (base 10 ***+"+itemdata[row.backpack].inv_slots+"***)\nIncrease space by equipping a better backpack!");
                }
                else{
                    message.reply("\n**Backpack equipped:** `" + row.backpack + "`\n**Inventory space:** `" + itemCt.capacity + "`\nIncrease space by equipping a better backpack!");
                }
            });
        });
    }
    equipitem(message, sql, prefix){
        sql.get(`SELECT * FROM items i
        JOIN scores s
        ON i.userId = s.userId
        WHERE s.userId="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            let args = message.content.split(" ").slice(1);
            let equipitem = args[0];
            equipitem = methods.getCorrectedItemInfo(equipitem, false, false);
            if(equipitem !== undefined){
                if(itemdata[equipitem] !== undefined && itemdata[equipitem].equippable == "true"){
                    methods.hasitems(sql, message.author.id, equipitem, 1).then(haspack => {
                        if(haspack){
                            if(row.backpack == "none" && itemdata[equipitem].type == "backpack"){
                                sql.run(`UPDATE scores SET backpack = '${equipitem}' WHERE userId = ${message.author.id}`);
                                sql.run(`UPDATE scores SET inv_slots = ${10 + itemdata[equipitem].inv_slots} WHERE userId = ${message.author.id}`);
                                sql.run(`UPDATE items SET ${equipitem} = ${row[equipitem] - 1} WHERE userId = ${message.author.id}`);
                                methods.getitemcount(sql, message.author.id).then(itemCt => {
                                    message.reply("Successfully equipped `" + equipitem + "` and gained **" + itemdata[equipitem].inv_slots + "** item slots. (" + (itemdata[equipitem].inv_slots + 10) + " max)");
                                });
                            }
                            else if(row.armor == "none" && itemdata[equipitem].type == "armor"){
                                sql.run(`UPDATE scores SET armor = '${equipitem}' WHERE userId = ${message.author.id}`);
                                //add armor to sql table somewhere?
                                sql.run(`UPDATE items SET ${equipitem} = ${row[equipitem] - 1} WHERE userId = ${message.author.id}`);
                                message.reply("Successfully equipped `" + equipitem + "`.");
                            }
                            else{
                                message.reply("You already have something equipped! Unequip it with `unequip <item/backpack/armor>`")
                            }
                        }
                        else{
                            message.reply("You don't have that item.");
                        }
                    });
                }
                else{
                    message.reply("That item cannot be equipped. Specify a backpack or armor to equip, `equip <item>`");
                }
            }
            else{
                message.reply("That item cannot be equipped. Specify a backpack or armor to equip, `equip <item>`");
            }
        });
    }
    unequipitem(message, sql, prefix){
        sql.get(`SELECT * FROM items i
        JOIN scores s
        ON i.userId = s.userId
        WHERE s.userId="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            let args = message.content.split(" ").slice(1);
            let equipitem = args[0];
            equipitem = methods.getCorrectedItemInfo(equipitem, false, false);

            if(row.backpack == equipitem || equipitem == "backpack"){
                if(row.backpack !== "none"){
                    sql.run(`UPDATE scores SET backpack = 'none' WHERE userId = ${message.author.id}`);
                    sql.run(`UPDATE scores SET inv_slots = ${10} WHERE userId = ${message.author.id}`);
                    sql.run(`UPDATE items SET ${row.backpack} = ${row[row.backpack] + 1} WHERE userId = ${message.author.id}`);
                    message.reply("Successfully unequipped `" + row.backpack + "`.\nYour carry capacity is now **10** items.");
                }
                else{
                    message.reply("You don't have a backpack equipped! Equip with `equip <item>`");
                }
            }

            else if(row.armor == equipitem || equipitem == "armor"){
                if(row.armor !== "none"){
                    sql.run(`UPDATE scores SET armor = 'none' WHERE userId = ${message.author.id}`);
                    sql.run(`UPDATE items SET ${row.armor} = ${row[row.armor] + 1} WHERE userId = ${message.author.id}`);
                    message.reply("Successfully unequipped `" + row.armor + "`.");
                }
                else{
                    message.reply("You don't have any armor equipped! Equip with `equip <item>`");
                }
            }

            else{
                message.reply("You don't have that item equipped. Specify your backpack or armor to unequip, `unequip <item>`");
            }
        });
    }
    
    //FREE ITEMS & GAMES
    trivia(message, sql, triviaQ, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(timeRow => {
            if (!timeRow) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            if(triviaUserCooldown.has(message.author.id)){
                message.reply("You need to wait  `" + ((triviaCdSeconds * 1000 - ((new Date()).getTime() - timeRow.triviaTime)) / 60000).toFixed(1) + " minutes`  before using this command again.");
                return;
            }
            else{
                triviaUserCooldown.add(message.author.id);
                sql.run(`UPDATE scores SET triviaTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                setTimeout(() => {
                    triviaUserCooldown.delete(message.author.id);
                    sql.run(`UPDATE scores SET triviaTime = ${0} WHERE userId = ${message.author.id}`);
                }, triviaCdSeconds * 1000);
                let chance = Math.floor(Math.random() * Object.keys(triviaQ).length); //returns value 0 between LENGTH OF JSON FILE (1 of 10)               |   JSON FILE HAS 547 QUESTIONS AVAILABLE

                let questionInfo = triviaQ[chance].question;
                let questionA = triviaQ[chance].A;
                let questionB = triviaQ[chance].B;
                let questionC = triviaQ[chance].C;
                let questionD = triviaQ[chance].D;

                const embedTrivia = new Discord.RichEmbed() 
                .setDescription(`**${questionInfo}**`)
                .setColor(16777215)
                .addField("A: ", questionA)
                .addField("B: ", questionB)
                .addField("C: ", questionC)
                .addField("D: ", questionD)
                .setFooter("You have 15 seconds to answer.")

                message.channel.send(embedTrivia).then(botMessage => {
                    botMessage.react('🇦').then(() => botMessage.react('🇧')).then(() => botMessage.react('🇨')).then(() => botMessage.react('🇩'));
                    const filter = (reaction, user) => {
                        return ['🇦', '🇧','🇨','🇩'].includes(reaction.emoji.name) && user.id === message.author.id;
                    };
                    botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                    .then(collected => {
                        const reaction = collected.first();

                        function triviaReward(){
                            sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                                let chanceR = Math.floor(Math.random() * 10); //returns 0-9 (10% chance)
                                
                                let rewardItem = "";
                                methods.hasenoughspace(sql, message.author.id, 2).then(hasenough => {
                                    if (chanceR <= 0 && hasenough){
                                        rewardItem = "`ammo_box`";
                                        sql.run(`UPDATE items SET ammo_box = ${itemRow.ammo_box + 1} WHERE userId = ${message.author.id}`);
                                    }
                                    else if (chanceR >= 5 && hasenough){
                                        rewardItem = "2x `item_box`";
                                        sql.run(`UPDATE items SET item_box = ${itemRow.item_box + 2} WHERE userId = ${message.author.id}`);
                                    }
                                    else{//40% chance
                                        rewardItem = "`$1000`";
                                        sql.run(`UPDATE scores SET money = ${timeRow.money + 1000} WHERE userId = ${message.author.id}`);
                                    }
                                    const embedReward = new Discord.RichEmbed() 
                                    .setDescription(`**${eval(`triviaQ[chance].` + triviaQ[chance].answer).toUpperCase()} IS CORRECT**`)
                                    .setColor(720640)
                                    .addField("Reward", rewardItem)
                                    botMessage.edit(embedReward);
                                });
                            });
                        }

                        if(reaction.emoji.name === '🇦' && triviaQ[chance].answer == "A"){
                            //botMessage.delete();
                            triviaReward();
                        }
                        else if(reaction.emoji.name === '🇧' && triviaQ[chance].answer == "B"){
                            
                            triviaReward();
                        }
                        else if(reaction.emoji.name === '🇨' && triviaQ[chance].answer == "C"){
                            
                            triviaReward();
                        }
                        else if(reaction.emoji.name === '🇩' && triviaQ[chance].answer == "D"){
                            
                            triviaReward();
                        }
                        else{
                            //botMessage.delete();
                            //message.reply("You got it wrong...");
                            const embedWrong = new Discord.RichEmbed() 
                            .setDescription(`**INCORRECT**`)
                            .setColor(13632027)
                            .addField("Reward", "`shame`")
                            botMessage.edit(embedWrong);
                        }
                        //triviaCooldown = 1;
                    }).catch(collected => {
                        botMessage.delete();
                        message.reply("You didn't pick in time!");
                        //triviaCooldown = 1;
                    });
                });
            }
        });
    }
    scramble(message, sql, scrambleQ, prefix){
        sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            else if(scrambleCooldown.has(message.author.id)){
                sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(timeRow => {
                message.reply("You need to wait  `" + ((scrambleCdSeconds * 1000 - ((new Date()).getTime() - timeRow.scrambleTime)) / 60000).toFixed(1) + " minutes`  before using this command again.");
                });
                return;
            }
            else{
                let args = message.content.split(" ").slice(1);
                let option = args[0];
                let scrambleJSONlength = Object.keys(scrambleQ).length
                let chance = Math.floor(Math.random() * scrambleJSONlength); //returns value 0 between 32 (1 of 10)
                let scrambleWord = scrambleQ[chance].word;  //json data word to scramble
                let scrambleDifficulty = scrambleQ[chance].difficulty;
                let scrambleHint = scrambleQ[chance].hint;
                let finalWord = scrambleWord.toLowerCase(); //final word to check if user got correct
                let isHardMode = false;
                function shuffelWord(word) {
                    var shuffledWord = '';
                    word = word.split('');
                    while (word.length > 0) {
                      shuffledWord +=  word.splice(word.length * Math.random() << 0, 1);
                    }
                    return shuffledWord;
                }
                const embedScramble = new Discord.RichEmbed()
                .setTitle("**Difficulty : " + scrambleDifficulty+"**")
                .setFooter("You have 30 seconds to unscramble this word.")
                if(!option){
                    message.reply("You need to choose a difficulty `"+prefix+"scramble easy/hard`\nEasy : Hint but less reward\nHard : Better reward, no hint");
                    return;
                }
                else if(option.toLowerCase() == "easy"){
                    embedScramble.setDescription("**Hint : `" + scrambleHint + "`**\nWord : ```" + (shuffelWord(scrambleWord))+"```");
                }
                else if(option.toLowerCase() == "hard"){
                    embedScramble.setDescription("Word : ```" + shuffelWord(scrambleWord.toLowerCase())+"```");
                    isHardMode = true;
                }
                else{
                    message.reply("You need to choose a difficulty `"+prefix+"scramble easy/hard`\nEasy : Hint but less reward\nHard : Better reward, no hint");
                    return;
                }
                if(scrambleDifficulty == "hard"){
                    embedScramble.setColor(16734296);
                }
                else if(scrambleDifficulty == "medium"){
                    embedScramble.setColor(15531864);
                }
                else{
                    embedScramble.setColor(9043800);
                }

                message.channel.send(message.author, embedScramble);
                scrambleCooldown.add(message.author.id);
                sql.run(`UPDATE scores SET scrambleTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                setTimeout(() => {
                    scrambleCooldown.delete(message.author.id);
                    sql.run(`UPDATE scores SET scrambleTime = ${0} WHERE userId = ${message.author.id}`);
                }, scrambleCdSeconds * 1000);

                const collector = new Discord.MessageCollector(message.channel, m => m.author.id == message.author.id, { time: 30000 });
                let correct = false;
                let attempts = 0;
                collector.on("collect", response => {
                    attempts+=1;
                    if(response.content.toLowerCase() == finalWord){
                        sql.get(`SELECT * FROM items i
                        JOIN scores s
                        ON i.userId = s.userId
                        WHERE s.userId="${message.author.id}"`).then(row => {
                            correct = true;
                            let rewardItem = "";
                            if(isHardMode){
                                if(scrambleDifficulty =="hard"){
                                    methods.hasenoughspace(sql, message.author.id, 1).then(hasenough => {
                                        if((chance < scrambleJSONlength/4) && hasenough){
                                            rewardItem = "ultra_box";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE items SET ultra_box = ${row.ultra_box + 1} WHERE userId = ${message.author.id}`);
                                        }
                                        else{
                                            rewardItem = "$1700";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE scores SET money = ${row.money + 1700} WHERE userId = ${message.author.id}`);
                                        }
                                    });
                                }
                                else if(scrambleDifficulty == "medium"){
                                    methods.hasenoughspace(sql, message.author.id, 1).then(hasenough => {
                                        if((chance < scrambleJSONlength/3) && hasenough){
                                            rewardItem = "ammo_box";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE items SET ammo_box = ${row.ammo_box + 1} WHERE userId = ${message.author.id}`);
                                        }
                                        else{
                                            rewardItem = "$1100";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE scores SET money = ${row.money + 1100} WHERE userId = ${message.author.id}`);
                                        }
                                    });
                                }
                                else{
                                    methods.hasenoughspace(sql, message.author.id, 2).then(hasenough => {
                                        if((chance < scrambleJSONlength/3) && hasenough){
                                            rewardItem = "2x item_box";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE items SET item_box = ${row.item_box + 2} WHERE userId = ${message.author.id}`);
                                        }
                                        else{
                                            rewardItem = "$800";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE scores SET money = ${row.money + 800} WHERE userId = ${message.author.id}`);
                                        }
                                    });
                                }
                            }
                            else{
                                if(scrambleDifficulty =="hard"){
                                    methods.hasenoughspace(sql, message.author.id, 2).then(hasenough => {
                                        if((chance > scrambleJSONlength/2) && hasenough){
                                            rewardItem = "2x item_box";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE items SET item_box = ${row.item_box + 2} WHERE userId = ${message.author.id}`);
                                        }
                                        else{
                                            rewardItem = "$650";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE scores SET money = ${row.money + 650} WHERE userId = ${message.author.id}`);
                                        }
                                    });
                                }
                                else if(scrambleDifficulty == "medium"){
                                    methods.hasenoughspace(sql, message.author.id, 1).then(hasenough => {
                                        if((chance > scrambleJSONlength/2) && hasenough){
                                            rewardItem = "item_box";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE items SET item_box = ${row.item_box + 1} WHERE userId = ${message.author.id}`);
                                        }
                                        else{
                                            rewardItem = "$400";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE scores SET money = ${row.money + 400} WHERE userId = ${message.author.id}`);
                                        }
                                    });
                                }
                                else{
                                    methods.hasenoughspace(sql, message.author.id, 1).then(hasenough => {
                                        if(hasenough){
                                            rewardItem = "item_box";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE items SET item_box = ${row.item_box + 1} WHERE userId = ${message.author.id}`);
                                        }
                                        else{
                                            rewardItem = "$250";
                                            methods.scrambleWinMsg(message, rewardItem);
                                            sql.run(`UPDATE scores SET money = ${row.money + 250} WHERE userId = ${message.author.id}`);
                                        }
                                    });
                                }
                            }
                            collector.stop();
                        });
                    }
                });
                collector.on("end", collected => {
                    if(correct){
                        /*
                        const embedLog = new Discord.RichEmbed()
                        embedLog.setTitle("📝SCRAMBLE LOG CORRECT\n"+message.author.username+ " ID : " + message.author.id)
                        embedLog.setDescription("**Had a hint : `" + !isHardMode + "`**\nWord : ```" + scrambleWord+"```\nGuess attempts : `" + attempts + "`");
                        embedLog.setColor(9043800);
                        client.guilds.get("454163538055790604").channels.get("500467081226223646").send(embedLog);
                        return;
                        */
                    }
                    else{
                        const embedScramble = new Discord.RichEmbed()
                        .setTitle("**You didn't get it in time!**")
                        .setDescription("The word was : ```" + scrambleWord+"```")
                        .setColor(16734296);
                        message.channel.send(message.author, embedScramble);

                        /*
                        const embedLog = new Discord.RichEmbed()
                        embedLog.setTitle("📝SCRAMBLE LOG INCORRECT\n"+message.author.username+ " ID : " + message.author.id)
                        embedLog.setDescription("**Had a hint : `" + !isHardMode + "`**\nWord : ```" + scrambleWord+"```\nGuess attempts : `" + attempts + "`");
                        embedLog.setColor(16734296);
                        client.guilds.get("454163538055790604").channels.get("500467081226223646").send(embedLog);
                        */
                    }
                });
            }
        });
    }
    hourly(message, sql, prefix){
        sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(row => {
            sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(timeRow => {
                if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
                if(hourlyCooldown.has(message.author.id)){
                    message.reply("You need to wait  `" + ((hourlyCdSeconds * 1000 - ((new Date()).getTime() - timeRow.hourlyTime)) / 60000).toFixed(1) + " minutes`  before using this command again.");
                    return;
                }
                methods.hasenoughspace(sql, message.author.id, 1).then(hasenough => {
                    if(!hasenough) return message.reply("**You don't have enough space in your inventory!** You can clear up space by selling some items.");
                    let luck = timeRow.luck >= 40 ? 10 : Math.floor(timeRow.luck/4);
                    let chance = Math.floor(Math.random() * 100) + luck;
                    if(chance >= 100){
                        message.reply("🍀Here's a free `ultra_box`!");
                        sql.run(`UPDATE items SET ultra_box = ${row.ultra_box + 1} WHERE userId = ${message.author.id}`);
                    }
                    else{
                        message.reply("Here's a free `item_box`!");
                        sql.run(`UPDATE items SET item_box = ${row.item_box + 1} WHERE userId = ${message.author.id}`);
                    }
                    
                    sql.run(`UPDATE scores SET hourlyTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                    hourlyCooldown.add(message.author.id);
                });
            });
        });
        setTimeout(() => {
            hourlyCooldown.delete(message.author.id);
            sql.run(`UPDATE scores SET hourlyTime = ${0} WHERE userId = ${message.author.id}`);
        }, hourlyCdSeconds * 1000);
    }
    gamble(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
            let gambleTypes = ["slots","slot","roulette","coinflip","cf"]
            let args = message.content.split(" ").slice(1);
            let gambleType = args[0];
            let gambleAmount = args[1];
            if(gambleCooldown.has(message.author.id)){
                message.reply("Please wait `" + ((gambleCdSeconds * 1000 - ((new Date()).getTime() - row.gambleTime)) / 1000).toFixed(0) + " seconds` before gambling again.");
                return;
            }
            else if(!gambleTypes.includes(gambleType)){
                return message.reply("You must specify the way you want to gamble! `roulette`, `slots`, `coinflip`")
            }
            else if(gambleAmount !== undefined && gambleAmount >= 100){
                gambleAmount = Math.floor(gambleAmount);
                if(gambleAmount > row.money){
                    return message.reply("You don't have enough money!");
                }
                else if(gambleType == "slots" || gambleType == "slot"){
                    sql.run(`UPDATE scores SET money = ${row.money - gambleAmount} WHERE userId = ${message.author.id}`);
                    methods.slots(message, sql, message.author.id, gambleAmount);
                }
                else if(gambleType == "roulette"){
                    if(row.health < 25){
                        return message.reply("⚠ You need atleast **25 HP** to use the `roulette` command, you currently have **" + row.health + "/" + row.maxHealth + "**.");
                    }
                    sql.run(`UPDATE scores SET money = ${row.money - gambleAmount} WHERE userId = ${message.author.id}`);
                    methods.roulette(message, sql, message.author.id, gambleAmount);
                }
                else if(gambleType == "coinflip" || gambleType == "cf"){
                    methods.coinflip(message, sql, message.author.id, gambleAmount);
                }
                setTimeout(() => {
                    gambleCooldown.delete(message.author.id);
                    sql.run(`UPDATE scores SET gambleTime = ${0} WHERE userId = ${message.author.id}`);
                }, gambleCdSeconds * 1000);
                gambleCooldown.add(message.author.id);
                sql.run(`UPDATE scores SET gambleTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
            }
            else{
                //give user info on command
                if(gambleType == "slots" || gambleType == "slot"){
                    methods.commandhelp(message, "slots", prefix);
                }
                else if(gambleType == "roulette"){
                    methods.commandhelp(message, "roulette", prefix);
                }
                else if(gambleType == "coinflip" || gambleType == "cf"){
                    methods.commandhelp(message, "coinflip", prefix);
                }
            }
        });
    }
    vote(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            if(voteCooldown.has(message.author.id)){
                message.reply("Vote available in `" + (((voteCdSeconds * 1000 - ((new Date()).getTime() - row.voteTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours`!\n🎟Vote for the bot to collect a reward!\nhttps://discordbots.org/bot/493316754689359874/vote\nYou should receive a DM after you vote!");
            }
            else{
                message.reply("☑VOTE AVAILABLE\n🎟Vote for the bot to collect a reward!\nhttps://discordbots.org/bot/493316754689359874/vote\nYou should receive a DM after you vote!");
            }
        });
    }
    /*
    basket(message, sql, prefix){ //3.11 changed from unwrap to basket
        sql.get(`SELECT * FROM items i
        JOIN scores s
        ON i.userId = s.userId
        WHERE s.userId="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            if(eventCooldown.has(message.author.id)){
                message.reply("You need to wait  `" + (((voteCdSeconds * 1000 - ((new Date()).getTime() - row.prizeTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours` for your basket to refill!");
                return;
            }
            methods.hasenoughspace(sql, message.author.id, 1).then(hasSpace => {
                if(!hasSpace){
                    return message.reply("**You don't have enough space in your inventory!** You can clear up space by selling some items.\nNeed atleast 1 slot open for this command.");
                }
                else{
                    let chance = Math.floor(Math.random() * 100);
                    let eventItems = methods.getitems("Limited", {type: "unboxable"});
                    let rand = eventItems[Math.floor(Math.random() * eventItems.length)];
                    let display = itemdata[rand].icon + "`" +rand + "`";
                    
                    if(chance == 92){
                        rand = "tnt_egg";
                        display = "**A RARE **" + itemdata[rand].icon + "`" + rand + "`";
                    }
                    else if(chance == 93){
                        rand = "golden_egg";
                        display = "**A RARE **" + itemdata[rand].icon + "`" +rand + "`";
                    }
                    
                    sql.run(`UPDATE items SET ${rand} = ${row[rand] + 1} WHERE userId = ${message.author.id}`);
                    sql.run(`UPDATE items SET token = ${row.token + 1} WHERE userId = ${message.author.id}`);
                    message.reply("🎊 You look in the basket and find : \n" + display + " and a `token`!");
        
                    sql.run(`UPDATE scores SET prizeTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                    eventCooldown.add(message.author.id);
        
                    setTimeout(() => {
                        eventCooldown.delete(message.author.id);
                        sql.run(`UPDATE scores SET prizeTime = ${0} WHERE userId = ${message.author.id}`);
                    }, voteCdSeconds * 1000);
                }
            });
        });
    }
    */

    //GENERAL
    info(message, version){
        let used = process.memoryUsage().heapUsed / 1024 / 1024;
        const embedInfo = new Discord.RichEmbed()
        .setTitle(`<:update:264184209617321984>**Lootcord Update Info**`)
        .setColor(13215302)
        .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/529555281391386629/lc_icon.png")
        .setDescription(botInfo.info)
        .setImage()
        .addField("Users",(client.users.size - client.guilds.size),true)
        .addField("Active Servers",client.guilds.size, true)
        .addField("Version", "`" +version + "`", true)
        .addField("Memory Usage",(Math.round(used * 100)/100) + " MB",true)
        .addField("Website", "https://lootcord.com",true)
        .addField("Creators","blobfysh#4679\nOGSteve#0007",true)
        .setFooter("Need help? Message the bot! | PM's to Lootcord are sent directly to moderators.")
        message.channel.send(embedInfo);
    }
    help(message, prefix){ //add new commands
        let args = message.content.split(" ").slice(1);
        let helpCommand = args[0];
        if(helpCommand !== undefined){
            return methods.commandhelp(message, helpCommand, prefix);
        }
        let otherCmds = ["`rules`","`cooldowns`","`delete`","`deactivate`","`server`","`update`","`health`","`money`","`level`","`points`","`leaderboard`","`discord`","`upgrade`","`backpack`"];
        let utilities = ["`utility` -", "`setprefix`", "`setkillfeed`", "`setlevelchannel`", "`disablekillfeed`", "`disablelevelchannel`"];
        otherCmds.sort();
        const helpInfo = new Discord.RichEmbed()
        .setTitle("`"+prefix+"play`** - Adds you to the game.**")
        .addField("⚔Items", "🔸`"+prefix+"use <item> [@user]`- Attack users with weapons or use items on self.\n🔸`"+prefix+"inv [@user]` - Displays inventory.\n▫`"+prefix+"trade <@user>` - Trade items and money with user.\n▫`"+prefix+"item [item]`" +
        " - Lookup item information.\n▫`"+prefix+"shop` - Shows buy/sell values of all items.\n▫`"+prefix+"buy <item> [amount]` - Purchase an item.\n▫`"+prefix+"sell <item> [amount]` - Sell an item.\n▫`"+prefix+"sellall [rarity]` - Sell multiple or all items (ex. `"+prefix+"sellall common`)." +
        "\n▫`"+prefix+"craft <item>` - Craft Ultra items!\n▫`"+prefix+"recycle <item>` - Recycle Legendary+ items for components.\n▫`"+prefix+ "profile [@user]` - View profile and stats of user.\n▫`" +prefix+"equip/unequip <item>` - Equip a backpack or unequip it.")
        .addField("🎲Games/Free stuff", "▫`"+prefix+"scramble <easy/hard>` - Unscramble a random word for a prize!\n▫`"+prefix+"trivia` - Answer the questions right for a reward!\n▫`"+prefix+"hourly` - Claim a free item_box every hour.\n▫`"+prefix+"vote` - Vote for the bot every 12hrs to receive an `ultra_box`\n▫`"+prefix+"gamble <type> <amount>` - Gamble your money away!")
        //.addField("🔰Stats", ,true)
        .addField("⚙Utility", utilities.join(" "),true)
        .addField("📈Other", otherCmds.join(" "),true)
        .setColor(13215302)
        .setFooter("To see more about a command, use "+prefix+"help <command> | Need more help? Message me!")
        message.channel.send(helpInfo);
    }
    rules(message){
        const ruleInfo = new Discord.RichEmbed()
        .setTitle("Official Lootcord Bot Rules")
        .setDescription(`1. **Do NOT exploit bugs.** Bugs, if found, should be reported to the moderators so we can remove it. You can send a message to the bot through DMs and it will be sent to the moderators. If found to be exploiting bugs, your account data will be reset.\n
        2. **Do not use alt or "puppet" accounts.** The use of secondary accounts operated by you to avoid cooldowns, hoard weapons to avoid loss upon death, organize attacks on a target, farm boxes or in any other way considered unfair to others will result in a warning or in later offenses punishment.\n
        3. **Do not leave servers after attacking someone to deactivate your account and avoid counterattacks.** This is known as cooldown dodging, and is automatically reported to moderators on offense.\n
        4. **No kill-farming.** Killing someone then trading items back to the other person in order to gain kill count without consequences.`)
        .setColor(13215302)
        .setFooter("Rules subject to change.")
        message.channel.send(ruleInfo);
    }
    upgrade(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            let args = message.content.split(" ").slice(1);
            let upgrOpt = args[0] !== undefined ? args[0].toLowerCase() : "";
            if(row.stats > 0 && upgrOpt == "health" || row.stats > 0 && upgrOpt == "vitality" || row.stats > 0 && upgrOpt == "strength" || row.stats > 0 && upgrOpt == "luck"){
                if(upgrOpt == "health" || upgrOpt == "vitality"){
                    //upgrade hp
                    sql.run(`UPDATE scores SET maxHealth = ${row.maxHealth + 5} WHERE userId = "${message.author.id}"`);
                    sql.run(`UPDATE scores SET stats = ${row.stats - 1} WHERE userId = "${message.author.id}"`);
                    sql.run(`UPDATE scores SET used_stats = ${row.used_stats + 1} WHERE userId = "${message.author.id}"`);
                    const skillEmbed = new Discord.RichEmbed()
                    .setColor(14634070)
                    .setAuthor(message.member.displayName, message.author.avatarURL)
                    .setTitle("Successfully allocated 1 point to 💗 Vitality!")
                    .setDescription("You now have " + (row.maxHealth + 5) + " max health.")
                    .setFooter((row.stats - 1) + " skill points remaining.")
                    message.channel.send(skillEmbed);
                    return;
                }
                else if(upgrOpt == "strength"){
                    sql.run(`UPDATE scores SET scaledDamage = ${(row.scaledDamage + 0.03).toFixed(2)} WHERE userId = "${message.author.id}"`);
                    sql.run(`UPDATE scores SET stats = ${row.stats - 1} WHERE userId = "${message.author.id}"`);
                    sql.run(`UPDATE scores SET used_stats = ${row.used_stats + 1} WHERE userId = "${message.author.id}"`);
                    const skillEmbed = new Discord.RichEmbed()
                    .setColor(10036247)
                    .setAuthor(message.member.displayName, message.author.avatarURL)
                    .setTitle("Successfully allocated 1 point to 💥 Strength!")
                    .setDescription("You now deal " + (row.scaledDamage + 0.03).toFixed(2) + "x damage.")
                    .setFooter((row.stats - 1) + " skill points remaining.")
                    message.channel.send(skillEmbed);
                    return;
                }
                else if(upgrOpt == "luck"){
                    sql.run(`UPDATE scores SET luck = ${row.luck + 2} WHERE userId = "${message.author.id}"`);
                    sql.run(`UPDATE scores SET stats = ${row.stats - 1} WHERE userId = "${message.author.id}"`);
                    sql.run(`UPDATE scores SET used_stats = ${row.used_stats + 1} WHERE userId = "${message.author.id}"`);
                    const skillEmbed = new Discord.RichEmbed()
                    .setColor(5868887)
                    .setAuthor(message.member.displayName, message.author.avatarURL)
                    .setTitle("Successfully allocated 1 point to 🍀 Luck!")
                    .setDescription("**Luck increased by 2**\nYour chance to get rare items has been increased.")
                    .setFooter((row.stats - 1) + " skill points remaining.")
                    message.channel.send(skillEmbed);
                    return;
                }
            }
            else if(row.stats > 0){
                const skillEmbed = new Discord.RichEmbed()
                .setColor(1)
                .setAuthor(message.member.displayName, message.author.avatarURL)
                .setTitle("You have " + row.stats + " skill points available!")
                .setDescription("Choose a skill to upgrade:")
                .addField("💗 Vitality", "Increases max health by 5 (`" + (row.maxHealth + 5) + " HP`)")
                .addField("💥 Strength", "Increases damage by 3% (`" + (row.scaledDamage + 0.03).toFixed(2) + "x`)")
                .addField("🍀 Luck", "Increases luck by 2 (`" + (row.luck + 2) + "`)")
                message.channel.send(skillEmbed).then(botMessage => {
                    botMessage.react('💗').then(() => botMessage.react('💥').then(() => botMessage.react('🍀').then(() => botMessage.react('❌') )));
                    const filter = (reaction, user) => {
                        return ['💗', '💥', '🍀', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                    };
                    botMessage.awaitReactions(filter, {max: 1, time: 30000, errors: ['time'] })
                    .then(collected => {
                        function getStats(type){
                            sql.get(`SELECT * FROM items i
                            JOIN scores s
                            ON i.userId = s.userId
                            WHERE s.userId="${message.author.id}"`).then(row => {
                                if(row.stats <= 0){
                                    botMessage.edit("You don't have the skill points to do that!");
                                }
                                else if(type == "hp"){
                                    sql.run(`UPDATE scores SET maxHealth = ${row.maxHealth + 5} WHERE userId = "${message.author.id}"`);
                                    sql.run(`UPDATE scores SET stats = ${row.stats - 1} WHERE userId = "${message.author.id}"`);
                                    sql.run(`UPDATE scores SET used_stats = ${row.used_stats + 1} WHERE userId = "${message.author.id}"`);
                                    const skillEmbed = new Discord.RichEmbed()
                                    .setColor(14634070)
                                    .setAuthor(message.member.displayName, message.author.avatarURL)
                                    .setTitle("Successfully allocated 1 point to 💗 Vitality!")
                                    .setDescription("You now have " + (row.maxHealth + 5) + " max health.")
                                    .setFooter((row.stats - 1) + " skill points remaining.")
                                    botMessage.edit(skillEmbed);
                                }
                                else if(type === "strength"){
                                    sql.run(`UPDATE scores SET scaledDamage = ${(row.scaledDamage + 0.03).toFixed(2)} WHERE userId = "${message.author.id}"`);
                                    sql.run(`UPDATE scores SET stats = ${row.stats - 1} WHERE userId = "${message.author.id}"`);
                                    sql.run(`UPDATE scores SET used_stats = ${row.used_stats + 1} WHERE userId = "${message.author.id}"`);
                                    const skillEmbed = new Discord.RichEmbed()
                                    .setColor(10036247)
                                    .setAuthor(message.member.displayName, message.author.avatarURL)
                                    .setTitle("Successfully allocated 1 point to 💥 Strength!")
                                    .setDescription("You now deal " + (row.scaledDamage + 0.03).toFixed(2) + "x damage.")
                                    .setFooter((row.stats - 1) + " skill points remaining.")
                                    botMessage.edit(skillEmbed);
                                }
                                else if(type === "luck"){
                                    sql.run(`UPDATE scores SET luck = ${row.luck + 2} WHERE userId = "${message.author.id}"`);
                                    sql.run(`UPDATE scores SET stats = ${row.stats - 1} WHERE userId = "${message.author.id}"`);
                                    sql.run(`UPDATE scores SET used_stats = ${row.used_stats + 1} WHERE userId = "${message.author.id}"`);
                                    const skillEmbed = new Discord.RichEmbed()
                                    .setColor(5868887)
                                    .setAuthor(message.member.displayName, message.author.avatarURL)
                                    .setTitle("Successfully allocated 1 point to 🍀 Luck!")
                                    .setDescription("**Luck increased by 2**\nYour chance to get rare items has been increased.")
                                    .setFooter((row.stats - 1) + " skill points remaining.")
                                    botMessage.edit(skillEmbed);
                                }
                            });
                        }
                        const reaction = collected.first();
                        if(reaction.emoji.name === '💗'){
                            getStats("hp")
                        }
                        else if(reaction.emoji.name === '💥'){
                            getStats("strength")
                        }
                        else if(reaction.emoji.name === '🍀'){
                            getStats("luck")
                        }
                        else{
                            botMessage.delete();
                        }
                    }).catch(collected => {
                        botMessage.delete();
                        message.reply("You didn't react in time!");
                    });
                });
            }
            else{
                message.reply("You don't have any skill points to upgrade with right now! Level up and come back.");
            }
        });
    }
    ping(message, sql){
        message.channel.send(`Response time to server : ${Math.round(client.ping)} ms`);
        /*
        const voteEmbed = new Discord.RichEmbed()
        .setTitle("Thanks for voting!")
        .setDescription("📦 You received an **ultra_box**!")
        .setFooter("Vote every 12 hours for a reward")
        .setImage("https://cdn.discordapp.com/attachments/454163538886524928/543014649554272277/greypleLine.png")
        client.users.get("168958344361541633").send(voteEmbed);
        */
    }
    deactivate(message, sql, prefix){ 
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            if(deactivateCooldown.has(message.author.id)) return message.reply("You can only deactivate a server once every 24 hours!");
            if(activateCooldown.has(message.author.id)) return message.reply("You must wait `" + ((3600 * 1000 - ((new Date()).getTime() - row.activateTime)) / 60000).toFixed(1) + " minutes` after activating in order to deactivate!");
            if(weapCooldown.has(message.author.id)) return message.reply("You can't deactivate when you still have an attack cooldown! (`"+ ((weapCdSeconds * 1000 - ((new Date()).getTime() - row.attackTime)) / 60000).toFixed(1) + " minutes`)");
            
            message.reply("Deactivating your account will prevent you from using commands or being targeted in **this** server.\n`Note : You can only do this once every 24 hours.`\n**Are you sure?**").then(botMessage => {
                botMessage.react('✅').then(() => botMessage.react('❌'));
                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                .then(collected => {
                    const reaction = collected.first();
    
                    if(reaction.emoji.name === '✅'){
                        botMessage.delete();
                        sql.run(`DELETE FROM userGuilds WHERE userId = ${message.author.id} AND guildId = ${message.guild.id}`); //delete user from server 
                        deactivateCooldown.add(message.author.id);
                        sql.run(`UPDATE scores SET deactivateTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                        setTimeout(() => {
                            deactivateCooldown.delete(message.author.id);
                            sql.run(`UPDATE scores SET deactivateTime = ${0} WHERE userId = ${message.author.id}`);
                        }, deactivateCdSeconds * 1000);
                        message.reply(`Your account has been disabled on this server.`);
                    }
                    else{
                        botMessage.delete();
                    }
                }).catch(collected => {
                    botMessage.delete();
                    message.reply("You didn't react in time!");
                });
            });
        });
    }
    level(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            Jimp.read("./userImages/LvlUp.png").then(test => {
                Jimp.read(message.author.avatarURL).then(avatar => {
                    avatar.resize(64,64);
                    test.quality(70);
                    Jimp.loadFont("./fonts/BebasNeue37.fnt").then(font2 => {
                        test.print(font2, 0, 0, {
                            text: "lvl " + row.level,
                            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                            alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
                        }, 128, 144);
                        Jimp.loadFont("./fonts/BebasNeue25.fnt").then(font => {
                        test.print(
                            font,
                            0,
                            0,
                            {
                            text: message.author.username.substring(0,13),
                            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                            alignmentY: Jimp.VERTICAL_ALIGN_TOP
                            },
                            128,
                            144
                        );
                        //test.print(font, 0, 0, message.author.username);
                        test.composite(avatar, 32, 32);
                        test.write("./userImages/userLvl.jpeg");
                        test.getBuffer(Jimp.AUTO, (err, buffer) => {
                            if(err){
                                console.log("oh no");
                                return;
                            }
                            message.reply(`Your current level is **${row.level}**.\nYour damage scaling is currently **${row.scaledDamage.toFixed(2)}x**`, {
                                file: buffer
                            });
                        });    
                    });
                    });
                });
            });
        });
    }
    points(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            message.reply(`You currently have ${row.points} points!`);
        });
    }
    health(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
            let hpMsg = "Current health:";
            let chance = Math.floor(Math.random() * 5); //returns value 0 between 4 (1 of 5)
            if(row.health >= 120){
                if(chance <= "2"){
                    hpMsg = "**A B S O L U T E   U N I T**";
                }
                else{
                    hpMsg = "Not gonna die anytime soon.";
                }
            }
            else if(row.health >= 100){
                if(chance == "0"){
                    hpMsg = "That's a lot of health";
                }
                else if(chance == 1){
                    hpMsg = "You been workin' out?";
                }
                else if(chance == 2){
                    hpMsg = "Insert affirmation here.";
                }
                else if(chance == 3){
                    hpMsg = "💯";
                }
                else{
                    hpMsg = ":)";
                }
            }
            else if(row.health >= 60){
                if(chance == 0){
                    hpMsg = "ur aight m8";
                }
                else if(chance == 1){
                    hpMsg = "👌";
                }
                else if(chance == 2){
                    hpMsg = "Fair amount.";
                }
                else if(chance == 3){
                    hpMsg = "Here you go!";
                }
                else{
                    hpMsg = "Is this what you're looking for?";
                }
            }
            else if(row.health >= 40){
                if(chance == 0){
                    hpMsg = "Could use a `health_pot`.";
                }
                else if(chance == 1){
                    hpMsg = "oof";
                }
                else if(chance == 2){
                    hpMsg = ":)";
                }
                else if (chance == 3){
                    hpMsg = "It's turning yellow";
                }
                else{
                    hpMsg = ""
                }
            }
            else if(row.health >= 20){
                if(chance == 0){
                    hpMsg = "You look pale, are you okay?";
                }
                else if(chance == 1){
                    hpMsg = "*Health potion intensifies*";
                }
                else if(chance == 2){
                    hpMsg = "Gettin' low";
                }
                else if(chance == 3){
                    hpMsg = "Could use a health potion";
                }
                else{
                    hpMsg = "Might wanna invest in a `health_pot`";
                }
            }
            else{
                if(chance == 0){
                    hpMsg = "Here's a free `health_pot`. **SIKE** AHAHAA";
                }
                else if(chance == 1){
                    hpMsg = "Listen, I'm not saying you're gonna die... but you ded";
                }
                else if(chance == 2){
                    hpMsg = "RIP";
                }
                else if(chance == 3){
                    hpMsg = "The results aren't good";
                }
                else {
                    hpMsg = "YO SOMEONE KILL THIS DUDE";
                }
            }
            
            Jimp.read("./userImages/healthBarEmpty.png").then(emptyBar => {
                Jimp.read("./userImages/greenBar.png").then(greenBar => {
                    Jimp.read("./userImages/redBar.png").then(redBar => {
                        Jimp.read("./userImages/healthBarMask.png").then(barMask => {
                            greenBar.cover((row.health/row.maxHealth) * 150, 15);
                            greenBar.color([
                                {apply: 'hue', params: [-100 * (1 -(row.health/row.maxHealth))]}
                            ]);
                            redBar.composite(greenBar, 0, 0);
                            redBar.composite(emptyBar, 0, 0);
                            Jimp.loadFont("./fonts/BebasNeue16.fnt").then(font => {
                                redBar.print(
                                font,
                                    0,
                                    -2,
                                    {
                                    text: row.health + "/" + row.maxHealth,
                                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                                    alignmentY: 0
                                    },
                                    150,
                                    15
                                );
                                redBar.mask(barMask, 0, 0);
                                redBar.resize(190,19);
                                redBar.write("./userImages/healthBarFinal.png");
                                redBar.getBuffer(Jimp.AUTO, (err, buffer) => {
                                    if(err){
                                        console.log("oh no");
                                        return;
                                    }
                                    message.reply(hpMsg, {
                                        file: buffer
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
    server(message, sql, prefix){
        sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(row => {
        if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
        var guildUsers = [];
        var userCount = 1;
        sql.all(`SELECT * FROM userGuilds WHERE guildId ="${message.guild.id}" ORDER BY LOWER(userId)`).then(rows => {
            rows.forEach(function (row) {
                try{
                    console.log(row);
                    if(message.guild.members.get(row.userId).displayName){
                        guildUsers.push(`${userCount}. **${message.guild.members.get(row.userId).displayName}**`);
                        userCount += 1;
                    }
                }
                catch(err){
                    console.log("error in server");
                }
            });
            /*
            guildUsers.sort(function(x,y){
                var xp = x.substr(100,5);
                var yp = y.substr(100,5);
                return xp == yp ? 0 : xp < yp ? -1 : 1;
            });
            guildUsers.forEach(function (user) {
                guildFilteredUsers.push(`${guildUsers.indexOf(user) + 1}. **${finalString}**`);
            });
            */
            if(guildUsers.length > 5){
                let pageNum = 1;
                let guildFilteredUsers = [];
                let maxPage = Math.ceil(guildUsers.length/5);
                const embedLeader = new Discord.RichEmbed({
                    //fields: [{name: `**Active users in ${message.guild.name}**`, value: `${guildUsers}`}],
                    footer: {
                        text: `Page 1/${maxPage}`
                    },
                    color: 13215302
                });
                embedLeader.addField(`**Active users in ${message.guild.name}**`, guildUsers.slice(0,5));
                message.channel.send(embedLeader).then(botMessage => {
                    botMessage.react('◀').then(() => botMessage.react('▶')).then(() => botMessage.react('❌'));
                    return botMessage;
                }).then((collectorMsg) => { 
                    const collector = collectorMsg.createReactionCollector((reaction, user) => user.id === message.author.id && reaction.emoji.name === "◀" || user.id === message.author.id && reaction.emoji.name === "▶" || user.id === message.author.id && reaction.emoji.name === "❌");
                    setTimeout(() => {          //STOPS COLLECTING AFTER 2 MINUTES TO REDUCE MEMORY USAGE
                        collector.stop();
                    }, 120000);
                    collector.on("collect", reaction => {
                        const chosen = reaction.emoji.name;
                        if(chosen === "◀"){
                            if(pageNum > 1){
                                pageNum -= 1;
                                editEmbed();
                            }
                            reaction.remove(message.author.id);
                            //previous page
                        }else if(chosen === "▶"){
                            if(pageNum < maxPage){
                                pageNum += 1;
                                editEmbed();
                            }
                            reaction.remove(message.author.id);
                            // Next page
                        }else if(chosen === "❌"){
                            // Stop navigating pages
                            collectorMsg.delete();
                        }
                        function editEmbed(){
                            guildFilteredUsers = [];
                            let indexFirst = (5 * pageNum) - 5;
                            let indexLast = (5* pageNum) - 1;
                            const newEmbed = new Discord.RichEmbed({
                                footer: {
                                    text: `Page ${pageNum}/${maxPage}`
                                },
                                color: 13215302
                            });
                            guildUsers.forEach(function (user) {
                                try{
                                    if(guildUsers.indexOf(user) >= indexFirst && guildUsers.indexOf(user) <= indexLast){
                                        let newString = user.replace(/\**/g, '');
                                        let finalString = newString.slice(3);
                                        guildFilteredUsers.push(`${guildUsers.indexOf(user) + 1}. **${finalString}**`);
                                    }
                                }
                                catch(err){
                                    //guildFilteredUsers.push(``);  
                                }
                            });
                            newEmbed.addField(`**Active users in ${message.guild.name}**`,guildFilteredUsers);
                            collectorMsg.edit(newEmbed);
                        }
                    });
                    collector.on("end", reaction => {
                    });
                });
            }
            else{
                const embedLeader = new Discord.RichEmbed()
                .setColor(13215302)
                .addField(`**Active users in ${message.guild.name}**`, guildUsers)
                message.channel.send(embedLeader);
            }
        });
        });
    }
    cooldown(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            methods.getAttackCooldown(sql, message.author.id).then(attackTimeLeft => {
                methods.getHealCooldown(sql, message.author.id).then(healTimeLeft => {
                let hourlyReady = "✅ ready"
                let triviaReady = "✅ ready"
                let scrambleReady = "✅ ready"
                let attackReady = "✅ ready"
                let healReady = "✅ ready"
                let voteReady = "✅ ready"
                let gambleReady = "✅ ready"

                let giftReady = "✅ ready"
                const embedLeader = new Discord.RichEmbed()
                if(hourlyCooldown.has(message.author.id)){
                    hourlyReady = ((hourlyCdSeconds * 1000 - ((new Date()).getTime() - row.hourlyTime)) / 60000).toFixed(1) + " minutes";
                }
                if(triviaUserCooldown.has(message.author.id)){
                    triviaReady = ((triviaCdSeconds * 1000 - ((new Date()).getTime() - row.triviaTime)) / 60000).toFixed(1) + " minutes";
                }
                if(scrambleCooldown.has(message.author.id)){
                    scrambleReady = ((scrambleCdSeconds * 1000 - ((new Date()).getTime() - row.scrambleTime)) / 60000).toFixed(1) + " minutes";
                }
                if(weapCooldown.has(message.author.id)){
                    attackReady = attackTimeLeft;
                }
                if(healCooldown.has(message.author.id)){
                    healReady = healTimeLeft;
                }
                if(voteCooldown.has(message.author.id)){
                    voteReady = (((voteCdSeconds * 1000 - ((new Date()).getTime() - row.voteTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours";
                }
                if(gambleCooldown.has(message.author.id)){
                    gambleReady = ((gambleCdSeconds * 1000 - ((new Date()).getTime() - row.gambleTime)) / 1000).toFixed(0) + " seconds";
                }
                if(eventCooldown.has(message.author.id)){
                    giftReady = (((voteCdSeconds * 1000 - ((new Date()).getTime() - row.prizeTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours";
                }
                embedLeader.setThumbnail(message.author.avatarURL)
                embedLeader.setTitle(`**${message.author.username} Cooldowns**`)
                embedLeader.setColor(13215302)
                embedLeader.addField("⏲hourly", "`" + hourlyReady + "`",true)
                embedLeader.addField("❓trivia", "`" + triviaReady + "`",true)
                embedLeader.addField("❓scramble", "`" + scrambleReady + "`",true)
                embedLeader.addField("💰gamble", "`" + gambleReady + "`",true)
                embedLeader.addField("🎟vote", "`" + voteReady + "`",true)
                embedLeader.addField("⚔Attack (part of `"+prefix+"use`)", "`" + attackReady + "`",true)
                embedLeader.addField("❤Heal (part of `"+prefix+"use`)", "`" + healReady + "`",true)
                //embedLeader.addField("🐰basket", "`" + giftReady + "`",true)
                if(ironShieldActive.has(message.author.id)){
                    embedLeader.addField("iron_shield", "`" + ((ironShieldCd * 1000 - ((new Date()).getTime() - row.ironShieldTime)) / 60000).toFixed(1) + " minutes`",true)
                }
                if(goldShieldActive.has(message.author.id)){
                    embedLeader.addField("gold_shield", "`" + ((goldShieldCd * 1000 - ((new Date()).getTime() - row.goldShieldTime)) / 60000).toFixed(1) + " minutes`",true)
                }
                if(mittenShieldActive.has(message.author.id)){
                    embedLeader.addField("🧤mittens(shield)", "`" + ((mittenShieldCd * 1000 - ((new Date()).getTime() - row.mittenShieldTime)) / 60000).toFixed(1) + " minutes`",true)
                }
                message.channel.send(embedLeader);
                });
            });
        });
    }
    leaderboard(message, sql, prefix){
        var leaders = [];
        var levelLeaders = [];
        var killLeaders = [];
        var tokenLeaders = [];
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if(message.content.startsWith(prefix+"leaderboard s") || message.content.startsWith(prefix+"lb s")){
                if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
                var guildUsers =[];
                var newPlayerObj = {};
                sql.all(`SELECT * FROM userGuilds WHERE guildId ="${message.guild.id}" ORDER BY LOWER(userId)`).then(rows => {
                    for(var i = 0; i < rows.length;i++){
                        sql.get(`SELECT * FROM scores WHERE userId ="${rows[i].userId}"`).then(row => {
                            newPlayerObj = {USERID : row.userId, MONEY : row.money, LEVEL : row.level}
                            //console.log(newPlayerObj);
                            guildUsers.push(newPlayerObj);
                        });
                    }
                });
                function compareValues(key, order='desc') {
                    return function(a, b) {
                        if(!a.hasOwnProperty(key) || 
                            !b.hasOwnProperty(key)) {
                            return 0; 
                        }
                    
                        const varA = (typeof a[key] === 'string') ? 
                        a[key].toUpperCase() : a[key];
                        const varB = (typeof b[key] === 'string') ? 
                        b[key].toUpperCase() : b[key];
                            
                        let comparison = 0;
                        if (varA > varB) {
                            comparison = 1;
                        } else if (varA < varB) {
                            comparison = -1;
                        }
                        return (
                            (order == 'desc') ? 
                            (comparison * -1) : comparison
                        );
                    };
                }
                setTimeout(() => {
                    let leadersMoney = [];
                    let leadersLevel = [];
                    guildUsers.sort(compareValues('MONEY'));
                    guildUsers.forEach(function (row) {
                        try{
                            leadersMoney.push(`💵**${client.users.get(row.USERID).tag}**` + ' - ' + methods.formatMoney(row.MONEY));
                        }
                        catch(err){
                        }
                    });
                    guildUsers.sort(compareValues('LEVEL'));
                    guildUsers.forEach(function (row) {
                        try{
                            leadersLevel.push(`🔹**${client.users.get(row.USERID).tag}**` + ' - Level : ' + row.LEVEL);
                        }
                        catch(err){
                        }
                    });
                    let newMoney = leadersMoney.slice(0,10);
                    let newLevel = leadersLevel.slice(0,10);
                    newMoney[0] = newMoney[0].replace("💵", "💰");
                    newLevel[0] = newLevel[0].replace("🔹", "💠");
                    const embedLeader = new Discord.RichEmbed() 
                    .setTitle(`**Server Leaderboard**`)
                    .setThumbnail(message.guild.iconURL)
                    .setColor(13215302)
                    .addField("Money", newMoney)
                    .addField("Level", newLevel)
                    .setFooter("Top " + newLevel.length)
                    message.channel.send(embedLeader);
                }, 150);//raise with server count
            }
            else{
                sql.all('SELECT userId,money FROM scores ORDER BY money DESC LIMIT 20').then(rows => {
                    let counter = 0;
                    let success = 0;
                    while(success < 5){
                        try{
                            leaders.push(`💵**${client.users.get(rows[counter].userId).tag}**` + ' - ' + methods.formatMoney(rows[counter].money));
                            success += 1;
                        }
                        catch(err){
                            if(counter >= 20){
                                break;
                            }
                        }
                        counter += 1;
                    }
                    leaders[0] = leaders[0].replace("💵", "💰");
                    sql.all('SELECT userId,level FROM scores ORDER BY level DESC LIMIT 20').then(lvlRows => {
                        counter = 0;
                        success = 0;
                        while(success < 5){
                            try{
                                levelLeaders.push(`🔹**${client.users.get(lvlRows[counter].userId).tag}**` + ' - Level :  ' + lvlRows[counter].level);
                                success += 1;
                            }
                            catch(err){
                                if(counter >= 20){
                                    break;
                                }
                            }
                            counter += 1;
                        }
                        levelLeaders[0] = levelLeaders[0].replace("🔹","💠");
                        sql.all('SELECT userId,kills FROM scores ORDER BY kills DESC LIMIT 20').then(rows => {
                            counter = 0;
                            success = 0;
                            while(success < 5){
                                try{
                                    killLeaders.push(`🏅**${client.users.get(rows[counter].userId).tag}**` + ' - ' + rows[counter].kills + " kills");
                                    success += 1;
                                }
                                catch(err){
                                    if(counter >= 20){
                                        break;
                                    }
                                }
                                counter += 1;
                            }
                            killLeaders[0] = killLeaders[0].replace("🏅","🏆");

                            /*
                            sql.all('SELECT userId,token FROM items ORDER BY token DESC LIMIT 20').then(rows => {
                                counter = 0;
                                success = 0;
                                while(success < 5){
                                    try{
                                        tokenLeaders.push(`🥚**${client.users.get(rows[counter].userId).tag}**` + ' - ' + rows[counter].token + " tokens");
                                        success += 1;
                                    }
                                    catch(err){
                                        if(counter >= 20){
                                            break;
                                        }
                                    }
                                    counter += 1;
                                }
                                tokenLeaders[0] = tokenLeaders[0].replace("🥚","<:golden_egg:562529468703440907>");
                                const embedLeader = new Discord.RichEmbed() 
                                .setTitle(`**Global Leaderboard**`)
                                .setColor(0)
                                .addField("Money", leaders, true)
                                .addField("Level", levelLeaders, true)
                                .addField("Kills", killLeaders, true)
                                .addField("Event tokens", tokenLeaders, true)
                                .setFooter("Top 5")
                                message.channel.send(embedLeader);
                            });
                            */
                            const embedLeader = new Discord.RichEmbed() 
                            .setTitle(`**Global Leaderboard**`)
                            .setColor(0)
                            .addField("Money", leaders, true)
                            .addField("Level", levelLeaders, true)
                            .addField("Kills", killLeaders, true)
                            .setFooter("Top 5")
                            message.channel.send(embedLeader);
                        });
                        
                    });
                });
            }
        });
    }
    money(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            message.reply(`You currently have ${methods.formatMoney(row.money)}`);
        });
    }
    delete(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            if(deleteCooldown.has(message.author.id)) return message.reply("You just deleted your account CHILL");
            let quotes = ["drank bleach", "typed kill in console", "ate a tide pod"]
            let chance = Math.floor(Math.random() * 3) //0-2
            
            message.reply("Are you sure? **Deleting is not the same as deactivating.**").then(botMessage => {
                botMessage.react('✅').then(() => botMessage.react('❌'));
                const filter = (reaction, user) => {
                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                .then(collected => {
                    const reaction = collected.first();
    
                    if(reaction.emoji.name === '✅'){
                        botMessage.delete();
                        methods.getinventorycode(message, sql, cryptor, message.author.id, true).then(result => {

                            sql.run(`DELETE FROM scores WHERE userId ="${message.author.id}"`);
                            sql.run(`DELETE FROM items WHERE userId ="${message.author.id}"`);
                            sql.run(`DELETE FROM userGuilds WHERE userId = ${message.author.id}`); //delete user from server 
                            healCooldown.delete(message.author.id);
                            gambleCooldown.delete(message.author.id);
                            scrambleCooldown.delete(message.author.id);
                            hourlyCooldown.delete(message.author.id);
                            triviaUserCooldown.delete(message.author.id);
                            peckCooldown.delete(message.author.id);
                            ironShieldActive.delete(message.author.id);
                            goldShieldActive.delete(message.author.id);
                            eventCooldown.delete(message.author.id);
    
                            deleteCooldown.add(message.author.id);

                            const embedInfo = new Discord.RichEmbed()
                            .setTitle("⛔Account deleted⛔\n`"+message.author.tag + " : " + message.author.id + "` **Data**")
                            .setDescription("User inventory code prior to deletion:\n```" + result.invCode + "```")
                            .setTimestamp()
                            .setColor(16636672)
                            client.guilds.get("454163538055790604").channels.get("500467081226223646").send(embedInfo);

                            setTimeout(() => {
                                deleteCooldown.delete(message.author.id);
                            }, hourlyCdSeconds * 1000);
                            if(message.content.startsWith(prefix + "suicide")){
                                message.channel.send(`${message.author} ${quotes[chance]}...\nYour account has been deleted.`);
                            }
                            else{
                                message.reply(`Your account has been deleted.`);
                            }
                        }).catch(err => {

                        });
                    }
                    else{
                        botMessage.delete();
                    }
                }).catch(collected => {
                    botMessage.delete();
                    message.reply("You didn't react in time!");
                });
            });
        });
    }
    discord(message){
        message.channel.send("https://discord.gg/7XNbdzP");
    }
    heal(message, prefix){
        message.reply("Heal using the `use` command. (Ex. `"+prefix+"use medkit`)");
    }
    attack(message, prefix){
        message.reply("Attack using the `use` command. (Ex. `"+prefix+"use rock @user`)");
    }

    //UTILITY COMMAND
    utility(message, sql, prefix){
        if(message.member.hasPermission("MANAGE_GUILD")){
            let args = message.content.split(" ").slice(1);
            let subCommand = args[0] == undefined ? "none" : args[0];

            switch(subCommand.toLowerCase()){
                //ADMIN COMMANDS
                case 'setprefix': this.prefix(message, sql); break;

                case 'setkillfeed': this.setkillfeed(message, sql); break;
                case 'disablekillfeed': this.disablekillfeed(message, sql); break;

                case 'setlevelchannel': this.setlevelchannel(message, sql); break;
                case 'disablelevelchannel': this.disablelevelchannel(message, sql); break;

                case 'getkillfeed': this.getkillfeed(message, sql); break;

                default: message.reply("You need to specify a sub-command! `" + prefix + "help util`")
            }
        }
        else{
            message.reply("You need the `Manage Server` permission to use this command!");
        }
    }

    prefix(message, sql, prefix){
        let args = message.content.split(" ").slice(2);
        let prefixString = args[0];
        if(prefixString == undefined || prefixString == "" || prefixString.length > 3){
            return message.reply("Please enter a prefix up to 3 characters long! `"+prefix+"setprefix ***`")
        }
        else{
            sql.get(`SELECT * FROM guildPrefix WHERE guildId ="${message.guild.id}"`).then(prefixRow => {
                if(prefixRow){
                    sql.run(`DELETE FROM guildPrefix WHERE guildId ="${message.guild.id}"`);
                }
                prefixString = prefixString.toLowerCase();
                sql.run("INSERT INTO guildPrefix (guildId, prefix) VALUES (?, ?)", [message.guild.id, prefixString]);
                message.reply("Server prefix successfully changed to `" + prefixString + "`");
            });
        }
    }
    setkillfeed(message, sql){
        sql.get(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(guildRow => {
            if(!guildRow) sql.run("INSERT INTO guildInfo (guildId, killChan, levelChan) VALUES (?, ?, ?)", [message.guild.id, "", ""]);

            sql.run(`UPDATE guildInfo SET killChan = ${message.channel.id} WHERE guildId = ${message.guild.id}`);

            message.reply("✅ Set this channel as the kill feed channel!");
        });
    }
    disablekillfeed(message, sql){
        sql.get(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(guildRow => {
            if(!guildRow) sql.run("INSERT INTO guildInfo (guildId, killChan, levelChan) VALUES (?, ?, ?)", [message.guild.id, "", ""]);

            sql.run(`UPDATE guildInfo SET killChan = "" WHERE guildId = "${message.guild.id}"`);
            message.reply("✅ Disabled kill feed for this server!");
        });
    }

    setlevelchannel(message, sql){
        sql.get(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(guildRow => {
            if(!guildRow) sql.run("INSERT INTO guildInfo (guildId, killChan, levelChan) VALUES (?, ?, ?)", [message.guild.id, "", ""]);

            sql.run(`UPDATE guildInfo SET levelChan = "${message.channel.id}" WHERE guildId = "${message.guild.id}"`);
            message.reply("✅ Now sending level up messages to this channel!");
        });
    }
    disablelevelchannel(message, sql){
        sql.get(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(guildRow => {
            if(!guildRow) sql.run("INSERT INTO guildInfo (guildId, killChan, levelChan) VALUES (?, ?, ?)", [message.guild.id, "", ""]);

            sql.run(`UPDATE guildInfo SET levelChan = "" WHERE guildId = "${message.guild.id}"`);
            message.reply("✅ Disabled level channel for this server!");
        });
    }

    getkillfeed(message, sql){
        sql.get(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(guildRow => {
            message.reply(guildRow.killChan);
            console.log(guildRow.killChan);

            try{
                message.guild.channels.get(guildRow.killChan).send("Killchannel works!");
                message.guild.channels.get(guildRow.levelChan).send("Levelchannel works!");
            }
            catch(err){
                console.log(err);
                message.reply("There is none!");
            }
        });
    }

    //MODERATOR COMMANDS
    modhelp(message, moddedUsers, prefix){
        if(!moddedUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        else{
            const modCommands = [
                "`" + prefix + "message <id> <message>` - Messages a user. Allows attachments such as images, mp3, mp4.",
                "`" + prefix + "warn <id> <message>` - Warns a user, similar to messaging but warns user for a ban.",
                "`" + prefix + "ban <id> <reason>` - Bans user and messages them with the reason they've been banned.",
                "`" + prefix + "unban <id>` - Unbans user and sends them message stating they've been unbanned.",
                "`" + prefix + "status <activity> <status>` - Sets bot status.",
                "`" + prefix + "getbans` - Displays list of all banned users.",
                "`" + prefix + "getbaninfo <id>` - Shows reason and date for banned user.",
                "`" + prefix + "invwipe <id> <reason>` - Wipes a users data and sends them message with reason. Will also log the users inventory and unique code prior to wipe in <#500467081226223646>.",
                "`" + prefix + "getinv <id>` - Displays a users inventory along with their unique inventory code.",
                "`" + prefix + "restoreinv <unique inventory code>` - Restores a users inventory using a code from either the getinv or invwipe commands."
            ];
            let filteredList = [];
            for(var i = 0; i < modCommands.length; i++){
                filteredList.push((i + 1) + ". " + modCommands[i] + "\n");
            }
            const helpInfo = new Discord.RichEmbed()
            .setTitle(`🔻__**Moderator Commands**__🔻`)
            .setDescription(filteredList)
            .setFooter("Most mod commands can ONLY be used in the Lootcord Workshop server moderator channel. "+prefix+"status and getbans are the only commands that can be used in DMs")
            .setColor(13632027)
            message.channel.send(helpInfo);    
        }
    }
    ban(message, sql, moddedUsers, bannedUsers, prefix){
        if(!moddedUsers.has(message.author.id) && !adminUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        else if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }
        let args = message.content.split(" ").slice(1);
        let userNameID = args[0];
        
        let banReason = args.slice(1).join(" ");
                        
        if(userNameID !== undefined){
            if(banReason == ""){
                message.reply("You forgot to put the reason for banning this user! `"+prefix+"ban (ID) (REASON)`");
            }
            else if(moddedUsers.has(userNameID)){
                message.reply("Hey stop trying to ban a moderator!!! >:(");
            }
            else{
                const banMsg = new Discord.RichEmbed()
                .setAuthor(`❗Your account has been banned❗`)
                .setTitle("**" + message.author.tag + "** banned your account for the following reason:")
                .setDescription("`" + banReason + "`")
                .setColor(13632027)
                .addBlankField()
                .setFooter("Appeal : not available yet | Sorry but you probably deserved it 🤷")
                try{
                    client.users.get(userNameID).send(banMsg);
                    sql.run("INSERT INTO banned (userId, reason, date) VALUES (?, ?, ?)", [userNameID, banReason, (new Date()).getTime()]);
                    bannedUsers.add(userNameID);
                    message.reply("User ("+ client.users.get(userNameID).tag +") successfully banned.");
                }
                catch(err){
                    message.reply("Something went wrong. Make sure you input the correct info.")
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by your reason for banning. `"+prefix+"ban (ID) (REASON)`");
        }
    }
    tradeban(message, sql, moddedUsers, bannedUsers, prefix){ //not used
        if(!moddedUsers.has(message.author.id) && !adminUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        else if(message.channel.id !== "496740775212875816"){
            return message.reply('You must be in the mod-command-center!');
        }
        let args = message.content.split(" ").slice(1);
        let userNameID = args[0];
        
        let banReason = args.slice(1).join(" ");
                        
        if(userNameID !== undefined){
            if(banReason == ""){
                message.reply("You forgot to put the reason for banning this user! `"+prefix+"ban (ID) (REASON)`");
            }
            else if(moddedUsers.has(userNameID)){
                message.reply("Hey stop trying to ban a moderator!!! >:(");
            }
            else{
                const banMsg = new Discord.RichEmbed()
                .setAuthor(`❗Your account has been banned❗`)
                .setTitle("**" + message.author.tag + "** banned your account for the following reason:")
                .setDescription("`" + banReason + "`")
                .setColor(13632027)
                .addBlankField()
                .setFooter("Appeal : not available yet | Sorry but you probably deserved it 🤷")
                try{
                    client.users.get(userNameID).send(banMsg);
                    sql.run("INSERT INTO banned (userId) VALUES (?)", [userNameID]);
                    bannedUsers.add(userNameID);
                    message.reply("User ("+ client.users.get(userNameID).tag +") successfully banned.");
                }
                catch(err){
                    message.reply("Something went wrong. Make sure you input the correct info.")
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by your reason for banning. `"+prefix+"ban (ID) (REASON)`");
        }
    }
    unban(message, sql, moddedUsers, bannedUsers, prefix){
        if(!moddedUsers.has(message.author.id) && !adminUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        else if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }
        let args = message.content.split(" ").slice(1);
        let userNameID = args[0];
        
        let banReason = args.slice(1).join(" ");
                        
        if(userNameID !== undefined){
            const banMsg = new Discord.RichEmbed()
            .setAuthor(`😃Your account has been unbanned✅`)
            .setTitle("**" + message.author.tag + "** unbanned your account!")
            .setColor(720640)
            try{
                client.users.get(userNameID).send(banMsg);
                sql.run(`DELETE FROM banned WHERE userId ="${userNameID}"`);
                bannedUsers.delete(userNameID);
                message.reply("User ("+ client.users.get(userNameID).tag +") successfully unbanned.");
            }
            catch(err){
                message.reply("Something went wrong. Make sure you input the correct info.")
            }
        }
        else{
            message.reply("Please use the user ID `"+prefix+"unban (ID)`");
        }
    }
    warn(message, moddedUsers, prefix){
        if(!moddedUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        else if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }
        let args = message.content.split(" ").slice(1);
        let userNameID = args[0];
        
        let banReason = args.slice(1).join(" ");
                        
        if(userNameID !== undefined){
            if(banReason == ""){
                message.reply("You forgot to put the reason for warning this user! `"+prefix+"warn (ID) (REASON)`");
            }
            else if(moddedUsers.has(userNameID)){
                message.reply("Hey stop trying to warn a moderator!!! >:(");
            }
            else{
                const banMsg = new Discord.RichEmbed()
                .setAuthor(`❗You have been warned❗`)
                .setTitle("**" + message.author.tag + "** issued a warning!\nAny more could result in a ban!")
                .setDescription("`" + banReason + "`")
                .setColor(13064193)
                try{
                    client.users.get(userNameID).send(banMsg);
                    message.reply("User ("+ client.users.get(userNameID).tag +") successfully warned");
                }
                catch(err){
                    message.reply("Something went wrong:```" + err + "```")
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by your reason for warning. `"+prefix+"warn (ID) (REASON)`");
        }
    }
    message(message, moddedUsers, prefix){
        if(!moddedUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        else if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }
        let args = message.content.split(" ").slice(1);
        let userNameID = args[0];
        
        let messageIn = args.slice(1).join(" ");
                        
        if(userNameID !== undefined){
            if(messageIn == ""){
                message.reply("You forgot to put a message! `"+prefix+"message (ID) (MESSAGE)`");
            }
            else{
                let imageAttached = message.attachments.array();
                const userMsg = new Discord.RichEmbed()
                .setAuthor(`📨New message!📨`)
                .setTitle("**" + message.author.tag + "** has messaged you :")
                .setThumbnail(message.author.avatarURL)
                .setDescription("`" + messageIn + "`")
                .setColor(16777215)
                .addBlankField()
                .setFooter("https://lootcord.com | Only moderators can send you messages.")
                if(Array.isArray(imageAttached) && imageAttached.length){
                    userMsg.setImage(imageAttached[0].url);
                }
                try{
                    if(Array.isArray(imageAttached) && imageAttached.length && imageAttached[0].url.endsWith(".mp4") || Array.isArray(imageAttached) && imageAttached.length && imageAttached[0].url.endsWith(".mp3")){
                        client.users.get(userNameID).send("**Included attachment:**", {embed : userMsg, files: [{attachment: imageAttached[0].url}]});
                    }
                    else{
                        client.users.get(userNameID).send(userMsg);
                    }
                    message.reply("📨Message sent to `"+client.users.get(userNameID).tag+"`!");
                }
                catch(err){
                    message.reply("**Error sending message:**```"+err+"```")
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by your messaage. `"+prefix+"message (ID) (MESSAGE)`");
        }
    }
    status(message, moddedUsers, prefix){
        if(!moddedUsers.has(message.author.id)){
            message.reply("Only mods can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let activityType = args[0];
        
        let statusInfo = args.slice(1).join(" ");
                        
        if(activityType !== undefined){
            if(statusInfo == ""){
                client.user.setActivity('t-help');
                message.reply("Status set!");
            }
            else{
                try{
                    client.user.setActivity('t-help | '+statusInfo, { type: `${activityType}` });
                    message.reply("Status set!");
                }
                catch(err){
                    message.reply("Something went wrong. Make sure you input the correct info.")
                }
            }
        }
        else{
            message.reply("ERROR. `"+prefix+"status (ACTIVITY : ex. 'playing')(STATUS)`");
        }
    }
    getbans(message, moddedUsers, bannedUsers, prefix){
        if(!moddedUsers.has(message.author.id) && !adminUsers.has(message.author.id)){
            message.reply("Only mods can use this command!");
            return;
        }
        let bannedList = [];
        bannedUsers.forEach(function(value) {
            bannedList.push(client.users.get(value).tag + " ID: " + value);
        });
        const banMsg = new Discord.RichEmbed()
        .setAuthor(`Banned users`)
        .setDescription(bannedList)
        .setColor(13632027)
        try{
            message.channel.send(banMsg);
        }
        catch(err){
            message.reply("Something went wrong. Make sure you input the correct info.")
        }
    }
    getbaninfo(message, sql, moddedUsers, bannedUsers, prefix){
        if(!moddedUsers.has(message.author.id) && !adminUsers.has(message.author.id)){
            message.reply("Only mods can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let bannedID = args[0];
        if(!bannedUsers.has(bannedID)){
            message.reply("That user wasn't banned.\nMake sure to use the users ID which can be found in the `getbans` command.");
            return;
        }
        sql.get(`SELECT * FROM banned WHERE userId =${bannedID}`).then(row => {
            console.log(bannedID);
            const banMsg = new Discord.RichEmbed()
            .setTitle(client.users.get(bannedID).tag + " Ban Info")
            .addField("Reason", "```" + row.reason + "```")
            .addField("Date", new Date(row.date).toString())
            .setColor(13632027)
            message.channel.send(banMsg);
        }).catch(err => {
            message.channel.send("ERROR GETTING BAN INFO:\n```" + err + "```")
        });
    }
    activity(message, moddedUsers, prefix){
        if(!moddedUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        let args = message.content.split(" ").slice(1);
        let activityType = args[0];
                        
        if(activityType !== undefined){
            try{
                client.user.setStatus(activityType); 
                message.reply("Activity set!");
            }
            catch(err){
                message.reply("ERROR. `"+prefix+"activity (online/dnd/away/invisible)`")
            }
        }
        else{
            message.reply("ERROR. `"+prefix+"activity (online/dnd/away/invisible)`");
        }
    }
    invwipe(message, sql, moddedUsers, prefix){
        if(!moddedUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        else if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }
        let args = message.content.split(" ").slice(1);
        let userId = args[0];
        let banReason = args.slice(1).join(" ");

        if(userId !== undefined){
            if(userId == ""){
                message.reply("You forgot an ID! `"+prefix+"invwipe <id> <reason>`");
            }
            else{
                if(banReason == undefined || banReason == ""){
                    banReason = "No reason provided.";
                }
                try{
                    methods.getinventorycode(message, sql, cryptor, userId).then(result => {
                        methods.inventorywipe(sql,userId);
                        const embedInfo = new Discord.RichEmbed()
                        .setTitle("`"+client.users.get(userId).tag + " : " + userId + "` **Data**")
                        .setDescription("User inventory code:\n" + result.invCode)
                        .addField("User", result.objArray.slice(0,result.objArray.length/2), true)
                        .addField("Data", result.objArray.slice(result.objArray.length/2,100), true)
                        .setTimestamp()
                        .setColor(11346517)
                        message.reply("Inventory cleared for `"+client.users.get(userId).tag+"`. A log of their old inventory has been created in <#500467081226223646>.");
                        client.guilds.get("454163538055790604").channels.get("500467081226223646").send(embedInfo);

                        const banMsg = new Discord.RichEmbed()
                        .setAuthor(`❗Inventory Wiped❗`)
                        .setTitle("**A moderator has wiped your inventory!**")
                        .setDescription("`" + banReason + "`")
                        .setColor(13064193)
                        .setFooter("https://lootcord.com | Only moderators can send you messages.")
                        client.users.get(userId).send(banMsg);
                    });
                }
                catch(err){
                    message.reply("Error wiping inventory: ```"+err+"```")
                }
            }
        }
        else{
            message.reply("This command wipes a users inventory. `"+prefix+"invwipe <id> <reason>`");
        }
    }
    getinv(message, sql, moddedUsers, prefix){
        if(!moddedUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        let args = message.content.split(" ").slice(1);
        let userID = args[0];

        methods.getinventorycode(message, sql, cryptor, userID).then(result => {
            const embedInfo = new Discord.RichEmbed()
            .setTitle("`"+client.users.get(userID).tag + " : " + userID + "` **Data**")
            .setDescription("User inventory code:\n```" + result.invCode + "```")
            .setThumbnail(client.users.get(userID).avatarURL)
            .addField("User", result.objArray.slice(0,result.objArray.length/2), true)
            .addField("Data", result.objArray.slice(result.objArray.length/2, result.objArray.length), true)
            //.addField("User1", result.objArray.slice(result.objArray.length/4 * 2, result.objArray.length/4 *3), true)
            //.addField("Data1", result.objArray.slice(result.objArray.length/4 * 3, result.objArray.length), true)
            .setFooter(result.objArrayLength)
            .setTimestamp()
            .setColor(11346517)
            message.channel.send(embedInfo);
        });
    }
    restoreinv(message, sql, moddedUsers, prefix){
        if(!moddedUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        else if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }
        let args = message.content.split(" ").slice(1);
        let invCode = args[0];
        let decoded = "";
        try{
            decoded = cryptor.decode(invCode);
        }
        catch(err){
            return message.reply("Not a valid code:\n```" + err + "```");
        }
        let da = []; //data array
        da = decoded.split("|");
        let userId = da[0];

        if(da.length < 100){
            message.reply("Not a valid code. `" + prefix + "restoreinv <code>`");
        }
        else{
            message.reply("Inventory successfully restored for " + client.users.get(userId).tag);
            sql.run(`UPDATE items SET item_box = ${da[1]}, rpg = ${da[2]}, rocket = ${da[3]}, ak47 = ${da[4]}, rifle_bullet = ${da[5]}, 
            rock = ${da[6]}, arrow = ${da[7]}, fork = ${da[8]}, club = ${da[9]}, sword = ${da[10]}, bow = ${da[11]}, pistol_bullet = ${da[12]}, glock = ${da[13]}, crossbow = ${da[14]}, 
            spear = ${da[15]}, thompson = ${da[16]}, health_pot = ${da[17]}, ammo_box = ${da[18]}, javelin = ${da[19]}, awp = ${da[20]}, m4a1 = ${da[21]}, spas = ${da[22]}, 
            medkit = ${da[23]}, revolver = ${da[24]}, buckshot = ${da[25]}, blunderbuss = ${da[26]}, grenade = ${da[27]}, pills = ${da[28]}, bat = ${da[29]}, 
            baseball = ${da[30]}, peck_seed = ${da[31]}, iron_shield = ${da[32]}, gold_shield = ${da[33]}, ultra_box = ${da[34]}, rail_cannon = ${da[35]}, plasma = ${da[36]}, 
            fish = ${da[37]}, bmg_50cal = ${da[38]}, token = ${da[39]}, candycane = ${da[40]}, gingerbread = ${da[42]}, mittens = ${da[41]}, stocking = ${da[43]}, 
            snowball = ${da[44]}, nutcracker = ${da[45]}, screw = ${da[49]}, steel = ${da[48]}, adhesive = ${da[47]}, fiber_optics = ${da[50]}, module = ${da[46]}, 
            ray_gun = ${da[51]}, golf_club = ${da[52]}, ultra_ammo = ${da[53]}, stick = ${da[54]}, reroll_scroll = ${da[55]}, xp_potion = ${da[56]},
            canvas_bag = ${da[57]}, light_pack = ${da[58]}, hikers_pack = ${da[59]}, golden_egg = ${da[60]}, easter_egg = ${da[61]}, bunny = ${da[62]}, carrot = ${da[63]},
            candy_egg = ${da[64]}, tnt_egg = ${da[65]} WHERE userId = ${userId}`);

            sql.run(`UPDATE scores SET money = ${da[66]}, points = ${da[67]}, level = ${da[68]}, health = ${da[69]}, maxHealth = ${da[70]}, stats = ${da[89]}, used_stats = ${da[92]}, 
            scaledDamage = ${da[91]}, luck = ${da[90]}, kills = ${da[87]}, deaths = ${da[86]}, inv_slots = ${da[94]}, backpack = '${da[95]}', armor = '${da[96]}' WHERE userId = ${userId}`);
        }
    }
    
    //ADMIN COMMANDS
    addgamecode(message, sql, adminUsers){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let gameName = args[0];
        let gameAmount = args[1];
        let gamePrice = args[2];
        let gameCurrency = args[3];
        let gameDisplay = args.slice(4).join(" ");

        if(gameDisplay == undefined || gameName == undefined || gameAmount == undefined || gamePrice == undefined || gameCurrency == undefined){
            return message.reply("ERROR ADDING GAME:\n`addgamecode <game_sql_name> <Amount to sell> <game price> <currency to purchase with> <game name to display>`");
        }
        else{
            sql.run(`CREATE TABLE IF NOT EXISTS gamesData (gameName STRING, gameAmount INTEGER, gamePrice INTEGER, gameCurrency INTEGER, gameDisplay STRING)`);
            sql.run("INSERT INTO gamesData (gameName, gameAmount, gamePrice, gameCurrency, gameDisplay) VALUES (?, ?, ?, ?, ?)", [gameName, parseInt(gameAmount), parseInt(gamePrice), gameCurrency, gameDisplay]);
            message.reply("Game added!")
        }
    }
    removegamecode(message, sql, adminUsers){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let gameName = args[0];
        try{
            sql.run(`DELETE FROM gamesData WHERE gameName = '${gameName}'`);
            message.reply("success")
        }
        catch(err){
            message.reply("Error removing game `removegamecode <game_name>`: ```" + err + "```");
        }
    }
    modadd(message, sql, adminUsers, moddedUsers, prefix){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let modderId = args[0];

        if(modderId !== undefined){
            const modMsg = new Discord.RichEmbed()
            .setAuthor(`😃Congratulations!!😃`)
            .setTitle("**" + message.author.tag + "** made you a moderator!")
            .setDescription("Use `t-modhelp` to see your fancy new commands!")
            .setFooter("You can use mod commands in the Lootcord Workshop moderator channel")
            .setColor(720640)
            if(modderId == ""){
                message.reply("You forgot an ID! `"+prefix+"modadd (ID)`");
            }
            else{
                try{
                    moddedUsers.add(modderId);
                    sql.run("INSERT INTO mods (userId) VALUES (?)", [modderId]);
                    client.users.get(modderId).send(modMsg);
                    message.reply("User has been added to the moderator list!");
                }
                catch(err){
                    message.reply("Something went wrong. Make sure you input the correct info.")
                }
            }
        }
        else{
            message.reply("ERROR. `"+prefix+"modadd (ID)`");
        }
    }
    unmod(message, sql, adminUsers, moddedUsers, prefix){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let modderId = args[0];
                          
        if(modderId !== undefined){
            
            if(modderId == ""){
                message.reply("You forgot an ID! `"+prefix+"unmod (ID)`");
            }
            else{
                const demodMsg = new Discord.RichEmbed()
                .setAuthor(`❗You have been demodded❗`)
                .setTitle("**An admin demodded you!**")
                .setColor(13064193)
                try{
                    moddedUsers.delete(modderId);
                    sql.run(`DELETE FROM mods WHERE userId ="${modderId}"`);
                    client.users.get(modderId).send(demodMsg);
                    message.reply("User has been remove from the moderator list!");
                }
                catch(err){
                    message.reply("Something went wrong. Make sure you input the correct info.")
                }
            }
        }
        else{
            message.reply("ERROR. `"+prefix+"unmod (ID)`");
        }
    }
    getmods(message, sql, adminUsers, moddedUsers, prefix){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        try{
            let moddedList = [];
            sql.all(`SELECT userId FROM mods`).then(row => {
                row.forEach((moderatorId) => {
                    if(moderatorId.userId !== undefined && moderatorId.userId !== null){
                        moddedUsers.add(moderatorId.userId);
                    }
                });
            });
            moddedUsers.forEach(function(value) {
                moddedList.push(client.users.get(value).tag + " ID: " + value);
            });
            const modMsg = new Discord.RichEmbed()
            .setAuthor(`Moderator list`)
            .setDescription(moddedList)
            .setColor(720640)
            .setFooter("Mods list refreshed.")
            message.channel.send(modMsg);
        }
        catch(err){
            message.reply("Something went wrong. Make sure you input the correct info.")
        }
    }
    addcash(message, sql, adminUsers, prefix){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let userNameID = args[0];
        
        let amount = args[1];
                          
        if(userNameID !== undefined){
            if(amount == undefined){
                message.reply("You forgot to put an amount! `"+prefix+"addmoney (ID) (AMOUNT)`");
            }
            else{
                try{
                    sql.get(`SELECT * FROM scores WHERE userId ="${userNameID}"`).then(row => {
                        sql.run(`UPDATE scores SET money = ${parseInt(row.money) + parseInt(amount)} WHERE userId = ${userNameID}`);
                        message.reply(amount + " added to user!");
                    });
                }
                catch(err){
                    message.reply("Something went wrong. Make sure you input the correct info.")
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by the amount. `"+prefix+"addcash (ID) (AMOUNT)`");
        }
    }
    additem(message, sql, adminUsers, prefix){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let userNameID = args[0];
        
        let itemName = args[1];
        itemName = methods.getCorrectedItemInfo(itemName, false, false);
        let itemAmount = args[2];
                          
        if(userNameID !== undefined){
            if(userNameID == "me"){
                userNameID = message.author.id;
            }
            if(itemName == ""){
                message.reply("You forgot to put an item! `"+prefix+"additem (ID) (ITEM) (AMOUNT)`");
            }
            else if(itemdata[itemName] == undefined){
                message.reply("That item isn't in my database!");
            }
            else{
                try{
                    sql.get(`SELECT * FROM items WHERE userId ="${userNameID}"`).then(row => {
                        sql.run(`UPDATE items SET [${itemName}] = ${eval(`row.${itemName}`) + parseInt(itemAmount)} WHERE userId = ${userNameID}`);
                        message.reply(itemAmount + "x " + itemName + " added to user!");
                    });
                }
                catch(err){
                    message.reply("Something went wrong. Items must be spelled exactly as they are in data table.")
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by the item. `"+prefix+"additem (ID) (ITEM) (AMOUNT)`");
        }
    }
    addpoints(message, sql, adminUsers, prefix){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let userNameID = args[0];
        
        let amount = args[1];
        if(userNameID !== undefined){
            if(amount == undefined){
                message.reply("You forgot to put an amount! `"+prefix+"addpoints (ID) (AMOUNT)`");
            }
            else{
                try{
                    sql.get(`SELECT * FROM scores WHERE userId ="${userNameID}"`).then(row => {
                        sql.run(`UPDATE scores SET points = ${parseInt(row.points) + parseInt(amount)} WHERE userId = ${userNameID}`);
                        message.reply(amount + " points added to user!");
                    });
                }
                catch(err){
                    message.reply("Something went wrong. Make sure you input the correct info.")
                }
            }
        }
        else{
            message.reply("Please use the user ID followed by the amount. `"+prefix+"addpoints (ID) (AMOUNT)`");
        }
    }
    cdclear(message, sql, adminUsers, prefix){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let userId = args[0];

        if(userId !== undefined){
            if(userId == ""){
                message.reply("You forgot an ID! `"+prefix+"cdclear (ID)`");
            }
            else{
                try{
                    voteCooldown.delete(userId);
                    scrambleCooldown.delete(userId);
                    triviaUserCooldown.delete(userId);
                    hourlyCooldown.delete(userId);
                    gambleCooldown.delete(userId);
                    healCooldown.delete(userId);
                    deactivateCooldown.delete(userId);
                    activateCooldown.delete(userId);
                    deleteCooldown.delete(userId);
                    weapCooldown.delete(userId);
                    eventCooldown.delete(userId);
                    sql.run(`UPDATE scores SET voteTime = ${0}, scrambleTime = ${0}, triviaTime = ${0}, hourlyTime = ${0}, gambleTime = ${0}, 
                    healTime = ${0}, deactivateTime = ${0}, activateTime = ${0}, attackTime = ${0}, _15mCD = ${0}, _30mCD = ${0}, _45mCD = ${0},
                    _60mCD = ${0}, _80mCD = ${0}, _100mCD = ${0}, _120mCD = ${0} WHERE userId = ${userId}`);
                    message.reply("Cooldowns cleared for user.");
                }
                catch(err){
                    message.reply("Error clearing cooldowns: ```"+err+"```")
                }
            }
        }
        else{
            message.reply("This command wipes all **command** cooldowns for a user. `"+prefix+"cdclear <ID>`");
        }
    }
    buffclean(message, sql, adminUsers, prefix){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        let args = message.content.split(" ").slice(1);
        let userId = args[0];

        if(userId !== undefined){
            if(userId == ""){
                message.reply("You forgot an ID! `"+prefix+"buffclean (ID)`");
            }
            else{
                try{
                    peckCooldown.delete(userId);
                    mittenShieldActive.delete(userId);
                    ironShieldActive.delete(userId);
                    goldShieldActive.delete(userId);
                    sql.run(`UPDATE scores SET peckTime = ${0}, mittenShieldTime = ${0}, ironShieldTime = ${0}, goldShieldTime = ${0} WHERE userId = ${userId}`);
                    message.reply("Shields/debuffs cleaned for user.");
                }
                catch(err){
                    message.reply("Error clearing cooldowns: ```"+err+"```")
                }
            }
        }
        else{
            message.reply("This command clears user of all buffs/debuffs including peck_seed effects, and shields. `"+prefix+"buffclean <ID>`");
        }
    }
    eval(message, sql, adminUsers){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        let commandInput = message.content.substring(6);
        try{
            let evaled = eval(commandInput);
            if(typeof evaled !== "string") evaled = require("util").inspect(evaled);
            message.channel.send(evaled, {code:"x1"});
        }
        catch(err){
            message.reply("Something went wrong. Command only works with `t-` prefix. ```"+err+"```");
        }
    }
    fullwipe(message, sql, adminUsers){
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        message.reply("You are about to wipe everyones inventories on the bot.\n**Continue?**").then(botMessage => {
            botMessage.react('✅').then(() => botMessage.react('❌'));
            const filter = (reaction, user) => {return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;};
            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    botMessage.edit("Backing up...");
                    fs.copyFile('score.sqlite', './backups/backup.sqlite', (err) => {
                        if(err) throw err;
                    });
                    botMessage.edit("Wiping...");
                    
                    sql.run(`DELETE FROM userGuilds`);
                    methods.monthlywipe(sql);

                    botMessage.edit("Wiped");
                }
                else{
                    botMessage.delete();
                }
            }).catch(collected => {
                botMessage.delete();
                message.reply("You didn't react in time!" + collected);
            });
        });
    }
}

module.exports = new Commands();