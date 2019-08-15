//TODO Clean this file up, lots of useless functions...
const Discord = require("discord.js");
const { query } = require('../mysql.js');
const helpCmd = require('../json/_help_commands.json');
const config = require('../json/_config.json');
const itemdata = require("../json/completeItemList");
const fs = require("fs");
const general = require('../methods/general');
const icons = require('../json/icons');

class Methods {
    /**
     * 
     * @param {*} userId ID of user to add item to.
     * @param {*} item   Item to add, can be array ex.(["item_box|2","awp|1"])
     * @param {*} amount Amount of item to add, must be number.
     */
    async additem(userId, item, amount){
        if(Array.isArray(item)){
            if(item.length == 0){
                return;
            }
            for(var i=0; i < item.length; i++){
                // store amounts in array as ["rock|5","ak47|2"] then use split("|")
                let itemToCheck = item[i].split("|");


                let insertValues = Array(parseInt(itemToCheck[1])).fill([userId, itemToCheck[0]]); // Store userId and item in array to bulk insert x times # of items.

                await query(`INSERT INTO user_items (userId, item) VALUES ?`, [insertValues]);
            }
        }
        else{
            let insertValues = Array(parseInt(amount)).fill([userId, item]);
            await query(`INSERT INTO user_items (userId, item) VALUES ?`, [insertValues]);
        }
    }

    /**
     * 
     * @param {*} userId ID of user to add money to.
     * @param {*} amount Amount of money to add.
     */
    addmoney(userId, amount){
        query(`UPDATE scores SET money = money + ${parseInt(amount)} WHERE userId = ${userId}`);
    }

