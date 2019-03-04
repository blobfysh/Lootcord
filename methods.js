const Discord = require("discord.js");
const helpCmd = require('./json/_help_commands.json'); //opens help commands .json file
const seedrandom = require('seedrandom');
var rng = seedrandom();

class Methods {
    //GENERAL FUNCTIONS, CAN BE USED BY MULTIPLE COMMANDS
    additem(sql, userId, item, amount){
        sql.get(`SELECT * FROM items WHERE userId ="${userId}"`).then(row => {
            if(Array.isArray(item)){
                if(item.length == 0){
                    return;
                }
                for(var i=0; i < item.length; i++){
                    //do stuff for each item
                    //store amounts in array as ["rock|5","ak47|2"] then use split("|")
                    let itemToCheck = item[i].split("|");
                    sql.run(`UPDATE items SET ${itemToCheck[0]} = ${eval(`row.${itemToCheck[0]}`) + parseInt(itemToCheck[1])} WHERE userId = ${userId}`);
                }
            }
            else{
                sql.run(`UPDATE items SET ${item} = ${eval(`row.${item}`) - amount} WHERE userId = ${userId}`);
            }
        });
    }
    addmoney(sql, userId, amount){
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            console.log((row.money + amount) + " money after addition");
            sql.run(`UPDATE scores SET money = ${row.money + amount} WHERE userId = ${userId}`);
        });
    }
    removemoney(sql, userId, amount){
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            console.log((row.money - amount) + " money after subtraction");
            sql.run(`UPDATE scores SET money = ${row.money - amount} WHERE userId = ${userId}`);
        });
    }
    trademoney(sql, user1Id, user1Amount, user2Id, user2Amount){
        sql.get(`SELECT * FROM scores WHERE userId ="${user1Id}"`).then(row1 => {
            sql.run(`UPDATE scores SET money = ${row1.money - user1Amount} WHERE userId = ${user1Id}`);
            sql.get(`SELECT * FROM scores WHERE userId ="${user1Id}"`).then(row2 => {
                sql.run(`UPDATE scores SET money = ${row2.money + user2Amount} WHERE userId = ${user1Id}`);
                sql.get(`SELECT * FROM scores WHERE userId ="${user2Id}"`).then(row3 => {
                    sql.run(`UPDATE scores SET money = ${row3.money - user2Amount} WHERE userId = ${user2Id}`);
                    sql.get(`SELECT * FROM scores WHERE userId ="${user2Id}"`).then(row3 => {
                        sql.run(`UPDATE scores SET money = ${row3.money + user1Amount} WHERE userId = ${user2Id}`);
                    });
                });
            });
        });
    }
    removeitem(sql, userId, item, amount){
        sql.get(`SELECT * FROM items WHERE userId ="${userId}"`).then(row => {
            if(Array.isArray(item)){
                if(item.length == 0){
                    return;
                }
                for(var i=0; i < item.length; i++){
                    //do stuff for each item
                    //store amounts in array as ["rock|5","ak47|2"] then use split("|")
                    let itemToCheck = item[i].split("|");
                    sql.run(`UPDATE items SET ${itemToCheck[0]} = ${eval(`row.${itemToCheck[0]}`) - parseInt(itemToCheck[1])} WHERE userId = ${userId}`);
                }
            }
            else{
                sql.run(`UPDATE items SET ${item} = ${eval(`row.${item}`) - amount} WHERE userId = ${userId}`);
            }
        });
    }
    hasmoney(sql, userId, amount){//PROMISE FUNCTION
        return sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            if(row.money >= amount){
                return true;
            }
            else{
                return false;
            }
        });
    }
    hasitems(sql, userId, item, amount){//PROMISE FUNCTION
        return sql.get(`SELECT * FROM items WHERE userId ="${userId}"`).then(row => {
            if(Array.isArray(item)){
                if(item.length == 0){
                    return true;
                }
                for (var i = 0; i < item.length; i++) {
                    //do stuff for each item
                    let itemToCheck = item[i].split("|");
                    if(eval(`row.${itemToCheck[0]}`) >= itemToCheck[1]){
                        if(i == item.length - 1){
                            return true;
                        }
                    }
                    else{
                        return false;
                    }
                }
            }
            else{
                if(eval(`row.${item}`) >= amount){
                    return true;
                }
                else{
                    return false;
                }
            }
        });
    }
    getCorrectedItemInfo(itemName, isImage, isEvaled){
        let itemImg = "";
        let itemSearched = itemName.toLowerCase();
        isEvaled = (isEvaled == undefined) ? true : isEvaled;
        if(itemName == "rpg"){
            itemImg = "https://cdn.discordapp.com/attachments/454163538886524928/462539395078029313/Pixel_RPG.png";
        }
        else if(itemName == "item_box" || itemName == "box" || itemName == "item"){
            if(isEvaled) itemSearched = "BOX";
            else itemSearched = "ITEM_BOX";
            
            itemImg = "https://cdn.discordapp.com/attachments/454163538886524928/499746695370768408/thanbox_emptysmall.png";
        }
        else if(itemName == "ammo_box" || itemName == "ammo"){
            if(isEvaled) itemSearched = "AMMOBOX";
            else itemSearched = "AMMO_BOX";
            itemImg = "https://cdn.discordapp.com/attachments/313880100934385666/493258973160407040/Military_health_kit_custom.png";
        }
        else if(itemName == "ultra" || itemName == "ultrabox" || itemName =="ultra_box"){
            itemSearched = "ULTRA_BOX";
        }
        else if(itemName == "rail" || itemName == "cannon" || itemName == "railcannon" || itemName == "rail_cannon"){
            itemSearched = "RAIL_CANNON";
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501195476775993355/Rail_Cannon.png";
        }
        else if(itemName == "thompson"){
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501129603536912395/Thanpson.png";
        }
        else if(itemName == "javelin"){
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501129550617509918/Javelin.png";
        }
        else if(itemName == "rifle_bullet"){
            if(isEvaled) itemSearched = "RIFLEBULLET";
            else itemSearched = "RIFLE_BULLET";
        }
        else if(itemName == "bmg" || itemName == "50cal" || itemName =="bmg_50cal"){
            itemSearched = "BMG_50CAL";
        }
        else if(itemName == "ray" || itemName == "raygun" || itemName =="ray_gun"){
            itemSearched = "RAY_GUN";
        }
        else if(itemName.startsWith("stick")){
            itemSearched = "STICK";
            itemImg = "https://cdn.discordapp.com/attachments/454163538886524928/543899419276214277/455435423200575500.png";
        }
        else if(itemName.startsWith("golf")){
            itemSearched = "GOLF_CLUB";
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501129547316461578/Golf_club_aka_stick_for_those_who_dont_know_what_a_golf_club_is.png";
        }
        else if(itemName.startsWith("ultra_a") || itemName.startsWith("ultraa")){
            itemSearched = "ULTRA_AMMO";
        }
        else if(itemName == "fiber" || itemName == "optics" || itemName =="fiberoptics" || itemName =="fiber_optics"){
            itemSearched = "FIBER_OPTICS";
        }
        else if(itemName == "gold" || itemName == "goldshield" || itemName == "gold_shield"){
            itemSearched = "GOLD_SHIELD";
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501961870706737182/Armor_of_Gold.png";
        }
        else if(itemName == "iron" || itemName == "shield"){
            itemSearched = "IRON_SHIELD";
        }
        else if(itemName == "peck" || itemName == "peckseed" || itemName == "peck_seed"){
            itemSearched = "PECK_SEED";
        }
        else if(itemName == "awp"){
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501129528911855657/AWP_green.png";
        }
        else if(itemName == "fish"){
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501129543340261398/Fish_AI.png";
        }
        else if(itemName == "plasma"){
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501272967909605376/Plasma_mags.png";
        }
        else if(itemName == "arrow"){
            itemImg = "https://cdn.discordapp.com/attachments/454163538886524928/501139012912676889/arrow.png";
        }
        else if(itemName == "fork"){
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501129596838739969/Thanfork.png";
        }
        else if(itemName == "club"){
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501129591629414400/Simple_Club.png";
        }
        else if(itemName == "sword"){
            
        }
        else if(itemSearched == "bow"){
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/501129557609283585/Long_Bow.png";
        }
        else if(itemSearched == "pistol_bullet"){
            if(isEvaled) itemSearched = "PISTOLBULLET";
            else itemSearched = "PISTOL_BULLET";
        }
        else if(itemSearched == "ak47"){
            itemImg = "https://cdn.discordapp.com/attachments/501120454136692737/508391183676997632/Ak47.png";
        }
        else if(itemSearched == "crossbow"){
            
        }
        else if(itemSearched == "spear"){
            
        }
        else if(itemSearched == "health_pot" || itemSearched == "health"){
            if(isEvaled) itemSearched = "HEALTH";
            else itemSearched = "HEALTH_POT";
        }
        else if(itemSearched.startsWith("xp")){
            itemSearched = "XP_POTION";
            itemImg = "https://cdn.discordapp.com/attachments/454163538886524928/550331631521628172/xp_potion.png";
        }
        else if(itemSearched.startsWith("reroll")){
            itemSearched = "REROLL_SCROLL";
        }
        //RETURN VALUES BELOW
        if(isImage){
            //return image url
            return itemImg;
        }
        else{
            //return item name corrected if misspelled
            return itemSearched.toLowerCase();
        }
    }
    commandhelp(message, command, prefix){
        try{
            for(var i = 0; i < Object.keys(helpCmd).length; i++){
                if(helpCmd[i].lookup.includes(command.toLowerCase())){
                    let cmdUsage = [];
                    let cmdExamples = [];
                    for(var i2 = 0; i2 < helpCmd[i].usage.length; i2++){
                        cmdUsage.push("`"+prefix+helpCmd[i].usage[i2])
                    }
                    for(var i3 = 0; i3 < helpCmd[i].example.length; i3++){
                        cmdExamples.push("`"+prefix+helpCmd[i].example[i3]+"`")
                    }
                    const helpInfo = new Discord.RichEmbed()
                    .setTitle(helpCmd[i].command+" Command Info 🔎")
                    .setColor(13215302)
                    if(helpCmd[i].example[0].length > 0){helpInfo.setDescription("Example: "+cmdExamples.join(", ") + "\n\n**" + helpCmd[i].description+"**")}else{helpInfo.setDescription("**"+helpCmd[i].description+"**")}
                    helpInfo.addField("Usage", cmdUsage.join("\n"))
                    if(helpCmd[i].options !== ""){helpInfo.addField("Options", helpCmd[i].options)}
                    if(helpCmd[i].cooldown !== ""){helpInfo.addField("Cooldown", helpCmd[i].cooldown)}
                    if(helpCmd[i].imageURL && helpCmd[i].imageURL !== ""){helpInfo.setImage(helpCmd[i].imageURL)}
                    message.channel.send(helpInfo);
                    return;
                }
                else if(Object.keys(helpCmd).length - 1 === i){
                    message.reply("❌ That command doesn't exist!");
                }
            }
        }
        catch(err){
            //continue to post help command
            console.log(err)
        }
    }

    //USE COMMAND
    randomItems(sql, fullItemList, killerId, victimId, amount){
        return sql.get(`SELECT * FROM items WHERE userId ="${victimId}"`).then(victimItems => {
            return sql.get(`SELECT * FROM items WHERE userId ="${killerId}"`).then(killerItems => { 
                if(amount <= 0){
                    return selected = "They had no items you could steal!";
                }
                let victimItemsList = [];

                for (var i = 0; i < fullItemList.length; i++) {
                    if(eval(`victimItems.` + fullItemList[i])){
                        if(fullItemList[i] !== "token"){
                            victimItemsList.push(fullItemList[i]);
                        }
                    }
                }
                const shuffled = victimItemsList.sort(() => 0.5 - Math.random()); //shuffles array of items
                var selected = shuffled.slice(0, amount); //picks random items
                
                for (var i = 0; i < selected.length; i++) {
                    //add items to killers inventory, take away from victims
                    sql.run(`UPDATE items SET ${selected[i]} = ${eval(`killerItems.` + selected[i]) + 1} WHERE userId = ${killerId}`);
                    sql.run(`UPDATE items SET ${selected[i]} = ${eval(`victimItems.` + selected[i]) - 1} WHERE userId = ${victimId}`);
                }
                return selected.join("\n");
            });
        });
    }
    addxp(message, sql, amount, userId){
        sql.get(`SELECT * FROM items i
                JOIN scores s
                ON i.userId = s.userId
                WHERE s.userId="${userId}"`).then(row => {  
            if(xpPotCooldown.has(message.author.id)){
                message.reply("You need to wait  `" + ((180 * 1000 - ((new Date()).getTime() - row.xpTime)) / 1000).toFixed(0) + " seconds`  before using another `xp_potion`.");
                return;
            }
            sql.run(`UPDATE scores SET xpTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
            xpPotCooldown.add(message.author.id);
            setTimeout(() => {
                xpPotCooldown.delete(message.author.id);
                sql.run(`UPDATE scores SET xpTime = ${0} WHERE userId = ${message.author.id}`);
            }, 180 * 1000);

            sql.run(`UPDATE items SET xp_potion = ${row.xp_potion - 1} WHERE userId = ${userId}`);
            sql.run(`UPDATE scores SET points = ${row.points + amount} WHERE userId = ${userId}`);
            let msgEmbed = new Discord.RichEmbed()
            .setAuthor(message.member.displayName, message.author.avatarURL)
            .setTitle("Successfully used `xp_potion`")
            .setDescription("Gained **"+amount+" XP**!")
            .setColor(14202368)
            message.channel.send(msgEmbed);
        });
    }
    resetSkills(message, sql, userId){
        sql.get(`SELECT * FROM items i
                JOIN scores s
                ON i.userId = s.userId
                WHERE s.userId="${userId}"`).then(row => {
            let usedStatPts = row.used_stats;
            sql.run(`UPDATE items SET reroll_scroll = ${row.reroll_scroll - 1} WHERE userId = ${userId}`);
            sql.run(`UPDATE scores SET stats = ${row.stats + usedStatPts} WHERE userId = ${userId}`);
            sql.run(`UPDATE scores SET maxHealth = ${100} WHERE userId = ${userId}`);
            sql.run(`UPDATE scores SET luck = ${0} WHERE userId = ${userId}`);
            sql.run(`UPDATE scores SET scaledDamage = ${1.00} WHERE userId = ${userId}`);
            sql.run(`UPDATE scores SET used_stats = ${0} WHERE userId = ${userId}`);
            if(row.health > 100){
                sql.run(`UPDATE scores SET health = ${100} WHERE userId = ${userId}`);
            }
            let msgEmbed = new Discord.RichEmbed()
            .setAuthor(message.member.displayName, message.author.avatarURL)
            .setTitle("Successfully used 📜`reroll_scroll`")
            .setDescription("Restored **"+usedStatPts+"** skill points.")
            .setFooter("Attributes reset.")
            .setColor(14202368)
            message.channel.send(msgEmbed);
        });
    }

    //GAMBLE SUBCOMMANDS
    roulette(message, sql, userId, amount){
        let multiplier = 1.2;
        let winnings = Math.floor(amount * multiplier);
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            let luck = row.luck >= 20 ? 10 : Math.floor(row.luck/2);
            let chance = Math.floor(Math.random() * 100) + luck; //return 1-100
            if(chance <= 20){
                let healthDeduct = 50;
                if(row.health <= 50){
                    healthDeduct = row.health - 1;
                    sql.run(`UPDATE scores SET health = ${1} WHERE userId = ${userId}`);
                }
                else{
                    sql.run(`UPDATE scores SET health = ${row.health - 50} WHERE userId = ${userId}`);
                }
                message.reply("***Click***").then(msg => {
                    setTimeout(() => {
                        msg.edit(message.author + ", 💥 The gun fires! You took *" + healthDeduct + "* damage and now have **" + (row.health - healthDeduct) + " health**. Oh, and you also lost $" + amount);
                    }, 1500);
                });
            }
            else{
                sql.run(`UPDATE scores SET money = ${row.money + winnings} WHERE userId = ${message.author.id}`);
                message.reply("***Click***").then(msg => {
                    setTimeout(() => {
                        msg.edit(message.author + ", You survived! Your winnings are: $" + winnings + " 💵");
                    }, 1500);
                });
            }
        });
    }
    slots(message, sql, userId, amount){
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            let mainRowGif = "<a:_slots:547282654920179722>";
            let topRowGif = "<a:_slotsBOT:547787994258472980>";
            let botRowGif = "<a:_slotsTOP:547787986696142848>";
            let slotEmotes = ["<:UnboxCommon:526248905676029968>","<:UnboxRare:526248948579434496>","<:UnboxEpic:526248961892155402>","<:UnboxLegendary:526248970914234368>"];
            let col1 = [];
            let col2 = [];
            let col3 = [];
            let slotFinal = [];
            
            let winnings = 0;
            let rewardMltp = 0.00; //used to check if user wins, also multiplies the amount user entered

            let template = "⬛"+topRowGif+topRowGif+topRowGif+"⬛\n▶"+mainRowGif+mainRowGif+mainRowGif+"◀\n⬛"+botRowGif+botRowGif+botRowGif+"⬛";
            let slotEmbed = new Discord.RichEmbed()
            .setAuthor(message.member.displayName, message.author.avatarURL)
            .setTitle(" --**SLOT MACHINE**--")
            .setDescription(template)
            let luck = row.luck >= 30 ? 30 : Math.floor(row.luck);
            console.log(luck);
            for(var i = 1; i <= 3; i++){
                let chance = Math.floor(rng() * 200) + luck;
                console.log("chance : "+ chance)
                if(chance <= 100){
                    //unbox common
                    eval("col"+i+".push(slotEmotes[3],slotEmotes[0],slotEmotes[1]);");
                    slotFinal.push("common");
                    console.log("col"+i+" is COMMON");
                }
                else if(chance <= 150){
                    //unbox rare
                    eval("col"+i+".push(slotEmotes[0],slotEmotes[1],slotEmotes[2]);");
                    slotFinal.push("rare");
                    console.log("col"+i+" is RARE");
                }
                else if(chance <= 180){
                    eval("col"+i+".push(slotEmotes[1],slotEmotes[2],slotEmotes[3]);");
                    slotFinal.push("epic");
                    console.log("col"+i+" is EPIC");
                }
                else{
                    //legend
                    eval("col"+i+".push(slotEmotes[2],slotEmotes[3],slotEmotes[0]);");
                    slotFinal.push("legend");
                    console.log("col"+i+" is legend");
                }
            }
            if(slotFinal[0] == slotFinal[1] && slotFinal[1] == slotFinal[2]){
                //all 3 match
                if(slotFinal[0] == "common"){
                    //1x
                    rewardMltp = 2.00;
                }
                else if(slotFinal[0] == "rare"){
                    //3x
                    rewardMltp = 3.00;
                }
                else if(slotFinal[0] == "epic"){
                    //4x
                    rewardMltp = 6.00;
                }
                else if(slotFinal[0] =="legend"){
                    //10x
                    rewardMltp = 10.00;
                }
                console.log("ALL 3 MATCH!")
            }
            else if(slotFinal[0] == slotFinal[1] || slotFinal[1] == slotFinal[2]){
                //2 of the same on left or right sides
                if(slotFinal[1] == "common"){
                    rewardMltp = 1.00;
                }
                else if(slotFinal[1] == "rare"){
                    //1.5x
                    rewardMltp = 1.50;
                }
                else if(slotFinal[1] == "epic"){
                    //3x
                    rewardMltp = 3.00;
                }
                else if(slotFinal[1] =="legend"){
                    //4x
                    rewardMltp = 5.00;
                }
            }
            winnings = Math.floor(amount * rewardMltp);
            sql.run(`UPDATE scores SET money = ${row.money + winnings} WHERE userId = ${message.author.id}`);
            message.channel.send(slotEmbed).then(msg => {
                let slots1 = "⬛"+col1[0]+topRowGif+topRowGif+"⬛\n"+
                                "▶"+col1[1]+mainRowGif+mainRowGif+"◀\n"+
                                "⬛"+col1[2]+botRowGif+botRowGif+"⬛";
                let slots2 = "⬛"+col1[0]+col2[0]+topRowGif+"⬛\n"+
                                "▶"+col1[1]+col2[1]+mainRowGif+"◀\n"+
                                "⬛"+col1[2]+col2[2]+botRowGif+"⬛";
                let slots3 = "";
                if(rewardMltp !== 0.00){
                    slots3 = "⬛"+col1[0]+col2[0]+col3[0]+"⬛\n"+
                                "▶"+col1[1]+col2[1]+col3[1]+`◀ You won **$${winnings}**! (${rewardMltp.toFixed(2)}x)\n`+
                                "⬛"+col1[2]+col2[2]+col3[2]+"⬛";
                }
                else{
                    slots3 = "⬛"+col1[0]+col2[0]+col3[0]+"⬛\n"+
                                "▶"+col1[1]+col2[1]+col3[1]+`◀ You lost!\n`+
                                "⬛"+col1[2]+col2[2]+col3[2]+"⬛ Better luck next time.";
                }
                slotEmbed.setDescription(slots1);
                //send messages
                setTimeout(() => {
                    msg.edit(slotEmbed).then(msg => {setTimeout(() => {
                        slotEmbed.setDescription(slots2);
                        msg.edit(slotEmbed).then(msg => {setTimeout(() => {
                                slotEmbed.setColor(rewardMltp !== 0.00 ? 720640 : 13632027)
                                slotEmbed.setDescription(slots3);
                                msg.edit(slotEmbed);
                            }, 1400);});
                    }, 1000);});
                }, 1000);
            });
        });
    }
    coinflip(message, sql, userId, amount, coinSide){
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            if(coinSide !== "heads" && coinSide !== "tails") coinSide = "heads";
            let oppoSide = coinSide == "heads" ? "tails" : "heads";
            let luck = row.luck >= 20 ? 20 : row.luck;
            let chance = Math.floor(Math.random() * 100) + luck; //return 1-100
            if(chance > 50){
                sql.run(`UPDATE scores SET money = ${row.money + parseInt(amount)} WHERE userId = ${message.author.id}`);
                message.reply("The coin landed on `"+coinSide+"`\nYou just won $" + amount * 2 + "!");
            }
            else{
                message.reply("The coin landed on `"+oppoSide+"`<:peeposad:461045610372530177>\nYou just lost $" + amount + "!");
                sql.run(`UPDATE scores SET money = ${parseInt(row.money - amount)} WHERE userId = ${message.author.id}`);
            }
        });
    }
}

module.exports = new Methods();