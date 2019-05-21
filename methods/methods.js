const Discord = require("discord.js");
const { query } = require('../mysql.js');
const helpCmd = require('../json/_help_commands.json');
const config = require('../json/_config.json');
const itemdata = require("../json/completeItemList");
const fs = require("fs");

class Methods {
    //GENERAL FUNCTIONS, CAN BE USED BY MULTIPLE COMMANDS
    async additem(userId, item, amount){
        const oldRow = await query(`SELECT * FROM items WHERE userId ="${userId}"`);
        const row = oldRow[0];
            
        if(Array.isArray(item)){
            if(item.length == 0){
                return;
            }
            for(var i=0; i < item.length; i++){
                const oldRow2 = await query(`SELECT * FROM items WHERE userId ="${userId}"`);
                const row2 = oldRow2[0];
                //do stuff for each item
                //store amounts in array as ["rock|5","ak47|2"] then use split("|")
                let itemToCheck = item[i].split("|");
                query(`UPDATE items SET ${itemToCheck[0]} = ${row2[itemToCheck[0]] + parseInt(itemToCheck[1])} WHERE userId = ${userId}`);
            }
        }
        else{
            query(`UPDATE items SET ${item} = ${row[item] + amount} WHERE userId = ${userId}`);
        }
    }

    addmoney(userId, amount){
        query(`SELECT * FROM scores WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];
            query(`UPDATE scores SET money = ${parseInt(row.money) + amount} WHERE userId = ${userId}`);
        });
    }
    removemoney(userId, amount){
        query(`SELECT * FROM scores WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];
            query(`UPDATE scores SET money = ${parseInt(row.money) - parseInt(amount)} WHERE userId = ${userId}`);
        });
    }
    trademoney(user1Id, user1Amount, user2Id, user2Amount){
        query(`SELECT * FROM scores WHERE userId ="${user1Id}"`).then(row1 => {
            query(`UPDATE scores SET money = ${parseInt(row1[0].money) - parseInt(user1Amount)} WHERE userId = ${user1Id}`);
            query(`SELECT * FROM scores WHERE userId ="${user1Id}"`).then(row2 => {
                query(`UPDATE scores SET money = ${parseInt(row2[0].money) + parseInt(user2Amount)} WHERE userId = ${user1Id}`);
                query(`SELECT * FROM scores WHERE userId ="${user2Id}"`).then(row3 => {
                    query(`UPDATE scores SET money = ${parseInt(row3[0].money) - parseInt(user2Amount)} WHERE userId = ${user2Id}`);
                    query(`SELECT * FROM scores WHERE userId ="${user2Id}"`).then(row4 => {
                        query(`UPDATE scores SET money = ${parseInt(row4[0].money) + parseInt(user1Amount)} WHERE userId = ${user2Id}`);
                    });
                });
            });
        });
    }
    removeitem(userId, item, amount){
        query(`SELECT * FROM items WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];

            if(Array.isArray(item)){
                if(item.length == 0){
                    return;
                }
                for(var i=0; i < item.length; i++){
                    //do stuff for each item
                    //store amounts in array as ["rock|5","ak47|2"] then use split("|")
                    let itemToCheck = item[i].split("|");
                    query(`UPDATE items SET ${itemToCheck[0]} = ${row[itemToCheck[0]] - parseInt(itemToCheck[1])} WHERE userId = ${userId}`);
                }
            }
            else{
                query(`UPDATE items SET ${item} = ${row[item] - amount} WHERE userId = ${userId}`);
            }
        });
    }
    hasmoney(userId, amount){//PROMISE FUNCTION
        return query(`SELECT * FROM scores WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];

            if(row.money >= amount){
                return true;
            }
            else{
                return false;
            }
        });
    }
    hasitems(userId, item, amount){//PROMISE FUNCTION
        return query(`SELECT * FROM items WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];

            if(Array.isArray(item)){
                if(item.length == 0){
                    return true;
                }
                for (var i = 0; i < item.length; i++) {
                    //do stuff for each item
                    let itemToCheck = item[i].split("|");
                    if(row[itemToCheck[0]] >= parseInt(itemToCheck[1])){
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
                if(row[item] >= amount){
                    return true;
                }
                else{
                    return false;
                }
            }
        });
    }
    getCorrectedItemInfo(itemName = ""){
        let itemSearched = itemName.toLowerCase();

        if(itemSearched == "item_box" || itemSearched == "box" || itemSearched == "item"){
            itemSearched = "ITEM_BOX";
        }
        else if(itemSearched == "ammo_box" || itemSearched == "ammo"){
            itemSearched = "AMMO_BOX";
        }
        else if(itemSearched == "ultra" || itemSearched == "ultrabox" || itemSearched =="ultra_box"){
            itemSearched = "ULTRA_BOX";
        }
        else if(itemSearched == "rail" || itemSearched == "cannon" || itemSearched == "railcannon" || itemSearched == "rail_cannon"){
            itemSearched = "RAIL_CANNON";
        }
        else if(itemSearched == "rifle_bullet" || itemSearched == "rifle"){
            itemSearched = "RIFLE_BULLET";
        }
        else if(itemSearched == "50cal" || itemSearched =="50_cal"){
            itemSearched = "50_CAL";
        }
        else if(itemSearched == "ray" || itemSearched == "raygun" || itemSearched =="ray_gun"){
            itemSearched = "RAY_GUN";
        }
        else if(itemSearched.startsWith("stick")){
            itemSearched = "STICK";
        }
        else if(itemSearched.startsWith("golf")){
            itemSearched = "GOLF_CLUB";
        }
        else if(itemSearched.startsWith("ultra_a") || itemSearched.startsWith("ultraa")){
            itemSearched = "ULTRA_AMMO";
        }
        else if(itemSearched == "fiber" || itemSearched == "optics" || itemSearched =="fiberoptics" || itemSearched =="fiber_optics"){
            itemSearched = "FIBER_OPTICS";
        }
        else if(itemSearched == "gold" || itemSearched == "goldshield" || itemSearched == "gold_shield"){
            itemSearched = "GOLD_SHIELD";
        }
        else if(itemSearched == "iron" || itemSearched == "shield"){
            itemSearched = "IRON_SHIELD";
        }
        else if(itemSearched == "peck" || itemSearched == "peckseed" || itemSearched == "peck_seed"){
            itemSearched = "PECK_SEED";
        }
        else if(itemSearched == "pistol_bullet" || itemSearched == "pistol"){
            itemSearched = "PISTOL_BULLET";
        }
        else if(itemSearched == "health_pot" || itemSearched == "health"){
            itemSearched = "HEALTH_POT";
        }
        else if(itemSearched.startsWith("xp")){
            itemSearched = "XP_POTION";
        }
        else if(itemSearched.startsWith("reroll")){
            itemSearched = "REROLL_SCROLL";
        }
        else if(itemSearched.startsWith("canvas")){
            itemSearched = "CANVAS_BAG";
        }
        else if(itemSearched.startsWith("light")){
            itemSearched = "LIGHT_PACK";
        }
        else if(itemSearched.startsWith("hiker")){
            itemSearched = "HIKERS_PACK";
        }
        else if(itemSearched.startsWith("easter") || itemSearched == "egg"){
            itemSearched = "EASTER_EGG";
        }
        else if(itemSearched.startsWith("golden")){
            itemSearched = "GOLDEN_EGG";
        }
        else if(itemSearched.startsWith("tnt")){
            itemSearched = "TNT_EGG";
        }
        else if(itemSearched.startsWith("candy")){
            itemSearched = "CANDY_EGG";
        }
        else if(itemSearched.startsWith("care") || itemSearched == "package"){
            itemSearched = "CARE_PACKAGE";
        }
        else if(itemSearched.startsWith("cyber")){
            itemSearched = "CYBER_PACK";
        }
        
        return itemSearched.toLowerCase();
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
    getitemcount(userId, cntTokens = false, cntBanners = false){//RETURNS PROMISE
        return query(`SELECT * FROM items WHERE userId ="${userId}"`).then(oldRow => {
            return query(`SELECT * FROM scores WHERE userId ="${userId}"`).then(oldRow2 => {
                const row = oldRow[0];
                const row2 = oldRow2[0];

                var totalItemCt = 0;
                Object.keys(row).forEach(key => {
                    if(key !== "userId"){
                        if(key == "token" && cntTokens){
                            totalItemCt += row[key];
                            //console.log(row[key] + " | " + key);
                        }
                        else if(itemdata[key].isBanner && cntBanners){
                            totalItemCt += row[key];
                        }
                        else if(key !== "token" && !itemdata[key].isBanner){
                            totalItemCt += row[key];
                        }
                    }
                });
                return {
                    itemCt : totalItemCt,
                    capacity : (totalItemCt + "/" + (config.base_inv_slots + row2.inv_slots))
                }
            });
        });
    }
    hasenoughspace(userId, amount = 0){//RETURNS PROMISE
        return this.getitemcount(userId).then(itemCt => {
            return query(`SELECT * FROM scores WHERE userId ="${userId}"`).then(oldRow => {
                const row = oldRow[0];

                console.log((itemCt.itemCt + parseInt(amount)) + " <= " + (config.base_inv_slots + row.inv_slots));

                if((itemCt.itemCt + parseInt(amount)) <= (config.base_inv_slots + row.inv_slots)) return true;
                else return false;
            });
        });
    }
    getitems(rarity = "all", {type = "", type2 = "", exclude = [], excludeItem = []}){
        rarity = rarity.toLowerCase();
        let items = [];

        Object.keys(itemdata).forEach(key => {
            if(itemdata[key].rarity.toLowerCase() == rarity && !excludeItem.includes(key)){
                if(type == ""){
                    items.push(key);
                }
                else if(type2 ==""){
                    if((type == "weapon" || type == "weap") && itemdata[key].isWeap == true){
                        items.push(key);
                    }
                    else if(type == "ammo" && itemdata[key].isAmmo.length >= 1){
                        items.push(key);
                    }
                    else if((type == "item" || type == "consumable") && itemdata[key].isItem == true){
                        items.push(key);
                    }
                    else if((type == "craft" || type == "craftable") && itemdata[key].craftedWith !== ""){
                        items.push(key);
                    }
                    else if((type == "unboxable") && itemdata[key].unboxable == true){
                        if(exclude.includes("ammo") && itemdata[key].isAmmo.length == 0){
                            items.push(key);
                        }
                        else if(exclude == ""){
                            items.push(key);
                        }
                    }
                }
                else if(type2 == "weapon" && itemdata[key].isWeap == true){
                    if((type == "weapon" || type == "weap") && itemdata[key].isWeap == true){
                        items.push(key);
                    }
                    else if(type == "ammo" && itemdata[key].isAmmo.length >= 1){
                        items.push(key);
                    }
                    else if((type == "item" || type == "consumable") && itemdata[key].isItem == true){
                        items.push(key);
                    }
                    else if((type == "craft" || type == "craftable") && itemdata[key].craftedWith !== ""){
                        items.push(key);
                    }
                    else if((type == "unboxable") && itemdata[key].unboxable == true){
                        items.push(key);
                    }
                }
                else if(type2 == "ammo" && itemdata[key].isAmmo.length >= 1){
                    if((type == "weapon" || type == "weap") && itemdata[key].isWeap == true){
                        items.push(key);
                    }
                    else if(type == "ammo" && itemdata[key].isAmmo.length >= 1){
                        items.push(key);
                    }
                    else if((type == "item" || type == "consumable") && itemdata[key].isItem == true){
                        items.push(key);
                    }
                    else if((type == "craft" || type == "craftable") && itemdata[key].craftedWith !== ""){
                        items.push(key);
                    }
                    else if((type == "unboxable") && itemdata[key].unboxable == true){
                        items.push(key);
                    }
                }
                else if(type2 == "unboxable" && itemdata[key].unboxable == true){
                    if((type == "weapon" || type == "weap") && itemdata[key].isWeap == true){
                        items.push(key);
                    }
                    else if(type == "ammo" && itemdata[key].isAmmo.length >= 1){
                        items.push(key);
                    }
                    else if((type == "item" || type == "consumable") && itemdata[key].isItem == true){
                        items.push(key);
                    }
                    else if((type == "craft" || type == "craftable") && itemdata[key].craftedWith !== ""){
                        items.push(key);
                    }
                    else if((type == "unboxable") && itemdata[key].unboxable == true){
                        items.push(key);
                    }
                }
                else if(type2 == "craft" && itemdata[key].craftedWith !== ""){
                    if((type == "weapon" || type == "weap") && itemdata[key].isWeap == true){
                        items.push(key);
                    }
                    else if(type == "ammo" && itemdata[key].isAmmo.length >= 1){
                        items.push(key);
                    }
                    else if((type == "item" || type == "consumable") && itemdata[key].isItem == true){
                        items.push(key);
                    }
                    else if((type == "craft" || type == "craftable") && itemdata[key].craftedWith !== ""){
                        items.push(key);
                    }
                    else if((type == "unboxable") && itemdata[key].unboxable == true){
                        items.push(key);
                    }
                }
                else if(type2 == "item" && itemdata[key].isItem == true){
                    if((type == "weapon" || type == "weap") && itemdata[key].isWeap == true){
                        items.push(key);
                    }
                    else if(type == "ammo" && itemdata[key].isAmmo.length >= 1){
                        items.push(key);
                    }
                    else if((type == "item" || type == "consumable") && itemdata[key].isItem == true){
                        items.push(key);
                    }
                    else if((type == "craft" || type == "craftable") && itemdata[key].craftedWith !== ""){
                        items.push(key);
                    }
                    else if((type == "unboxable") && itemdata[key].unboxable == true){
                        items.push(key);
                    }
                }
            }
            else if(rarity == "all" && !exclude.includes(itemdata[key].rarity.toLowerCase()) && !excludeItem.includes(key)){
                if(type == ""){
                    items.push(key);
                }
                else if(type == "ammo" && itemdata[key].isAmmo.length){
                    items.push(key);
                }
            }
        });
        return items;
    }
    getuseritems(userId, {sep = "",amounts= false, icon = false, onlyBanners = false}){
        return query(`SELECT * FROM items WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];

            let commonItems   = [];
            let uncommonItems = [];
            let rareItems     = [];
            let epicItems     = [];
            let legendItems   = [];
            let ultraItems    = [];
            let limitedItems  = [];
            let invValue      = 0;

            Object.keys(itemdata).forEach(key => {
                if(onlyBanners && itemdata[key].isBanner){
                    if(row[key] >= 1){
                        addIt(key);
                    }
                }
                else if(!onlyBanners && itemdata[key].isBanner == undefined){
                    if(row[key] >= 1){
                        addIt(key);
                    }
                }
            });

            function addIt(key){
                if(icon){
                    if(itemdata[key].rarity == "Common") commonItems.push(itemdata[key].icon + sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Uncommon") uncommonItems.push(itemdata[key].icon + sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Rare") rareItems.push(itemdata[key].icon + sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Epic") epicItems.push(itemdata[key].icon + sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Legendary") legendItems.push(itemdata[key].icon + sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Ultra") ultraItems.push(itemdata[key].icon + sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Limited") limitedItems.push(itemdata[key].icon + sep + key + sep + "("+row[key]+")");
                }
                else{
                    if(itemdata[key].rarity == "Common") commonItems.push(sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Uncommon") uncommonItems.push(sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Rare") rareItems.push(sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Epic") epicItems.push(sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Legendary") legendItems.push(sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Ultra") ultraItems.push(sep + key + sep + "("+row[key]+")");
                    else if(itemdata[key].rarity == "Limited") limitedItems.push(sep + key + sep + "("+row[key]+")");
                }
                invValue += itemdata[key].sell * row[key];
            }

            return {
                common: commonItems,
                uncommon: uncommonItems,
                rare: rareItems,
                epic: epicItems,
                legendary: legendItems,
                ultra: ultraItems,
                limited: limitedItems,
                invValue: invValue
            }
        });
    }
    formatMoney(money){
       return "$" + (parseInt(money)).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
    }

    //USE COMMAND
    randomItems(killerId, victimId, amount){
        return query(`SELECT * FROM items WHERE userId ="${victimId}"`).then(oldVicItems => {
            const victimItems = oldVicItems[0];
            return query(`SELECT * FROM items WHERE userId ="${killerId}"`).then(oldKillerItems => {
                const killerItems = oldKillerItems[0];

                if(amount <= 0){
                    return selected = "They had no items you could steal!";
                }
                let victimItemsList = [];

                Object.keys(itemdata).forEach(key => {
                    if(victimItems[key] >= 1){
                        if(itemdata[key].canBeStolen){
                            victimItemsList.push(key);
                        }
                    }
                });

                const shuffled = victimItemsList.sort(() => 0.5 - Math.random()); //shuffles array of items
                var selected = shuffled.slice(0, amount); //picks random items
                
                for (var i = 0; i < selected.length; i++) {
                    //add items to killers inventory, take away from victims
                    query(`UPDATE items SET ${selected[i]} = ${eval(`killerItems.` + selected[i]) + 1} WHERE userId = ${killerId}`);
                    query(`UPDATE items SET ${selected[i]} = ${eval(`victimItems.` + selected[i]) - 1} WHERE userId = ${victimId}`);
                }
                return [selected.join('\n'), selected.join(', ')];
            });
        });
    }
    randomUser(message){//returns a random userId from the attackers guild
        return query(`SELECT * FROM userGuilds WHERE guildId ="${message.guild.id}" ORDER BY LOWER(userId)`).then(rows => {
            var guildUsers = [];
            rows.forEach(function (row) {
                try{
                    if(message.guild.members.get(row.userId).displayName){
                        if(row.userId != message.author.id){//make sure message author isn't attacked by self
                            guildUsers.push(row.userId);
                        }
                    }
                }
                catch(err){
                    console.log("error in server");
                }
            });
            var rand = guildUsers[Math.floor(Math.random() * guildUsers.length)];
            return rand;
        });
    }
    addxp(message, amount, userId, lang){
        query(`SELECT * FROM items i
                INNER JOIN scores s
                ON i.userId = s.userId
                INNER JOIN cooldowns
                ON i.userId = cooldowns.userId
                WHERE s.userId="${userId}"`).then(oldRow => {  
            const row = oldRow[0];

            if(message.client.sets.xpPotCooldown.has(userId)){
                message.reply(lang.use.items[7].replace('{0}', ((180 * 1000 - ((new Date()).getTime() - row.xpTime)) / 1000).toFixed(0)));
                return;
            }
            query(`UPDATE cooldowns SET xpTime = ${(new Date()).getTime()} WHERE userId = ${userId}`);

            message.client.shard.broadcastEval(`this.sets.xpPotCooldown.add('${userId}')`);
            setTimeout(() => {
                message.client.shard.broadcastEval(`this.sets.xpPotCooldown.delete('${userId}')`);
                query(`UPDATE cooldowns SET xpTime = ${0} WHERE userId = ${userId}`);
            }, 180 * 1000);

            query(`UPDATE items SET xp_potion = ${row.xp_potion - 1} WHERE userId = ${userId}`);
            query(`UPDATE scores SET points = ${row.points + amount} WHERE userId = ${userId}`);
            let msgEmbed = new Discord.RichEmbed()
            .setAuthor(message.member.displayName, message.author.avatarURL)
            .setTitle("Successfully used `xp_potion`")
            .setDescription("Gained **"+amount+" XP**!")
            .setColor(14202368)
            message.channel.send(msgEmbed);
        });
    }
    resetSkills(message, userId){
        query(`SELECT * FROM items i
                JOIN scores s
                ON i.userId = s.userId
                WHERE s.userId="${userId}"`).then(oldRow => {
            const row = oldRow[0];

            let usedStatPts = row.used_stats;
            query(`UPDATE items SET reroll_scroll = ${row.reroll_scroll - 1} WHERE userId = ${userId}`);
            query(`UPDATE scores SET stats = ${row.stats + usedStatPts} WHERE userId = ${userId}`);
            query(`UPDATE scores SET maxHealth = ${100} WHERE userId = ${userId}`);
            query(`UPDATE scores SET luck = ${0} WHERE userId = ${userId}`);
            query(`UPDATE scores SET scaledDamage = ${1.00} WHERE userId = ${userId}`);
            query(`UPDATE scores SET used_stats = ${0} WHERE userId = ${userId}`);
            if(row.health > 100){
                query(`UPDATE scores SET health = ${100} WHERE userId = ${userId}`);
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
    openbox(message, lang, type, amount = 1){
        query(`SELECT * FROM items i
        INNER JOIN scores s
        ON i.userId = s.userId
        WHERE s.userId="${message.author.id}"`).then(oldRow => {
            const row = oldRow[0];

            this.hasenoughspace(message.author.id).then(result => {
                if(!result){
                    return message.reply(lang.errors[2]);
                }

                let itemsOpened    = [];
                let multiItemArray = [];
                let pureItemArray  = [];
                let lastItem       = "";
                let lastRarity     = "";
                let lastQual       = "";
                let xpToAdd        = 0;

                if(type == "item_box"){
                    for(var i = 0; i < amount; i++){
                        //iterates for each box user specifies
                        let chance = Math.floor(Math.random() * 201) + (row.luck * 2);
                        let rand = "";
            
                        if(chance <= 120){                                   //COMMON ITEMS % chance
                            let newCommonItems = this.getitems("common", {type: "unboxable", exclude: ["ammo"], excludeItem: ["item_box"]});
                            rand = newCommonItems[Math.floor(Math.random() * newCommonItems.length)];
                            multiItemArray.push("<:UnboxCommon:526248905676029968> `" + rand + "`");
                            itemsOpened.push("You just got a common `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 10197915;
                            lastQual = "common";
                            
                            xpToAdd += 10;
                        }
                        else if(chance <= 175){                              //UNCOMMON ITEMS 35% chance
                            let newuncommonItems = this.getitems("uncommon", {type: "unboxable", exclude: ["ammo"]});
                            rand = newuncommonItems[Math.floor(Math.random() * newuncommonItems.length)];
                            multiItemArray.push("<:UnboxUncommon:526248928891371520> `" + rand + "`");
                            itemsOpened.push("You just got an uncommon `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 4755200;
                            lastQual = "uncommon";

                            xpToAdd += 15;
                        }
                        else if(chance <= 190){                              //RARE ITEMS 12% chance
                            let newRareItems = this.getitems("rare", {type: "unboxable", exclude: ["ammo"]});
                            rand = newRareItems[Math.floor(Math.random() * newRareItems.length)];
                            multiItemArray.push("<:UnboxRare:526248948579434496> `" + rand + "`");
                            itemsOpened.push("You just got a RARE `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 30463;
                            lastQual = "rare";

                            xpToAdd += 30;
                        }
                        else if(chance <= 199){                              //EPIC ITEMS  2% chance
                            let newEpicItems = this.getitems("epic", {type: "unboxable", exclude: ["ammo"]});
                            rand = newEpicItems[Math.floor(Math.random() * newEpicItems.length)];
                            multiItemArray.push("<:UnboxEpic:526248961892155402> `" + rand + "`");
                            itemsOpened.push("You just got an **EPIC** `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 12390624;
                            lastQual = "epic";

                            xpToAdd += 50;
                        }
                        else{
                            let newLegendItems = this.getitems("legendary", {type: "unboxable", exclude: ["ammo"]});
                            rand = newLegendItems[Math.floor(Math.random() * newLegendItems.length)];   //LEGENDARY ITEMS 1% chance
                            multiItemArray.push("<:UnboxLegendary:526248970914234368> `" + rand + "`");
                            itemsOpened.push("You just got a **LEGENDARY** `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 16312092;
                            lastQual = "legendary";

                            xpToAdd += 80;
                        }
                    }
                    query(`UPDATE items SET item_box = ${row.item_box - amount} WHERE userId = ${message.author.id}`);
                }
                else if(type == "ultra_box"){
                    for(var i = 0; i < amount; i++){
                        let chance = Math.floor(Math.random() * 201) + Math.floor(row.luck * 1.5) //1-200
                        let rand = "";

                        if(chance <= 132){                               //RARE ITEMS 65% chance
                            let newRareItems = this.getitems("rare", {type: "unboxable", exclude: ["ammo"]});
                            rand = newRareItems[Math.floor(Math.random() * newRareItems.length)];
                            multiItemArray.push("<:UnboxRare:526248948579434496> `" + rand + "`");
                            itemsOpened.push("You just got a RARE `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 30463;
                            lastQual = "rare";

                            xpToAdd += 35;
                        }

                        else if(chance <= 178){                                //EPIC ITEMS  23% chance
                            let newEpicItems = this.getitems("epic", {type: "unboxable", exclude: ["ammo"], excludeItem: ["ultra_box"]});
                            rand = newEpicItems[Math.floor(Math.random() * newEpicItems.length)];
                            multiItemArray.push("<:UnboxEpic:526248961892155402> `" + rand + "`");
                            itemsOpened.push("You just got an **EPIC** `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 12390624;
                            lastQual = "epic";

                            xpToAdd += 55;
                        }

                        else if(chance <= 200){
                            let newLegendItems = this.getitems("legendary", {type: "unboxable", exclude: ["ammo"]});
                            rand = newLegendItems[Math.floor(Math.random() * newLegendItems.length)];   //LEGENDARY ITEMS 10.5% chance
                            multiItemArray.push("<:UnboxLegendary:526248970914234368> `" + rand + "`");
                            itemsOpened.push("You just got a **LEGENDARY** `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 16312092;
                            lastQual = "legendary";

                            xpToAdd += 85;
                        }
                        else{
                            //ultra item here
                            let newUltraItems = this.getitems("ultra", {type: "unboxable", exclude: ["ammo"]});
                            rand = newUltraItems[Math.floor(Math.random() * newUltraItems.length)];   //ULTRA ITEMS 0.5% chance
                            multiItemArray.push("<:UnboxUltra:526248982691840003> `" + rand + "`");
                            itemsOpened.push("You just got an **ULTRA** `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 16711778;
                            lastQual = "ultra";

                            xpToAdd += 125;
                        }
                    }
                    query(`UPDATE items SET ultra_box = ${row.ultra_box - amount} WHERE userId = ${message.author.id}`);
                }
                else if(type == "ammo_box"){
                    for(var i = 0; i < amount; i++){
                        let chance = Math.floor(Math.random() * 101) + (row.luck) //1-100
                        let rand = "";

                        if(chance <= 40){                                   //COMMON AMMO 44% chance
                            let newCommonAmmo = this.getitems("common", {type: "ammo", type2: "unboxable"});
                            rand = newCommonAmmo[Math.floor(Math.random() * newCommonAmmo.length)];
                            multiItemArray.push("<:UnboxCommon:526248905676029968> `" + rand + "`");
                            itemsOpened.push("You just got a common `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 10197915;
                            lastQual = "common";

                            xpToAdd += 15;
                        }
                        else if(chance <= 72){                               //UNCOMMON AMMO 30% chance
                            let newUncommonAmmo = this.getitems("uncommon", {type: "ammo", type2: "unboxable"});
                            rand = newUncommonAmmo[Math.floor(Math.random() * newUncommonAmmo.length)];
                            multiItemArray.push("<:UnboxUncommon:526248928891371520> `" + rand + "`");
                            itemsOpened.push("You just got an uncommon `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 4755200;
                            lastQual = "uncommon";

                            xpToAdd += 20;
                        }

                        else if(chance <= 94){                               //RARE AMMO 20% chance
                            let newRareAmmo = this.getitems("rare", {type: "ammo", type2: "unboxable"});
                            rand = newRareAmmo[Math.floor(Math.random() * newRareAmmo.length)];
                            multiItemArray.push("<:UnboxRare:526248948579434496> `" + rand + "`");
                            itemsOpened.push("You just got a RARE `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 30463;
                            lastQual = "rare";

                            xpToAdd += 35;
                        }

                        else if(chance <= 98) {                                //EPIC AMMO  8% chance
                            let newEpicAmmo = this.getitems("epic", {type: "ammo", type2: "unboxable"});
                            rand = newEpicAmmo[Math.floor(Math.random() * newEpicAmmo.length)];
                            multiItemArray.push("<:UnboxEpic:526248961892155402> `" + rand + "`");
                            itemsOpened.push("You just got an **EPIC** `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 12390624;
                            lastQual = "epic";

                            xpToAdd += 55;
                        }
                        else{                                                  //LEGENDARY AMMO 2% chance
                            let newLegendAmmo = this.getitems("legendary", {type: "ammo", type2: "unboxable"});
                            rand = newLegendAmmo[Math.floor(Math.random() * newLegendAmmo.length)];
                            multiItemArray.push("<:UnboxLegendary:526248970914234368> `" + rand + "`");
                            itemsOpened.push("You just got a **LEGENDARY** `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 16312092;
                            lastQual = "legendary";

                            xpToAdd += 85;
                        }
                    }
                    query(`UPDATE items SET ammo_box = ${row.ammo_box - amount} WHERE userId = ${message.author.id}`);
                }
                else if(type == "ultra_ammo"){
                    for(var i = 0; i < amount; i++){
                        let chance = Math.floor(Math.random() * 101) + (row.luck) //1-100
                        let rand = "";
                        
                        if(chance <= 10){                               //UNCOMMON AMMO 10% chance
                            let newUncommonAmmo = this.getitems("uncommon", {type: "ammo", type2: "unboxable"});
                            rand = newUncommonAmmo[Math.floor(Math.random() * newUncommonAmmo.length)];
                            multiItemArray.push("<:UnboxUncommon:526248928891371520> `" + rand + "`");
                            itemsOpened.push("You just got an uncommon `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 4755200;
                            lastQual = "uncommon";

                            xpToAdd += 25;
                        }

                        else if(chance <= 60){                               //RARE AMMO 50% chance
                            let newRareAmmo = this.getitems("rare", {type: "ammo", type2: "unboxable"});
                            rand = newRareAmmo[Math.floor(Math.random() * newRareAmmo.length)];
                            multiItemArray.push("<:UnboxRare:526248948579434496> `" + rand + "`");
                            itemsOpened.push("You just got a RARE `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 30463;
                            lastQual = "rare";

                            xpToAdd += 40;
                        }

                        else if(chance <= 90) {                                //EPIC AMMO  30% chance
                            let newEpicAmmo = this.getitems("epic", {type: "ammo", type2: "unboxable"});
                            rand = newEpicAmmo[Math.floor(Math.random() * newEpicAmmo.length)];
                            multiItemArray.push("<:UnboxEpic:526248961892155402> `" + rand + "`");
                            itemsOpened.push("You just got an **EPIC** `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 12390624;
                            lastQual = "epic";

                            xpToAdd += 60;
                        }
                        else{                                                  //LEGENDARY AMMO 10% chance
                            let newLegendAmmo = this.getitems("legendary", {type: "ammo", type2: "unboxable"});
                            rand = newLegendAmmo[Math.floor(Math.random() * newLegendAmmo.length)];
                            multiItemArray.push("<:UnboxLegendary:526248970914234368> `" + rand + "`");
                            itemsOpened.push("You just got a **LEGENDARY** `" + rand + "`");
                            pureItemArray.push(rand);
                            lastItem = rand;
                            lastRarity = 16312092;
                            lastQual = "legendary";

                            xpToAdd += 90;
                        }
                    }
                    query(`UPDATE items SET ultra_ammo = ${row.ultra_ammo - amount} WHERE userId = ${message.author.id}`);
                }

                var counts = {};
                pureItemArray.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });

                Object.keys(counts).forEach(key => {
                    //key is the item
                    //counts[key] is the item amount in array
                    query(`UPDATE items SET ${key} = ${row[key] + counts[key]} WHERE userId = ${message.author.id}`);
                });
                query(`UPDATE scores SET points = ${row.points + xpToAdd} WHERE userId = ${message.author.id}`);
                
                const embedInfo = new Discord.RichEmbed()
                .setAuthor(message.member.displayName, message.author.avatarURL)
                .setColor(lastRarity)
                if(amount == 1){
                    embedInfo.setTitle(itemsOpened);
                    embedInfo.setFooter('⭐ ' + xpToAdd + ' XP earned!')
                    if(itemdata[lastItem].image != ""){
                        embedInfo.setImage(itemdata[lastItem].image);
                    }
                    else{
                        embedInfo.setImage();
                    }
                }
                else{
                    embedInfo.setFooter('⭐ ' + xpToAdd + ' XP earned!');
                    embedInfo.setDescription(multiItemArray);
                    embedInfo.setTitle(amount + " boxes opened.");
                }
                message.channel.send(embedInfo);
            });
        });
    }
    addToHealCooldown(message, userId, itemUsed){
        query(`UPDATE cooldowns SET ${itemdata[itemUsed].cooldown.scoreRow} = ${(new Date()).getTime()} WHERE userId = ${userId}`);

        message.client.shard.broadcastEval(`this.sets.healCooldown.add('${userId}')`);

        setTimeout(() => {
            message.client.shard.broadcastEval(`this.sets.healCooldown.delete('${userId}');`)
            query(`UPDATE cooldowns SET ${itemdata[itemUsed].cooldown.scoreRow} = ${0} WHERE userId = ${userId}`);
            
        }, itemdata[itemUsed].cooldown.seconds * 1000);
    }
    getHealCooldown(userId){
        return query(`SELECT * FROM cooldowns WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];

            if(row._10mHEALCD > 0){
                return "`" + ((600 * 1000 - ((new Date()).getTime() - row._10mHEALCD)) / 60000).toFixed(1) + " minutes`"
            }
            else if(row._20mHEALCD > 0){
                return "`" + ((1200 * 1000 - ((new Date()).getTime() - row._20mHEALCD)) / 60000).toFixed(1) + " minutes`"
            }
            else if(row._40mHEALCD > 0){
                return "`" + ((2400 * 1000 - ((new Date()).getTime() - row._40mHEALCD)) / 60000).toFixed(1) + " minutes`"
            }
            else{
                return "`[REDACTED]`";
            }
        });
    }
    addToWeapCooldown(message, userId, itemUsed){
        query(`UPDATE cooldowns SET ${itemdata[itemUsed].cooldown.scoreRow} = ${(new Date()).getTime()} WHERE userId = ${userId}`);

        message.client.shard.broadcastEval(`this.sets.weapCooldown.add('${message.author.id}')`);

        setTimeout(() => {

            message.client.shard.broadcastEval(`this.sets.weapCooldown.delete('${message.author.id}')`);
            query(`UPDATE cooldowns SET ${itemdata[itemUsed].cooldown.scoreRow} = ${0} WHERE userId = ${userId}`);
            
        }, itemdata[itemUsed].cooldown.seconds * 1000);
    }
    getAttackCooldown(userId){
        return query(`SELECT * FROM cooldowns WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];

            if(row._15mCD > 0){
                return "`" + ((900 * 1000 - ((new Date()).getTime() - row._15mCD)) / 60000).toFixed(1) + " minutes`"
            }
            else if(row._30mCD > 0){
                return "`" + ((1800 * 1000 - ((new Date()).getTime() - row._30mCD)) / 60000).toFixed(1) + " minutes`"
            }
            else if(row._45mCD > 0){
                return "`" + ((2700 * 1000 - ((new Date()).getTime() - row._45mCD)) / 60000).toFixed(1) + " minutes`"
            }
            else if(row._60mCD > 0){
                return "`" + ((3600 * 1000 - ((new Date()).getTime() - row._60mCD)) / 60000).toFixed(1) + " minutes`"
            }
            else if(row._80mCD > 0){
                return "`" + ((4800 * 1000 - ((new Date()).getTime() - row._80mCD)) / 60000).toFixed(1) + " minutes`"
            }
            else if(row._100mCD > 0){
                return "`" + ((6000 * 1000 - ((new Date()).getTime() - row._100mCD)) / 60000).toFixed(1) + " minutes`"
            }
            else if(row._120mCD > 0){
                return "`" + ((7200 * 1000 - ((new Date()).getTime() - row._120mCD)) / 60000).toFixed(1) + " minutes`"
            }
            else{
                return "`[REDACTED]`";
            }
        });
    }
    getShieldTime(userId){
        return query(`SELECT * FROM cooldowns WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];

            if(row.mittenShieldTime > 0){
                return "`" + ((1800 * 1000 - ((new Date()).getTime() - row.mittenShieldTime)) / 60000).toFixed(1) + " minutes`"
            }
            else if(row.ironShieldTime > 0){
                return "`" + ((7200 * 1000 - ((new Date()).getTime() - row.ironShieldTime)) / 60000).toFixed(1) + " minutes`"
            }
            else if(row.goldShieldTime > 0){
                return "`" + ((28800 * 1000 - ((new Date()).getTime() - row.goldShieldTime)) / 60000).toFixed(1) + " minutes`"
            }
            else{
                return "`[REDACTED]`";
            }
        });
    }
    sendtokillfeed(message, killerId, victimId, itemName, itemDmg, itemsStolen, moneyStolen){
        query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`).then(oldRow => {
            const guildRow = oldRow[0];

            if(guildRow.killChan !== undefined && guildRow.killChan !== ""){
                const killEmbed = new Discord.RichEmbed()
                .setTitle(message.guild.members.get(killerId).displayName + " 🗡 " + message.guild.members.get(victimId).displayName + " 💀")
                .setDescription("**Weapon**: `" + itemName + "` - **" + itemDmg + " damage**")
                .setColor(16721703)
                .setTimestamp()

                message.guild.channels.get(guildRow.killChan).send(killEmbed).catch(err => {
                    return;
                });
            }
            else{
                return; //no killfeed on server...
            }
        }).catch(err => {
            //didn't work
        });
    }

    //TRADE COMMAND METHODS
    getTotalItmCountFromList(list){
        if(list.length == 0){
            return 0;
        }
        let totalItemCt = 0;
        for(var i=0; i < list.length; i++){
            //do stuff for each item
            //store amounts in array as ["rock|5","ak47|2"] then use split("|")
            let itemToCheck = list[i].split("|");
            totalItemCt += parseInt(itemToCheck[1]);
        }
        return totalItemCt;
    }

    //BUY COMMAND
    buyitem(message, buyItem, buyAmount, itemPrice, currency, isGame = false, lang){
        let displayPrice = currency == 'money' ? this.formatMoney(itemPrice * buyAmount) : itemPrice * buyAmount + "x `" + currency + "`";

        message.reply(lang.buy[2].replace('{0}', buyAmount).replace('{1}', buyItem).replace('{2}', displayPrice)).then(botMessage => {
            botMessage.react('✅').then(() => botMessage.react('❌'));
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };
            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    botMessage.delete();

                    if(isGame){
                        //item is a game and needs to message admins when its sold... Doesn't need to check for inventory space since they only lose items
                        this.hasitems(message.author.id, currency, itemPrice).then(hasItems => {
                            if(hasItems){
                                query(`SELECT * FROM gamesData WHERE gameName = '${buyItem}'`).then(gameRow => {

                                    query(`UPDATE gamesData SET gameAmount = ${gameRow[0].gameAmount - 1} WHERE gameName = '${buyItem}'`);

                                    this.removeitem(message.author.id, currency, itemPrice);
                                    
                                    message.reply("Successfully bought `" + buyItem + "`!");

                                    const buyerEmbed = new Discord.RichEmbed()
                                    .setTitle("✅ Game Purchased!")
                                    .setDescription("The moderators have received confirmation that you purchased a game and will respond with your key soon.")
                                    .setFooter('Please do not message asking "Where is my code?" unless atleast 12 hours have passed. We have the right to cancel this purchase if we suspect you of cheating.')
                                    .setTimestamp()
                                    message.author.send(buyerEmbed);

                                    const gameEmbed = new Discord.RichEmbed()
                                    .setTitle("✅ Game Purchased!")
                                    .addField("Game Sold", "**" + gameRow[0].gameDisplay + "**")
                                    .addField("Buyer", message.author.tag + "\nID: ```" + message.author.id + "```")
                                    .setTimestamp()
                                    //<@&495162711102062592>
                                    return message.client.shard.broadcastEval(`
                                        const channel = this.channels.get('${config.modChannel}');
                                
                                        if(channel){
                                            channel.send({embed: {
                                                    title: "✅ Game Purchased!",
                                                    fields: [
                                                        {
                                                            name: "Game Sold",
                                                            value: "**${gameRow[0].gameDisplay}**",
                                                        },
                                                        {
                                                            name: "Buyer",
                                                            value: "${message.author.tag} ID: \`\`\`${message.author.id}\`\`\`",
                                                        },
                                                    ],
                                                }
                                            });
                                            true;
                                        }
                                        else{
                                            false;
                                        }
                                    `).then(console.log);
                                });
                            }
                            else{
                                message.reply(lang.buy[5].replace('{0}', displayPrice));
                            }
                        });
                    }
                    else if(currency == "money"){
                        this.hasenoughspace(message.author.id, parseInt(buyAmount)).then(result => {
                            this.hasmoney(message.author.id, itemPrice * buyAmount).then(hasmoney => {
                                if(hasmoney && result){
                                    this.additem(message.author.id, buyItem, buyAmount);
                                    this.removemoney(message.author.id, itemPrice * buyAmount);
                                    message.reply(lang.buy[3].replace('{0}', buyAmount).replace('{1}', buyItem));
                                }
                                else if(!hasmoney){
                                    message.reply(lang.buy[4]);
                                }
                                else{
                                    message.reply(lang.errors[2]);
                                }
                            });
                        });
                    }
                    else{
                        //currency must be an item
                        this.hasenoughspace(message.author.id, buyAmount - (buyAmount * itemPrice)).then(hasSpace => {
                            this.hasitems(message.author.id, currency, (buyAmount * itemPrice)).then(hasItems => {
                            //if user bought 3 rpgs at 5 tokens each, they would need 3 - 15 = -12 space in their inventory
                            //if they had 20/10 slots at time of purchasing, this would return true because 20 - 12 = 8/10 slots
                                if(hasItems && hasSpace){
                                    //they have enough of the currency and space, can buy item
                                    this.removeitem(message.author.id, currency, itemPrice * buyAmount);
                                    this.additem(message.author.id, buyItem, buyAmount);
                                    message.reply(lang.buy[3].replace('{0}', buyAmount).replace('{1}', buyItem));
                                }
                                else if(!hasItems){
                                    //they dont have enough of the items(currency)
                                    message.reply(lang.buy[5].replace('{0}', displayPrice));
                                }
                                else{
                                    //no space
                                    message.reply(lang.errors[2]);
                                }
                            });
                        });
                    }
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

    //GAMBLE SUBCOMMANDS
    roulette(message, userId, amount, lang){
        let multiplier = 1.2;
        let winnings = Math.floor(amount * multiplier);
        query(`SELECT * FROM scores WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];

            let luck = row.luck >= 20 ? 10 : Math.floor(row.luck/2);
            let chance = Math.floor(Math.random() * 100) + luck; //return 1-100
            if(chance <= 20){
                let healthDeduct = 50;
                if(row.health <= 50){
                    healthDeduct = row.health - 1;
                    query(`UPDATE scores SET health = ${1} WHERE userId = ${userId}`);
                }
                else{
                    query(`UPDATE scores SET health = ${row.health - 50} WHERE userId = ${userId}`);
                }
                message.reply("***Click***").then(msg => {
                    setTimeout(() => {
                        msg.edit(lang.gamble.roulette[0].replace('{0}', message.author).replace('{1}', healthDeduct).replace('{2}', (row.health - healthDeduct)).replace('{3}', amount));
                    }, 1500);
                });
            }
            else{
                query(`UPDATE scores SET money = ${row.money + winnings} WHERE userId = ${message.author.id}`);
                message.reply("***Click***").then(msg => {
                    setTimeout(() => {
                        msg.edit(lang.gamble.roulette[1].replace('{0}', message.author).replace('{1}', winnings));
                    }, 1500);
                });
            }
        });
    }
    slots(message, userId, amount, lang){
        query(`SELECT * FROM scores WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];

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
                let chance = Math.floor(Math.random() * 200) + luck;
                console.log("chance : "+ chance)
                if(chance <= 100){
                    //unbox common
                    eval("col"+i+".push(slotEmotes[3],slotEmotes[0],slotEmotes[1]);");
                    slotFinal.push("common");
                }
                else if(chance <= 150){
                    //unbox rare
                    eval("col"+i+".push(slotEmotes[0],slotEmotes[1],slotEmotes[2]);");
                    slotFinal.push("rare");
                }
                else if(chance <= 180){
                    eval("col"+i+".push(slotEmotes[1],slotEmotes[2],slotEmotes[3]);");
                    slotFinal.push("epic");
                }
                else{
                    //legend
                    eval("col"+i+".push(slotEmotes[2],slotEmotes[3],slotEmotes[0]);");
                    slotFinal.push("legend");
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
                    rewardMltp = 0.80;
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
            query(`UPDATE scores SET money = ${row.money + winnings} WHERE userId = ${message.author.id}`);
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
                                "▶"+col1[1]+col2[1]+col3[1]+`◀ ${lang.gamble.slots[0].replace('{0}', winnings).replace('{1}', rewardMltp.toFixed(2))}\n`+
                                "⬛"+col1[2]+col2[2]+col3[2]+"⬛";
                }
                else{
                    slots3 = "⬛"+col1[0]+col2[0]+col3[0]+"⬛\n"+
                                "▶"+col1[1]+col2[1]+col3[1]+`◀ ${lang.gamble.slots[1]}\n`+
                                "⬛"+col1[2]+col2[2]+col3[2]+`⬛ ${lang.gamble.slots[2]}`;
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
    coinflip(message, userId, amount, lang, coinSide){
        query(`SELECT * FROM scores WHERE userId ="${userId}"`).then(oldRow => {
            const row = oldRow[0];
            //if(coinSide !== "heads" && coinSide !== "tails") coinSide = "heads";
            //let oppoSide = coinSide == "heads" ? "tails" : "heads";
            let luck = row.luck >= 20 ? 5 : Math.floor(row.luck/4);
            let chance = Math.floor(Math.random() * 100) + luck; //return 1-100
            if(chance > 50){
                query(`UPDATE scores SET money = ${row.money + parseInt(amount)} WHERE userId = ${message.author.id}`);
                message.reply(lang.gamble.coinflip[0].replace('{0}', amount * 2));
            }
            else{
                message.reply(lang.gamble.coinflip[1].replace('{0}', amount));
                query(`UPDATE scores SET money = ${row.money - parseInt(amount)} WHERE userId = ${message.author.id}`);
            }
        });
    }

    //SCRAMBLE COMMAND
    scrambleWinMsg(message, itemReward){
        const embedScramble = new Discord.RichEmbed()
        .setTitle("**You got it correct!**")
        .setDescription("Reward : ```" + itemReward+"```")
        .setColor(9043800);
        message.channel.send(message.author, embedScramble);
    }

    //SHOP COMMAND
    getHomePage(){
        return query(`SELECT * FROM gamesData`).then(gameRows => {
            let gameCount = 0;

            const firstEmbed = new Discord.RichEmbed()
            firstEmbed.setTitle(`**ITEM SHOP**`);
            firstEmbed.setDescription("📥 Buy 📤 Sell\nUse `buy (ITEM)` to purchase and `sell (ITEM)` to sell items.\n\nLimit 1 per person");
            firstEmbed.setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/497356681139847168/thanbotShopIcon.png");
            firstEmbed.setFooter(`Home page`);
            firstEmbed.setColor(0);

            gameRows.forEach(function (gameRow) {
                if(gameRow !== null){
                    if(gameRow.gameCurrency == "money"){
                        firstEmbed.addField(gameRow.gameDisplay,"Price: $" + gameRow.gamePrice + " | **" + gameRow.gameAmount + "** left! Use `buy " + gameRow.gameName + "` to purchase!");
                    }
                    else{
                        firstEmbed.addField(gameRow.gameDisplay,"Price: " + gameRow.gamePrice + " `" + gameRow.gameCurrency + "` | **" + gameRow.gameAmount + "** left! Use `buy " + gameRow.gameName + "` to purchase!");
                    }
                    gameCount += 1;
                }
            });
            if(gameCount == 0){
                firstEmbed.addField("Unfortunately, there are no steam keys for sale at this time.","Check back at a later time.");
                return firstEmbed;
            }
            else{
                return firstEmbed;
            }
        });
    }
    getGamesData(){
        return query(`SELECT * FROM gamesData`).then(gameRows => {
            let gameCount = 0;
            let gameData = {};
            gameRows.forEach(function (gameRow) {
                if(gameRow !== null){
                    gameData[gameRow.gameName] = gameRow;
                    gameCount += 1;
                }
            });
            if(gameCount == 0){
                return false;
            }
            else{
                return gameData;
            }
        });
    }


    // NOT USED BY ANY COMMAND, can be called with eval
    // These are not updated to work with sharding, and might not function as intended
    addtoJSON(jsonFile){
        Object.keys(jsonFile).forEach(key => {
            if(jsonFile[key].rarity == "Common"){
                jsonFile[key].shopOrderCode = 2;
            }
            else if(jsonFile[key].rarity == "Uncommon"){
                jsonFile[key].shopOrderCode = 3;
            }
            else if(jsonFile[key].rarity == "Rare"){
                jsonFile[key].shopOrderCode = 4;
            }
            else if(jsonFile[key].rarity == "Epic"){
                jsonFile[key].shopOrderCode = 5;
            }
            else if(jsonFile[key].rarity == "Legendary"){
                jsonFile[key].shopOrderCode = 6;
            }
            else if(jsonFile[key].rarity == "Ultra"){
                jsonFile[key].shopOrderCode = 7;
            }
            else if(jsonFile[key].rarity == "Limited"){
                jsonFile[key].shopOrderCode = 8;
            }
        });
        fs.writeFile('testJSONfile2.json',JSON.stringify(jsonFile, null, 4), function(err) {
            console.log("complete");
        });
    }
    getActiveAccount(userId){
        return query(`SELECT * FROM userGuilds WHERE userId ="${userId}"`).then(rows => {
            var userGuilds = [];
            var servers = 0;
            rows.forEach(row => {
                userGuilds.push(client.guilds.get(row.guildId).name);
                servers++;
            });
            return {
                guildsArr: userGuilds,
                count: servers
            }
        });
    }
}

module.exports = new Methods();