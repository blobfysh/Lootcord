//TODO Clean this file up, lots of useless functions...
const Discord = require("discord.js");
const { query } = require('../mysql.js');
const helpCmd = require('../json/_help_commands.json');
const config = require('../json/_config.json');
const itemdata = require("../json/completeItemList");
const fs = require("fs");
const general = require('./general');
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
    async getuseritems(userId, {sep = "",amounts= false, icon = false, onlyBanners = false, countBanners = false, countLimited = true}){
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

        let filteredItems = Object.keys(itemdata).filter(item => {
            if(onlyBanners){
                if(itemdata[item].isBanner) return true;
                else return false;
            }
            else if(countBanners && countLimited){
                return true;
            }
            else if(!countBanners && countLimited){
                if(!itemdata[item].isBanner) return true;
                else return false;
            }
            else if(countBanners && !countLimited){
                if(itemdata[item].isBanner && itemdata[item].rarity !== 'Limited') return true
                else if(!itemdata[item].isBanner && itemdata[item].rarity !== 'Limited') return true
                else return false;
            }
        });

        for(var key of filteredItems){
            if(itemRow[key] >= 1){
                addIt(key);
            }
        }

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
            return icons.money + " " + (parseInt(money)).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
        }
    }

    getPrestigeBadge(prestigeLvl){
        switch(prestigeLvl){
            case 0: return '';
            default: return icons[`prestige_${prestigeLvl}_badge`];
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

    async addCD(client, { userId, type, time }, options = {ignoreQuery: false, shardOnly: false}){
        try{
            if(client.cache[type].get(userId)) return false;

            let seconds = Math.round(time / 1000);

            if(!options.shardOnly) client.shard.broadcastEval(`this.cache['${type}'].set('${userId}', 'Set at ' + (new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})), ${seconds});`)
            else client.cache[type].set(userId, 'Set on startup at ' + (new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})), seconds);
            
            if(!options.ignoreQuery) await query(`INSERT INTO cooldown (userId, type, start, length) VALUES (?, ?, ?, ?)`, [userId, type, new Date().getTime(), time]);

            let timeObj = {
                userId: userId, 
                type: type, 
                timer: setTimeout(() => {
                    console.log(`[METHODS] Deleted ${userId} from '${type}' cooldown`);
                    query(`DELETE FROM cooldown WHERE userId = ${userId} AND type = '${type}'`);
                }, seconds * 1000)
            };

            /*
            CAN USE THIS TO SAFELY CLEAR ALL COOLDOWNS
            message.client.shard.broadcastEval(`
                this.cdTimes.forEach(arrObj => {

                    if(arrObj.userId == ${message.author.id} && arrObj.type == ${typehere}){
                        //stop the timer
                        clearTimeout(arrObj.timer);
            
                        this.cdTimes.splice(this.cdTimes.indexOf(arrObj), 1);
            
                        console.log('canceled a timeout');
                    }
                    
                    //to clear all cds
                    if(arrObj.userId == ${message.author.id}){
                        //stop the timer
                        clearTimeout(arrObj.timer);
            
                        this.cdTimes.splice(this.cdTimes.indexOf(arrObj), 1);
            
                        console.log('canceled a timeout');
                    }
                });
            `);
            */
           
            client.cdTimes.push(timeObj);

            return 'Added Cooldown';
        }
        catch(err){
            console.log(err);
        }
    }

    getCD(client, { userId, type }){
        let endTime = client.cache[type].getTTL(userId);

        if(!endTime) return undefined;

        return this.convertTime(endTime - new Date().getTime())
    }
    async clearCD(client, userId, type){
        await query(`DELETE FROM cooldown WHERE userId = '${userId}' AND type = '${type}'`);
        client.shard.broadcastEval(`
            this.cache['${type}'].del('${userId}');
            this.cdTimes.forEach(arrObj => {
                
                if(arrObj.userId == ${userId} && arrObj.type == '${type}'){
                    //stop the timer
                    clearTimeout(arrObj.timer);
        
                    this.cdTimes.splice(this.cdTimes.indexOf(arrObj), 1);
                }

            });
        `);
    }

    convertTime(ms){
        let remaining = ms;
        let finalStr = '';

        let rawDays = remaining / (1000 * 60 * 60 * 24);
        let days = Math.floor(rawDays);
        remaining %= 1000 * 60 * 60 * 24;

        let rawHours = remaining / (1000 * 60 * 60);
        let hours = Math.floor(rawHours);
        remaining %= 1000 * 60 * 60;

        let rawMinutes = remaining / (1000 * 60);
        let minutes = Math.floor(rawMinutes);
        remaining %= 1000 * 60;
        
        let seconds = Math.floor(remaining / 1000);
        
        if(days > 0){
            finalStr += days == 1 ? days + ' day ' : days + ' days ';
        }
        if(hours > 0){
            if(days > 0) return finalStr += rawHours.toFixed(1) + ' hours';
            else finalStr += hours == 1 ? hours + ' hour ' : hours + ' hours ';
        }
        if(minutes > 0){
            if(hours > 0) return finalStr += rawMinutes.toFixed(1) + ' minutes';
            else finalStr += minutes == 1 ? minutes + ' minute ' : minutes + ' minutes ';
        }

        return finalStr += seconds == 1 ? seconds + ' second' : seconds + ' seconds';
    }


    // NOT USED BY ANY COMMAND, can be called with eval
    // These are not updated to work with sharding, and might not function as intended
    addtoJSON(jsonFile){
        Object.keys(jsonFile).forEach(key => {
            if(jsonFile[key].isMaterial){
                jsonFile[key].type = 'material';
            }
            else if(jsonFile[key].isItem){
                jsonFile[key].type = 'usable';
            }
            else if(jsonFile[key].isAmmo.length){
                jsonFile[key].type = 'ammo';
            }
            else if(jsonFile[key].isWeap && jsonFile[key].ammo.length){
                jsonFile[key].type = 'weapon';
            }
            else if(jsonFile[key].isWeap){
                jsonFile[key].type = 'melee';
            }
            else if(!jsonFile[key].type){
                jsonFile[key].type = 'NONE SET ME PLEASE';
            }
        });
        fs.writeFile('testJSONfile2.json',JSON.stringify(jsonFile, null, 4), function(err) {
            console.log("complete");
        });
    }
    addtoHELP(message){
        let jsonFile = helpCmd;

        for(var i = 0; i < jsonFile.length; i++){
            let commandInf = message.client.commands.get(helpCmd[i].command.toLowerCase());

            jsonFile[i].shortDesc = commandInf.description;
        }
        fs.writeFile('testJSONfile2.json',JSON.stringify(jsonFile, null, 4), function(err) {
            console.log("complete");
        });
    }
    clearAllCD(client, userId){
        query(`DELETE FROM cooldown WHERE userId = '${userId}'`);
        client.shard.broadcastEval(`
            this.cache.getTypes().forEach(type => {
                this.cache[type].del('${userId}');
            });
            this.cdTimes.forEach(arrObj => {
                
                //to clear all cds
                if(arrObj.userId == ${userId}){
                    //stop the timer
                    clearTimeout(arrObj.timer);
        
                    this.cdTimes.splice(this.cdTimes.indexOf(arrObj), 1);
        
                    console.log('canceled a timeout');
                }
            });
        `);
    }
}

module.exports = new Methods();