    /**
     * 
     * @param {*} userId ID of user to remove money from.
     * @param {*} amount Amount of money to remove.
     */
    removemoney(userId, amount){
        query(`UPDATE scores SET money = money - ${parseInt(amount)} WHERE userId = ${userId}`);
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

    /**
     * 
     * @param {*} userId ID of user to remove item from.
     * @param {*} item   Item to remove, can be an array ex.(["rock|2","item_box|3"])
     * @param {*} amount Amount of item to remove.
     */
    async removeitem(userId, item, amount){
        if(Array.isArray(item)){
            if(item.length == 0){
                return;
            }
            for(var i=0; i < item.length; i++){
                //do stuff for each item
                //store amounts in array as ["rock|5","ak47|2"] then use split("|")
                let itemToCheck = item[i].split("|");

                query(`DELETE FROM user_items WHERE userId = ${userId} AND item = '${itemToCheck[0]}' LIMIT ${parseInt(itemToCheck[1])}`);
            }
        }
        else{
            query(`DELETE FROM user_items WHERE userId = ${userId} AND item = '${item}' LIMIT ${parseInt(amount)}`);
        }
    }

    /**
     * 
     * @param {*} userId ID of user to check.
     * @param {*} amount Amount to check user has.
     */
    hasmoney(userId, amount){ // PROMISE FUNCTION
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

    /**
     * 
     * @param {*} userId ID of user to check.
     * @param {*} item   Item to check user has, can be an array ex.(["awp|1","glock|2"])
     * @param {*} amount Amount of item check for.
     */
    async hasitems(userId, item, amount){
        const userItems = await general.getItemObject(userId);

        if(Array.isArray(item)){
            if(item.length == 0){
                return true;
            }
            for (var i = 0; i < item.length; i++) {
                //do stuff for each item
                let itemToCheck = item[i].split("|");
                if(userItems[itemToCheck[0]] >= parseInt(itemToCheck[1])){
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
            if(userItems[item] >= parseInt(amount)){
                return true;
            }
            else{
                return false;
            }
        }
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
        else if(itemSearched.startsWith("supply")){
            itemSearched = "SUPPLY_SIGNAL";
        }
        else if(itemSearched.startsWith("powder")){
            itemSearched = "GUNPOWDER";
        }
        else if(itemSearched.startsWith("smg")){
            itemSearched = "SMG_BODY";
        }
        else if(itemSearched.startsWith("pump")){
            itemSearched = "PUMP_BODY";
        }
        else if(itemSearched.startsWith("assault")){
            itemSearched = "ASSAULT_BODY";
        }
        else if(itemSearched.startsWith("body")){
            itemSearched = "RIFLE_BODY";
        }
        
        return itemSearched.toLowerCase();
    }
    commandhelp(message, command, prefix){
        try{
            for(var i = 0; i < Object.keys(helpCmd).length; i++){
                const commandInf = message.client.commands.get(helpCmd[i].command.toLowerCase());
                //const command = message.client.commands.get(command.toLowerCase()) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command.toLowerCase()));
                if(commandInf && (commandInf.name == command.toLowerCase() || commandInf.aliases.includes(command.toLowerCase()))){
                    const commandInf = message.client.commands.get(helpCmd[i].command.toLowerCase());
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
                    if(helpCmd[i].example[0].length > 0){helpInfo.setDescription("Example: "+cmdExamples.join(", ") + "\n\n" + helpCmd[i].description)}else{helpInfo.setDescription(helpCmd[i].description)}
                    if(commandInf !== undefined && commandInf.aliases[0].length > 0) helpInfo.addField("Aliases", commandInf.aliases.map(alias => '`' + alias + '`').join(", "))
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
    async getitemcount(userId, cntTokens = false, cntBanners = false){
        const userItems = await general.getItemObject(userId);
        const scoreRow  = (await query(`SELECT * FROM scores WHERE userId ="${userId}"`))[0];

        var totalItemCt = 0;

        Object.keys(itemdata).forEach(key => {
            if(userItems[key] > 0){
                if(key == 'token' && cntTokens){
                    totalItemCt += userItems[key];
                }
                else if(itemdata[key].isBanner && cntBanners){
                    totalItemCt += userItems[key];
                }
                else if(key !== 'token' && !itemdata[key].isBanner){
                    totalItemCt += userItems[key];
                }
            }
        });
        return {
            itemCt : totalItemCt,
            capacity : (totalItemCt + "/" + (config.base_inv_slots + scoreRow.inv_slots))
        }
    }
    async hasenoughspace(userId, amount = 0){
        const itemCt = await this.getitemcount(userId);
        const userRow = (await query(`SELECT * FROM scores WHERE userId = "${userId}"`))[0];
        
        console.log((itemCt.itemCt + parseInt(amount)) + " <= " + (config.base_inv_slots + userRow.inv_slots));

        if((itemCt.itemCt + parseInt(amount)) <= (config.base_inv_slots + userRow.inv_slots)) return true;
        else return false;
    }
    getitems(rarity = "all", {type = "", type2 = "", exclude = [], excludeItem = [], excludeType = ''}){
        rarity = rarity.toLowerCase();
        let items = [];

        Object.keys(itemdata).forEach(key => {
            if(itemdata[key].rarity.toLowerCase() == rarity && !excludeItem.includes(key)){
                if(type == ""){
                    if(excludeType == 'banner' && !itemdata[key].isBanner){
                        items.push(key);
                    }
                    else if (excludeType !== 'banner') items.push(key);
                }
                else if(type2 ==""){
                    if((type == "weapon" || type == "weap") && itemdata[key].isWeap == true){
                        items.push(key);
                    }
                    else if(type == "material" && itemdata[key].isMaterial){
                        items.push(key);
                    }
                    else if(type == "banner" && itemdata[key].isBanner){
                        items.push(key);
                    }
                    else if(type == "backpack" && itemdata[key].type == "backpack"){
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
                    if(excludeType == 'banner' && !itemdata[key].isBanner){
                        items.push(key);
                    }
                    else if(excludeType !== 'banner') items.push(key);
                }
                else if(type == "ammo" && itemdata[key].isAmmo.length){
                    items.push(key);
                }
            }
        });
        return items;
    }
    async getuseritems(userId, {sep = "",amounts= false, icon = false, onlyBanners = false, countBanners = false}){
        const itemRow = await general.getItemObject(userId);
        let commonItems   = [];
        let uncommonItems = [];
        let rareItems     = [];
        let epicItems     = [];
        let legendItems   = [];
        let ultraItems    = [];
        let limitedItems  = [];
        let invValue      = 0;
        let itemCount     = 0;

        Object.keys(itemdata).forEach(key => {
            if(countBanners){
                if(itemRow[key] >= 1){
                    addIt(key);
                }
            }
            else if(onlyBanners && itemdata[key].isBanner){
                if(itemRow[key] >= 1){
                    addIt(key);
                }
            }
            else if(!onlyBanners && itemdata[key].isBanner == undefined){
                if(itemRow[key] >= 1){
                    addIt(key);
                }
            }
        });

        function addIt(key){
            if(icon){
                if(itemdata[key].rarity == "Common") commonItems.push(itemdata[key].icon + sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Uncommon") uncommonItems.push(itemdata[key].icon + sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Rare") rareItems.push(itemdata[key].icon + sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Epic") epicItems.push(itemdata[key].icon + sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Legendary") legendItems.push(itemdata[key].icon + sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Ultra") ultraItems.push(itemdata[key].icon + sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Limited") limitedItems.push(itemdata[key].icon + sep + key + sep + "("+itemRow[key]+")");
            }
            else{
                if(itemdata[key].rarity == "Common") commonItems.push(sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Uncommon") uncommonItems.push(sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Rare") rareItems.push(sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Epic") epicItems.push(sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Legendary") legendItems.push(sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Ultra") ultraItems.push(sep + key + sep + "("+itemRow[key]+")");
                else if(itemdata[key].rarity == "Limited") limitedItems.push(sep + key + sep + "("+itemRow[key]+")");
            }
            invValue += itemdata[key].sell * itemRow[key];
            itemCount+= itemRow[key];
        }
        return {
            common: commonItems,
            uncommon: uncommonItems,
            rare: rareItems,
            epic: epicItems,
            legendary: legendItems,
            ultra: ultraItems,
            limited: limitedItems,
            invValue: invValue,
            itemCount: itemCount
        }
    }
    formatMoney(money, noEmoji = false){
        if(noEmoji){
            return "$" + (parseInt(money)).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
        }
        else{
            return "<:Lootbuck:594373906325045301> $" + (parseInt(money)).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
        }
    }

    //USE COMMAND
    async randomItems(killerId, victimId, amount){
        const victimItems = await general.getItemObject(victimId);

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
            this.additem(killerId, selected[i], 1);
            this.removeitem(victimId, selected[i], 1);
        }
        return [selected.map(item => itemdata[item].icon + item).join('\n'), selected.map(item => itemdata[item].icon + item).join(', ')];
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
    async getShieldTime(userId){
        const row = (await query(`SELECT * FROM cooldowns WHERE userId ="${userId}"`))[0];
        
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
    }
    async sendtokillfeed(message, killerId, victimId, itemName, itemDmg, itemsStolen, moneyStolen){
        const guildRow = (await query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`))[0];

        if(guildRow.killChan !== undefined && guildRow.killChan !== 0 && guildRow.killChan !== ''){
            const killEmbed = new Discord.RichEmbed()
            .setTitle((await general.getUserInfo(message, killerId, true)).displayName + " 🗡 " + (await general.getUserInfo(message, victimId, true)).displayName + " 💀")
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

    //SHOP COMMAND
    getHomePage(lang){
        return query(`SELECT * FROM gamesData`).then(gameRows => {
            let gameCount = 0;

            const firstEmbed = new Discord.RichEmbed()
            firstEmbed.setTitle(`**ITEM SHOP**`);
            firstEmbed.setDescription(lang.shop[0]);
            firstEmbed.setThumbnail("https://cdn.discordapp.com/attachments/497302646521069570/602129484900204545/shopping-cart.png");
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
    getHealthIcon(curHP, maxHP){
        let hpPerc = curHP / maxHP;

        if(hpPerc >= .75){
            return icons.health.full;
        }
        else if(hpPerc >= .5){
            return icons.health.percent_75;
        }
        else if(hpPerc >= .25){
            return icons.health.percent_50;
        }
        else if(hpPerc >= .1){
            return icons.health.percent_25;
        }
        else{
            return icons.health.empty;
        }
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