const Discord = require("discord.js");
const methods = require("./methods")
const config = require('./json/_config.json');
const itemImgJSON = require('./json/_item_images.json');
const botInfo = require('./json/_update_info.json');
const Jimp = require("jimp"); //jimp library allows realtime editing of images
const fs = require("fs");
const cryptorjs = require("cryptorjs");
const cryptor = new cryptorjs(config.encryptionAuth);
const itemInfoJson = require("./json/completeItemList");

let serverReward = new Set(); //used currently, for t-present command
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
const completeItemsCheck = ["ray_gun","rail_cannon","javelin","rpg","awp","plasma","peck_seed","bmg_50cal","ak47","m4a1","rocket","spas","gold_shield","ultra_ammo","ultra_box","medkit","thompson","revolver", 
                        "iron_shield", "nutcracker", "glock","grenade","blunderbuss","buckshot","crossbow","ammo_box","spear","rifle_bullet","health_pot","bat","pistol_bullet",
                        "bow","sword","snowball","pills","mittens","gingerbread","candycane",,"stocking","item_box","arrow","baseball","fish","fork","club","rock","stick","token",
                        "screw","steel","adhesive","fiber_optics","module","golf_club","reroll_scroll","xp_potion","light_pack","canvas_bag","hikers_pack"]; //in order best-worst
const itemsList = ["item_box","box", "loot_box", "health", "health_pot", "ammo_box","ammo", "medkit","med", "pills", "iron_shield", "gold_shield","ultra","ultra_box","mittens",
                    "gingerbread","stocking","ultra_ammo","xp_potion","reroll_scroll"]; //handled in use command to see what items exist (items are different from weapons in that they can't be used on other players)
//LIMITED
const itemSTOCKING = ["stocking", "N/A", "", "N/A", "", 200, "Has a chance to contain `$500-$2000`, or a lump of coal...\n**Snowfest 2018 item**", "Limited"];
const itemGINGERBREAD = ["gingerbread", "N/A", "", "N/A", "", 200, "Eat this to heal `20-25` HP!\n**Snowfest 2018 item**", "Limited"];
const itemCANDYCANE = ["candycane",3,15,"N/A","", 300, "Sharpened for maximum efficiency\n**Snowfest 2018 item**", "Limited"];
const itemSNOWBALL = ["snowball",20,45,"N/A","", 3500, "Tightly packed snowball\n**Snowfest 2018 item**", "Limited"];
const itemNUTCRACKER = ["nutcracker",30,65,"N/A","", 7000, "Send the nutcracker to bite your enemies\n**Snowfest 2018 item**", "Limited"];
const itemMITTENS = ["mittens", "N/A", "", "N/A", "", 400, "Wear these cozy gloves to shield yourself for 30 minutes!\n**Snowfest 2018 item**", "Limited"];
const itemTOKEN = ["token", "N/A", "", "N/A", "", 350, "Limited event currency that can be used to buy event-only items!\nCheck the `store` to see what can be purchased", "Limited"];
//COMMON
const itemBOX = ["item_box", "N/A", "", "N/A", 1500, 300, "Use this to get a random item!\nCan drop items up to Legendary quality.", "Common"];
const itemROCK = ["rock",5,10,"N/A","", 125,  "It's a rock.", "Common"];
const itemARROW = ["arrow","Varies","",["bow","crossbow"],"",250, "Use with weapon", "Common"]; //AMMO | UPDATE WITH NEW WEAPONS
const itemFORK = ["fork",4,9,"N/A","", 100,  "What you gonna do with that?", "Common"];
const itemCLUB = ["club",6,11,"N/A","", 150,  "ME ATTACK!", "Common"];
const itemBASEBALL = ["baseball","Varies","",["bat"],"",500, "Use with weapon", "Common"]; //AMMO | UPDATE WITH NEW WEAPONS
const itemSTICK = ["stick", 3, 6, "N/A", "", 100,  "It fell off a tree.", "Common"];
const itemFISH = ["fish",5,11,"N/A","", 125,  "Slap them I guess?", "Common"];
//UNCOMMON
const itemAMMOBOX = ["ammo_box", "N/A", "", "N/A", 3500, 1000, "Use this to get random ammunition!", "Uncommon","","3x item_box"];
const itemSWORD = ["sword",10,20,"N/A","", 250,  "A pretty average looking sword.", "Uncommon"];
const itemBOW = ["bow",8,17,"arrow","", 350,  "Shoots arrows", "Uncommon"];
const itemPISTOLBULLET = ["pistol_bullet","Varies","",["glock","thompson"],"",400, "Use with weapon", "Uncommon"];  //AMMO | UPDATE WITH NEW WEAPONS
const itemBAT = ["bat",10,18,"N/A","", 350,  "Hit a grand slam!\nDoes bonus damage if you have a `baseball` in your inventory", "Uncommon"];
const itemPILLS = ["pills", "N/A", "", "N/A", 1000, 200, "Restores `5-14` HP!", "Uncommon"];
const itemGOLF_CLUB = ["golf_club",12,21,"N/A","", 300,  "An iron club used for hitting golf balls, or enemies.", "Uncommon"];
const itemLIGHT_PACK = ["light_pack", "N/A", "", "N/A", "", 500, "Equip this backpack to gain **5** item slots!", "Uncommon"];
//RARE
const itemRIFLEBULLET = ["rifle_bullet","Varies","",["ak47","m4a1","awp"],"",2250, "Use with weapon", "Rare"]; //AMMO | UPDATE WITH NEW WEAPONS
const itemGLOCK = ["glock",21,30,"pistol_bullet","", 750,  "Simple pistol", "Rare"];
const itemCROSSBOW = ["crossbow",15,33,"arrow","", 775,  "Shoots arrows at high velocity", "Rare"];
const itemSPEAR = ["spear",15,25,"N/A","", 675,  "Stab the enemy", "Rare"];
const itemHEALTH = ["health_pot", "N/A", "", "N/A", 2400, 480, "Restores `10-25` HP!", "Rare"];
const itemBLUNDERBUSS = ["blunderbuss",8,40,"buckshot","", 800,  "Very unreliable makeshift shotgun", "Rare"];
const itemBUCKSHOT = ["buckshot","Varies","",["blunderbuss","spas"],"",2000, "Use with weapon", "Rare"];  //AMMO | UPDATE WITH NEW WEAPONS
const itemREVOLVER = ["revolver",25,35,"pistol_bullet","", 800,  "High-recoil handgun", "Rare"];
const itemGRENADE = ["grenade",8,30,"","", 700,  "Small hand-thrown explosive", "Rare"];
const itemXP_POTION = ["xp_potion", "N/A", "", "N/A", "", 700, "Use this to instantly gain `75` xp!", "Rare"];
//EPIC
const itemIRON_SHIELD = ["iron_shield", "N/A", "", "N/A", 10000, 2000, "Shields you from attacks for 2 hours!", "Epic"];
const itemAK47 = ["ak47",35, 60,"rifle_bullet","", 1800,  "High damage but inaccurate rifle", "Epic"];
const itemROCKET = ["rocket","Varies","",["rpg","javelin"],"",5000, "Use with weapon", "Epic"];
const itemTHOMPSON = ["thompson",25,45,"pistol_bullet","", 1700,  "Shoots fast but is very inaccurate", "Epic"];
const itemSPAS = ["spas",40,70,"buckshot","", 1500,  "Military shotgun", "Epic"];
const itemMEDKIT = ["medkit", "N/A", "", "N/A", 9000, 800, "Restores `50-60` HP!", "Epic"];
const itemM4A1 = ["m4a1",45, 50,"rifle_bullet","", 1700,  "Accurate automatic rifle", "Epic"];
const itemULTRA_BOX = ["ultra_box", "N/A", "", "N/A", 10000, 2000, "This box drops an item of atleast Rare quality, or potentially an Ultra item.", "Epic","","7x item_box"];
const itemULTRA_AMMO = ["ultra_ammo", "N/A", "", "N/A", "", 2200, "This box drops ammo of atleast Uncommon quality.", "Epic","","3x ammo_box"];
const itemCANVAS_BAG = ["canvas_bag", "N/A", "", "N/A", "", 2100, "Equip this backpack to gain **15** item slots!", "Epic"];
//LEGENDARY
const itemGOLD_SHIELD = ["gold_shield", "N/A", "", "N/A", 30000, 6000, "Shields you from attacks for 8 hours!", "Legendary",["steel","screw","adhesive"]];
const itemRPG = ["rpg",85,110,"rocket","",2600, "Deals very high damage to a single target, requires ammo to use", "Legendary",["steel","fiber_optics"]];
const itemJAVELIN = ["javelin",100,100,"rocket","",4000, "Target-locking rocket launcher that has 100% accuracy", "Legendary",["steel","fiber_optics"]];
const itemAWP = ["awp", 60,70,["bmg_50cal","rifle_bullet"],"",2700, "A bolt-action sniper rifle that deals extremely high damage with good accuracy.\nWill use `bmg_50cal` if you have it in your inventory.", "Legendary",["steel","screw"]];
const itemPECK_SEED = ["peck_seed",20,35,"","",1600, "This rare seed has the ability to turn your opponent into a chicken for 2 hours, disabling any use of their commands.\nInvented by *Arcane Sorceress Mick of Blackrain* ***THE*** *3rd*.", "Legendary",["adhesive"]];
const itemPLASMA = ["plasma","Varies","",["rail_cannon","ray_gun"],"",6000, "Dangerous cartridge full of plasma.\nMight wanna wear some protection when handling this...", "Legendary",["adhesive"]];
const itemBMG_50CAL = ["bmg_50cal","Varies","",["awp"],"",3500, "Sniper ammo that increases damage by `20`.\nThis ammunition is strong enough to penetrate shields.", "Legendary",["steel","adhesive"]];
const itemREROLL_SCROLL = ["reroll_scroll", "N/A", "", "N/A", 25000, 3000, "Use this to reset your attributes and gain back all used skill points!", "Legendary"];
const itemHIKERS_PACK = ["hikers_pack", "N/A", "", "N/A", "", 3300, "Equip this backpack to gain **25** item slots!", "Legendary"];
//COMPONENTS NEW
const itemSCREW = ["screw", "N/A", "", "N/A", "", 550, "Metal pin used to hold objects together.\nCrafting component used to create high-end items using the `craft` command.\nObtained from recycling Legendary+ items using the `recycle` command.", "Rare"];
const itemSTEEL = ["steel", "N/A", "", "N/A", "", 500, "A cheap but extremely strong material used to craft weapons.\nCrafting component used to create high-end items using the `craft` command.\nObtained from recycling Legendary+ items using the `recycle` command.", "Uncommon"];
const itemADHESIVE = ["adhesive", "N/A", "", "N/A", "", 700, "Used to hold things together.\nCrafting component used to create high-end items using the `craft` command.\nObtained from recycling Legendary+ items using the `recycle` command.", "Epic"];
const itemFIBER_OPTICS = ["fiber_optics", "N/A", "", "N/A", "", 1100, "Thin glass fibers used to transmit signals.\nCrafting component used to create high-end items using the `craft` command.\nObtained from recycling Legendary+ items using the `recycle` command.", "Legendary"];
const itemMODULE = ["module", "N/A", "", "N/A", "", 600, "A circuit board used for various tech.\nCrafting component used to create high-end items using the `craft` command.\nObtained from recycling Legendary+ items using the `recycle` command.", "Legendary"];

//ULTRA
const itemRAIL_CANNON = ["rail_cannon",10,200,"plasma","",20000, `Uses electromagnetic force to blast a ball of plasma that vaporizes anything it touches.`, "Ultra",["fiber_optics"],"20x module\n3x steel\n2x fiber_optics\n1x screw"];
const itemRAY_GUN = ["ray_gun",60,150,"plasma","",22500, `A lightweight particle-beam weapon that disintegrates targets on contact.`, "Ultra",["fiber_optics"],"23x module\n3x fiber_optics\n2x steel\n2x adhesive\n1x screw"];

const limitedItems = ["candycane", "gingerbread", "mittens","stocking"]; //missing snowball and nutcracker because those items were purchase only
global.commonItems = ["item_box", "rock", "fork", "club", "fish","stick"]; //keep item_box 1st
global.uncommonItems = ["ammo_box","sword", "bow","pills","bat","golf_club","light_pack"]; //keep ammo_box 1st
global.rareItems = ["glock", "crossbow", "spear","health_pot","revolver","blunderbuss","grenade","xp_potion"];
global.epicItems = ["ultra_box","ak47", "thompson","m4a1","spas","medkit","iron_shield","ultra_ammo","canvas_bag"]; //keep ultra_box and ultra_ammo 1st and last
global.legendItems = ["rpg","awp","javelin","peck_seed","gold_shield","reroll_scroll","hikers_pack"];
global.ultraItems = ["rail_cannon","ray_gun"];

const uncommonComp = ["steel"];
const rareComp = ["screw"];
const epicComp = ["adhesive"];
const legendComp = ["fiber_optics","module"];
//AMMO BASED ON RARITY, KEEP SAME AS THEY ARE IN SQL TABLE | USED FOR AMMO BOXES
global.commonAmmo = ["arrow","baseball"];
global.uncommonAmmo = ["pistol_bullet"];
global.rareAmmo = ["rifle_bullet","buckshot"];
global.epicAmmo = ["rocket"];
global.legendAmmo = ["plasma","bmg_50cal"];


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
                    .addField("=== Armor ===", "󠇰Common", true)
                    .addField("=== Backpack ===", "**Epic**", true)
                    .setImage("https://cdn.discordapp.com/attachments/497302646521069570/559899155225640970/invSlots.png")
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
            sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {                   //CHECK IF USER HAS ITEMS TO DISPLAY IN INVENTORY
                let args = message.content.split(" ").slice(1);
                let userOldID = args[0];                          //RETURNS ID WITH <@ OR <@!      
                var ultraItemList = []; //handled by info command LEAVE IT EMPTY
                var legendItemList = []; //handled by info command LEAVE IT EMPTY
                var epicItemList = []; //handled by info command LEAVE IT EMPTY
                var rareItemList = []; //handled by info command LEAVE IT EMPTY
                var uncommonItemList = []; //handled by info command LEAVE IT EMPTY
                var commonItemList = []; //handled by info command LEAVE IT EMPTY
                var limitedItemList = []; //handled by info command LEAVE IT EMPTY
                function itemCheck(item){
                    if(eval(`itemRow.${item}`)){
                        let itemName = item;
                        if(itemName == "health_pot"){
                            itemName = "HEALTH";
                        }
                        else if(itemName == "pistol_bullet"){
                            itemName = "PISTOLBULLET";
                        }
                        else if(itemName == "rifle_bullet"){
                            itemName = "RIFLEBULLET";
                        }
                        else if(itemName == "item_box"){
                            itemName = "BOX";
                        }
                        else if(itemName == "ammo_box"){
                            itemName = "AMMOBOX";
                        }
                        if(eval(`item${itemName.toUpperCase()}[7]`) == "Ultra"){
                            ultraItemList.push((`${item}(${eval(`itemRow.${item}`)})`).toLowerCase() + "\n"); //smartest line of code OR WORST ive evr written
                        }
                        else if(eval(`item${itemName.toUpperCase()}[7]`) == "Legendary"){
                            legendItemList.push((`${item}(${eval(`itemRow.${item}`)})`).toLowerCase()+ "\n"); //smartest line of code OR WORST ive evr written
                        }
                        else if(eval(`item${itemName.toUpperCase()}[7]`) == "Epic"){
                            epicItemList.push((`${item}(${eval(`itemRow.${item}`)})`).toLowerCase()+ "\n");
                        }
                        else if(eval(`item${itemName.toUpperCase()}[7]`) == "Rare"){
                            rareItemList.push((`${item}(${eval(`itemRow.${item}`)})`).toLowerCase()+ "\n");
                        }
                        else if(eval(`item${itemName.toUpperCase()}[7]`) == "Uncommon"){
                            uncommonItemList.push((`${item}(${eval(`itemRow.${item}`)})`).toLowerCase()+ "\n");
                        }
                        else if(eval(`item${itemName.toUpperCase()}[7]`) == "Common"){
                            commonItemList.push((`${item}(${eval(`itemRow.${item}`)})`).toLowerCase()+ "\n");
                        }
                        else if(eval(`item${itemName.toUpperCase()}[7]`) == "Limited"){
                            limitedItemList.push((`${item}(${eval(`itemRow.${item}`)})`).toLowerCase()+ "\n");
                        }
                    }
                    else{
                        return;
                    }
                }
                if(userOldID !== undefined){
                    if(!userOldID.startsWith("<@")){
                        message.reply("You need to mention someone!");
                        return;
                    }
                    let userNameID = args[0].replace(/[<@!>]/g, '');  //RETURNS BASE ID WITHOUT <@ OR <@! BUT ONLY IF PLAYER MENTIONED SOMEONE  
                    sql.get(`SELECT * FROM items WHERE userId ="${userNameID}"`).then(victimRow => {
                    sql.get(`SELECT * FROM scores WHERE userId ="${userNameID}"`).then(victimRowInfo => {
                        function itemVictimCheck(item){
                            if(eval(`victimRow.${item}`)){
                                let itemName = item;
                                if(itemName == "health_pot"){
                                    itemName = "HEALTH";
                                }
                                else if(itemName == "pistol_bullet"){
                                    itemName = "PISTOLBULLET";
                                }
                                else if(itemName == "rifle_bullet"){
                                    itemName = "RIFLEBULLET";
                                }
                                else if(itemName == "item_box"){
                                    itemName = "BOX";
                                }
                                else if(itemName == "ammo_box"){
                                    itemName = "AMMOBOX";
                                }
                                if(eval(`item${itemName.toUpperCase()}[7]`) == "Ultra"){
                                    ultraItemList.push((`${item}(${eval(`victimRow.${item}`)})`).toLowerCase()+ "\n");
                                }
                                if(eval(`item${itemName.toUpperCase()}[7]`) == "Legendary"){
                                    legendItemList.push((`${item}(${eval(`victimRow.${item}`)})`).toLowerCase()+ "\n"); //smartest line of code OR WORST ive evr written
                                }
                                else if(eval(`item${itemName.toUpperCase()}[7]`) == "Epic"){
                                    epicItemList.push((`${item}(${eval(`victimRow.${item}`)})`).toLowerCase()+ "\n");
                                }
                                else if(eval(`item${itemName.toUpperCase()}[7]`) == "Rare"){
                                    rareItemList.push((`${item}(${eval(`victimRow.${item}`)})`).toLowerCase()+ "\n");
                                }
                                else if(eval(`item${itemName.toUpperCase()}[7]`) == "Uncommon"){
                                    uncommonItemList.push((`${item}(${eval(`victimRow.${item}`)})`).toLowerCase()+ "\n");
                                }
                                else if(eval(`item${itemName.toUpperCase()}[7]`) == "Common"){
                                    commonItemList.push((`${item}(${eval(`victimRow.${item}`)})`).toLowerCase()+ "\n");
                                }
                                else if(eval(`item${itemName.toUpperCase()}[7]`) == "Limited"){
                                    limitedItemList.push((`${item}(${eval(`victimRow.${item}`)})`).toLowerCase()+ "\n");
                                }
                            }
                            else{
                                return;
                            }
                        }
                        if(!victimRow){
                            message.reply("The person you're trying to search doesn't have an account!");
                            return;
                        }
                        for (i = 0; i < completeItemsCheck.length; i++) { //iterates through each item and checks if player has it
                            itemVictimCheck(completeItemsCheck[i]);
                        }
                        totalXpNeeded = 0;
                        for(var i = 1; i <= victimRowInfo.level;i++){
                            xpNeeded = Math.floor(50*(i**1.7));
                            totalXpNeeded += xpNeeded;
                            if(i == victimRowInfo.level){
                                break;
                            }
                        }
    
                        function userRate(){
                            let itemScore = 0;
                            itemScore += ultraItemList.length * 30;
                            itemScore += legendItemList.length * 20;
                            itemScore += epicItemList.length * 10;
                            itemScore += rareItemList.length * 5;
                            itemScore += uncommonItemList.length * 2;
                            itemScore += commonItemList.length * 1;
                            itemScore += (victimRowInfo.level * 5) -5;
                            if(victimRowInfo.health <= 50){
                                itemScore = itemScore/2
                            }
                            else if(victimRowInfo.health <= 60){
                                itemScore = itemScore * 0.66;
                            }
                            else if(victimRowInfo.health <= 70){
                                itemScore = itemScore * .8;
                            }
                            return itemScore.toFixed(2);
                        }
                        let userScoreImage = "";
                        let userScoreColor = 0;
                        
                        if(userRate() <= 30){
                            userScoreImage = "https://cdn.discordapp.com/attachments/501120454136692737/501971708585050133/pixelbnner.png";
                            userScoreColor = 720640;
                        }
                        else if(userRate() <= 55){
                            userScoreImage = "https://cdn.discordapp.com/attachments/501120454136692737/501971770098843668/pixelbnner2good-Recovered.png";
                            userScoreColor = 16761856;
                        }
                        else if(userRate() <= 120){
                            userScoreImage = "https://cdn.discordapp.com/attachments/501120454136692737/501971821483261953/pixelbnner3stronk.png";
                            userScoreColor = 16734464;
                        }
                        else{
                            userScoreImage = "https://cdn.discordapp.com/attachments/501120454136692737/501971878873923599/pixelbnner4HITMAN.png";
                            userScoreColor = 16761204;
                        }
                        let userRating = userRate();
    
                        
                        const victimInfo = new Discord.RichEmbed()
                        .setAuthor(`${message.guild.members.get(userNameID).displayName}'s Inventory`, client.users.get(userNameID).avatarURL)
                        .setColor(userScoreColor)
                        .setImage(userScoreImage)
                        console.log(totalXpNeeded - victimRowInfo.points);
                        if(totalXpNeeded - victimRowInfo.points > 0){
                            victimInfo.addField("Level : "+ victimRowInfo.level,"`" + (totalXpNeeded - victimRowInfo.points) +" xp until level " + (victimRowInfo.level + 1) + "`", true)
                        }
                        else{
                            victimInfo.addField("Level : "+ victimRowInfo.level,"`0 xp until level " + (victimRowInfo.level) + "`", true)
                        }
                        if(ironShieldActive.has(userNameID)){
                            victimInfo.addField("🛡SHIELD ACTIVE", "`" + ((ironShieldCd * 1000 - ((new Date()).getTime() - victimRowInfo.ironShieldTime)) / 60000).toFixed(1) + " minutes`", true);
                        }
                        if(goldShieldActive.has(userNameID)){
                            victimInfo.addField("🛡SHIELD ACTIVE", "`" + ((goldShieldCd * 1000 - ((new Date()).getTime() - victimRowInfo.goldShieldTime)) / 60000).toFixed(1) + " minutes`", true);
                        }
                        if(mittenShieldActive.has(userNameID)){
                            victimInfo.addField("🛡SHIELD ACTIVE", "`" + ((mittenShieldCd * 1000 - ((new Date()).getTime() - victimRowInfo.mittenShieldTime)) / 60000).toFixed(1) + " minutes`", true);
                        }
                        victimInfo.addField("❤Health", `${victimRowInfo.health}/${victimRowInfo.maxHealth}\u200b`)
                        victimInfo.addField("💵Money : $" + victimRowInfo.money,"\u200b")
                        if(moddedUsers.has(userNameID)){
                            victimInfo.setFooter("User rating: " +userRating + " | This user is a Lootcord moderator! 💪");
                        }
                        else{
                            victimInfo.setFooter("User rating: " +userRating);
                        }
                        if(ultraItemList != ""){
                            let newList = ultraItemList.join('');
                            victimInfo.addField("<:UnboxUltra:526248982691840003>Ultra", "```" + newList + "```", true);
                        }
                        if(legendItemList != ""){
                            let newList = legendItemList.join('');
                            victimInfo.addField("<:UnboxLegendary:526248970914234368>Legendary", "```" + newList + "```", true);
                        }
                        if(epicItemList != ""){
                            let newList = epicItemList.join('');
                            victimInfo.addField("<:UnboxEpic:526248961892155402>Epic", "```" + newList + "```", true);
                        }
                        if(rareItemList != ""){
                            let newList = rareItemList.join('');
                            victimInfo.addField("<:UnboxRare:526248948579434496>Rare", "```" + newList + "```", true);
                        }
                        if(uncommonItemList != ""){
                            let newList = uncommonItemList.join('');
                            victimInfo.addField("<:UnboxUncommon:526248928891371520>Uncommon", "```" + newList + "```", true);
                        }
                        if(commonItemList != ""){
                            let newList = commonItemList.join('');
                            victimInfo.addField("<:UnboxCommon:526248905676029968>Common", "```" + newList + "```", true);
                        }
                        if(limitedItemList != ""){
                            let newList = limitedItemList.join('');
                            victimInfo.addField("🎁Limited", "```" + newList + "```", true);
                        }
                        if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == "" && limitedItemList == ""){
                            victimInfo.addField("This users inventory is empty!", "\u200b");
                        }
                        message.channel.send(victimInfo);
                        ultraItemList = [];
                        legendItemList = [];
                        epicItemList = [];
                        rareItemList = [];
                        uncommonItemList = [];
                        commonItemList = [];
                        limitedItemList = [];
                    });
                    });
                }
                else{
                    methods.getitemcount(sql, message.author.id).then(itemCt => {
                    for (var i = 0; i < completeItemsCheck.length; i++) {
                        itemCheck(completeItemsCheck[i]);
                    }
                    function userRate(){
                        let itemScore = 0;
                        itemScore += ultraItemList.length * 30;
                        itemScore += legendItemList.length * 20;
                        itemScore += epicItemList.length * 10;
                        itemScore += rareItemList.length * 5;
                        itemScore += uncommonItemList.length * 2;
                        itemScore += commonItemList.length * 1;
                        itemScore += (row.level * 5) - 5;
                        if(row.health <= 50){
                            itemScore = itemScore/2
                        }
                        else if(row.health <= 60){
                            itemScore = itemScore * 0.66;
                        }
                        else if(row.health <= 70){
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

                    const embedInfo = new Discord.RichEmbed()
                    .setColor(userScoreColor)
                    .setAuthor(`${message.member.displayName}'s Inventory`, message.author.avatarURL)
                    .setImage(userScoreImage)
                    if(totalXpNeeded - row.points <= 0){
                        embedInfo.addField("Level : "+ row.level,"`0 xp until level " + (row.level) + "`", true)
                    }
                    else{
                        embedInfo.addField("Level : "+ row.level,"`" + (totalXpNeeded - row.points) +" xp until level " + (row.level + 1) + "`", true)
                    }
                    if(ironShieldActive.has(message.author.id)){
                        embedInfo.addField("🛡SHIELD ACTIVE", "`" + ((ironShieldCd * 1000 - ((new Date()).getTime() - row.ironShieldTime)) / 60000).toFixed(1) + " minutes`", true);
                    }
                    if(goldShieldActive.has(message.author.id)){
                        embedInfo.addField("🛡SHIELD ACTIVE", "`" + ((goldShieldCd * 1000 - ((new Date()).getTime() - row.goldShieldTime)) / 60000).toFixed(1) + " minutes`", true);
                    }
                    if(mittenShieldActive.has(message.author.id)){
                        embedInfo.addField("🛡SHIELD ACTIVE", "`" + ((mittenShieldCd * 1000 - ((new Date()).getTime() - row.mittenShieldTime)) / 60000).toFixed(1) + " minutes`", true);
                    }
                    embedInfo.addField("❤Health",`${row.health}/${row.maxHealth}`)
                    embedInfo.addField("💵Money : $" + row.money,"\u200b")
                    if(moddedUsers.has(message.author.id)){
                        embedInfo.setFooter("Inventory space: " + itemCt.capacity + " max | This user is a Lootcord moderator! 💪");
                    }
                    else{
                        embedInfo.setFooter("Inventory space: " + itemCt.capacity + " max");
                    }
                    if(ultraItemList != ""){
                        let newList = ultraItemList.join('');
                        embedInfo.addField("<:UnboxUltra:526248982691840003>Ultra", "```" + newList + "```", true);
                    }
                    if(legendItemList != ""){
                        let newList = legendItemList.join('');
                        embedInfo.addField("<:UnboxLegendary:526248970914234368>Legendary", "```" + newList + "```", true);
                    }
                    if(epicItemList != ""){
                        let newList = epicItemList.join('');
                        embedInfo.addField("<:UnboxEpic:526248961892155402>Epic", "```" + newList + "```", true);
                    }
                    if(rareItemList != ""){
                        let newList = rareItemList.join('');
                        embedInfo.addField("<:UnboxRare:526248948579434496>Rare", "```" + newList + "```", true);
                    }
                    if(uncommonItemList != ""){
                        let newList = uncommonItemList.join('');
                        embedInfo.addField("<:UnboxUncommon:526248928891371520>Uncommon", "```" + newList + "```", true);
                    }
                    if(commonItemList != ""){
                        let newList = commonItemList.join('');
                        embedInfo.addField("<:UnboxCommon:526248905676029968>Common", "```" + newList + "```", true);
                    }
                    if(limitedItemList != ""){
                        let newList = limitedItemList.join('');
                        embedInfo.addField("🎁Limited", "```" + newList + "```", true);
                    }
                    if(ultraItemList == "" && legendItemList == "" && epicItemList == "" && rareItemList == "" && uncommonItemList == "" && commonItemList == ""&& limitedItemList == ""){
                        embedInfo.addField("Your inventory is empty!", "\u200b");
                    }
                    message.channel.send(embedInfo);
                    });
                }
                ultraItemList = [];
                legendItemList = [];
                epicItemList = [];
                rareItemList = [];
                uncommonItemList = [];
                commonItemList = [];
                limitedItemList = [];
            });
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
            else if(itemUsed == undefined){
                return message.reply('You need to specify an item and mention a user to attack! `'+prefix+'use <item> <@user>`');
            }
            else if(!itemsList.includes(itemUsed.toLowerCase()) && userOldID == undefined){
                message.reply('You need to specify an item and mention a user to attack! `'+prefix+'use <item> <@user>`');
                return;
            }
            else if(itemsList.includes(itemUsed.toLowerCase())){    //ITEMS TIME!!!!!!!!!!!!!!!!!!!
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
                else if(itemUsed.toLowerCase() == "health" && row.health_pot >= 1 || itemUsed.toLowerCase() == "health_pot" && row.health_pot >= 1){
                    let chance = Math.floor((Math.random() * 11) + 15);
                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(hpRow => {
                        if(healCooldown.has(message.author.id)){
                            message.reply("You need to wait  `" + ((healCdSeconds * 1000 - ((new Date()).getTime() - hpRow.healTime)) / 60000).toFixed(1) + " minutes`  before healing again.");
                            return;
                        }
                        let userMaxHeal = hpRow.maxHealth - hpRow.health;
                        
                        if(userMaxHeal == 0){
                            return message.reply("You are already max health!");
                        }
                        else if(userMaxHeal >= chance){
                            sql.run(`UPDATE scores SET healTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                            healCooldown.add(message.author.id);
                            sql.run(`UPDATE scores SET health = ${hpRow.health + chance} WHERE userId = ${message.author.id}`);
                            message.reply("You have healed for `" + chance + "` HP!");
                            sql.run(`UPDATE items SET health_pot = ${row.health_pot - 1} WHERE userId = ${message.author.id}`);
                        }
                        else if(userMaxHeal <= chance){
                            sql.run(`UPDATE scores SET healTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                            healCooldown.add(message.author.id);
                            sql.run(`UPDATE scores SET health = ${hpRow.health + userMaxHeal} WHERE userId = ${message.author.id}`);
                            message.reply("You have healed for `" + userMaxHeal + "` HP!");
                            sql.run(`UPDATE items SET health_pot = ${row.health_pot - 1} WHERE userId = ${message.author.id}`);
                        }
                        setTimeout(() => {
                            healCooldown.delete(message.author.id)
                            sql.run(`UPDATE scores SET healTime = ${0} WHERE userId = ${message.author.id}`);
                        }, healCdSeconds * 1000);
                    });
                }
                else if(itemUsed == "pills" && row.pills >= 1){
                    let chance = Math.floor((Math.random() * 10) + 5); //AMOUNT TO HEAL
                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(hpRow => {
                        if(healCooldown.has(message.author.id)){
                            message.reply("You need to wait  `" + ((healCdSeconds * 1000 - ((new Date()).getTime() - hpRow.healTime)) / 60000).toFixed(1) + " minutes`  before healing again.");
                            return;
                        }

                        let userMaxHeal = hpRow.maxHealth - hpRow.health;
                        
                        if(userMaxHeal == 0){
                            return message.reply("You are already max health!");
                        }
                        else if(userMaxHeal >= chance){
                            sql.run(`UPDATE scores SET healTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                            healCooldown.add(message.author.id);
                            sql.run(`UPDATE scores SET health = ${hpRow.health + chance} WHERE userId = ${message.author.id}`);
                            message.reply("You have healed for `" + chance + "` HP!");
                            sql.run(`UPDATE items SET pills = ${row.pills - 1} WHERE userId = ${message.author.id}`);
                        }
                        else if(userMaxHeal <= chance){
                            sql.run(`UPDATE scores SET healTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                            healCooldown.add(message.author.id);
                            sql.run(`UPDATE scores SET health = ${hpRow.health + userMaxHeal} WHERE userId = ${message.author.id}`);
                            message.reply("You have healed for `" + userMaxHeal + "` HP!");
                            sql.run(`UPDATE items SET pills = ${row.pills - 1} WHERE userId = ${message.author.id}`);
                        }
                        setTimeout(() => {
                            healCooldown.delete(message.author.id)
                            sql.run(`UPDATE scores SET healTime = ${0} WHERE userId = ${message.author.id}`);
                        }, healCdSeconds * 1000);
                    });
                }
                else if(itemUsed == "gingerbread" && row.gingerbread >= 1){
                    let chance = Math.floor((Math.random() * 6) + 20); //AMOUNT TO HEAL
                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(hpRow => {
                        if(healCooldown.has(message.author.id)){
                            message.reply("You need to wait  `" + ((healCdSeconds * 1000 - ((new Date()).getTime() - hpRow.healTime)) / 60000).toFixed(1) + " minutes`  before healing again.");
                            return;
                        }

                        let userMaxHeal = hpRow.maxHealth - hpRow.health;
                        
                        if(userMaxHeal == 0){
                            return message.reply("You are already max health!");
                        }
                        else if(userMaxHeal >= chance){
                            sql.run(`UPDATE scores SET healTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                            healCooldown.add(message.author.id);
                            sql.run(`UPDATE scores SET health = ${hpRow.health + chance} WHERE userId = ${message.author.id}`);
                            message.reply("You have healed for `" + chance + "` HP!");
                            sql.run(`UPDATE items SET gingerbread = ${row.gingerbread - 1} WHERE userId = ${message.author.id}`);
                        }
                        else if(userMaxHeal <= chance){
                            sql.run(`UPDATE scores SET healTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                            healCooldown.add(message.author.id);
                            sql.run(`UPDATE scores SET health = ${hpRow.health + userMaxHeal} WHERE userId = ${message.author.id}`);
                            message.reply("You have healed for `" + userMaxHeal + "` HP!");
                            sql.run(`UPDATE items SET gingerbread = ${row.gingerbread - 1} WHERE userId = ${message.author.id}`);
                        }
                        setTimeout(() => {
                            healCooldown.delete(message.author.id)
                            sql.run(`UPDATE scores SET healTime = ${0} WHERE userId = ${message.author.id}`);
                        }, healCdSeconds * 1000);
                    });
                }
                else if(itemUsed == "medkit" && row.medkit >= 1 || itemUsed =="med" && row.medkit >=1){
                    let chance = Math.floor((Math.random() * 11) + 50); //AMOUNT TO HEAL
                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(hpRow => {
                        if(healCooldown.has(message.author.id)){
                            message.reply("You need to wait  `" + ((healCdSeconds * 1000 - ((new Date()).getTime() - hpRow.healTime)) / 60000).toFixed(1) + " minutes`  before healing again.");
                            return;
                        }

                        let userMaxHeal = hpRow.maxHealth - hpRow.health;
                        
                        if(userMaxHeal == 0){
                            return message.reply("You are already max health!");
                        }
                        else if(userMaxHeal >= chance){
                            sql.run(`UPDATE scores SET healTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                            healCooldown.add(message.author.id);
                            sql.run(`UPDATE scores SET health = ${hpRow.health + chance} WHERE userId = ${message.author.id}`);
                            message.reply("You have healed for `" + chance + "` HP!");
                            sql.run(`UPDATE items SET medkit = ${row.medkit - 1} WHERE userId = ${message.author.id}`);
                        }
                        else if(userMaxHeal <= chance){
                            sql.run(`UPDATE scores SET healTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
                            healCooldown.add(message.author.id);
                            sql.run(`UPDATE scores SET health = ${hpRow.health + userMaxHeal} WHERE userId = ${message.author.id}`);
                            message.reply("You have healed for `" + userMaxHeal + "` HP!");
                            sql.run(`UPDATE items SET medkit = ${row.medkit - 1} WHERE userId = ${message.author.id}`);
                        }
                        setTimeout(() => {
                            healCooldown.delete(message.author.id)
                            sql.run(`UPDATE scores SET healTime = ${0} WHERE userId = ${message.author.id}`);
                        }, healCdSeconds * 1000);
                    });
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
            else{
                sql.get(`SELECT * FROM scores WHERE userId =${userNameID}`).then(victimRow => {             //GRABS INFORMATION FOR PLAYERS TARGET  //
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
                                    for (var i = 0; i < completeItemsCheck.length; i++) {
                                        if(eval(`victimItems.` + completeItemsCheck[i])){
                                            if(completeItemsCheck[i] !== "token"){
                                                victimItemCount.push(completeItemsCheck[i]);
                                            }
                                        }
                                    }
                                    
                                    if(victimItemCount.length == 0){
                                        amountToGive = 0;
                                    }
        
                                    else if(victimItemCount.length <= 9){
                                        amountToGive = 2;
                                    }
                                    else{
                                        amountToGive = Math.floor(victimItemCount.length/5)
                                    }
                                    /*
                                    else{
                                        methods.randomItems(sql, completeItemsCheck, message.author.id, userNameID, 4).then(result => {
                                            console.log(result);
                                        });
                                        itemOne = victimItemsList[Math.floor(Math.random() * victimItemsList.length)];
                                        itemTwo = victimItemsList[Math.floor(Math.random() * victimItemsList.length)];
                                        while (itemOne == itemTwo){
                                            itemTwo = victimItemsList[Math.floor(Math.random() * victimItemsList.length)];
                                        }
                                        sql.run(`UPDATE items SET ${itemOne} = ${eval(`row.` + itemOne) + 1} WHERE userId = ${message.author.id}`);
                                        sql.run(`UPDATE items SET ${itemTwo} = ${eval(`row.` + itemTwo) + 1} WHERE userId = ${message.author.id}`);
        
                                        sql.run(`UPDATE items SET ${itemOne} = ${eval(`victimItems.` + itemOne) - 1} WHERE userId = ${userNameID}`);
                                        sql.run(`UPDATE items SET ${itemTwo} = ${eval(`victimItems.` + itemTwo) - 1} WHERE userId = ${userNameID}`);
                                        itemTwo = " | " + itemTwo;
                                    
                                    }
                                    */
                                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(userRow => {
                                        methods.randomItems(sql, completeItemsCheck, message.author.id, userNameID, amountToGive).then(result => {
                                        
                                            sql.run(`UPDATE scores SET money = ${userRow.money + victimRow.money} WHERE userId = ${message.author.id}`);
                                            sql.run(`UPDATE scores SET points = ${userRow.points + 100} WHERE userId = ${message.author.id}`);
                                            sql.run(`UPDATE scores SET kills = ${userRow.kills + 1} WHERE userId = ${message.author.id}`); //add 1 to kills
        
                                            sql.run(`UPDATE scores SET health = ${100} WHERE userId = ${userNameID}`);
                                            sql.run(`UPDATE scores SET money = ${0} WHERE userId = ${userNameID}`);
                                            sql.run(`UPDATE scores SET deaths = ${victimRow.deaths + 1} WHERE userId = ${userNameID}`); //add 1 to deaths for killed user
        
                                            const killedReward = new Discord.RichEmbed()  
                                            .setTitle(`LOOT RECEIVED`)
                                            .setDescription("Money : $" + victimRow.money + "\nExperience : `100xp`")
                                            .setColor(7274496)
                                            .addField("**ITEMS**", result)
                                            message.channel.send(killedReward);
        
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
                    if(!userOldID.startsWith("<@") && !userOldID.startsWith("rand")){                     //CHECKING FOR ERRORS IN MENTION
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
                                    message.delete();
                                    if(((weapCdSeconds * 1000 - ((new Date()).getTime() - CDRow.attackTime)) / 60000).toFixed(1) < 0){
                                        message.reply("You recently deleted your account, but you still have to wait an hour to attack!");
                                    }
                                    else{
                                        message.reply("You need to wait  `" + ((weapCdSeconds * 1000 - ((new Date()).getTime() - CDRow.attackTime)) / 60000).toFixed(1) + " minutes`  before attacking again.");
                                    }
                                    return;
                                }
                                else{                                       //WEAPONS!!!!!!!!!!!!!
                                    console.log(row.scaledDamage);
                                    if(itemUsed.toLowerCase() == "rpg" && row.rpg >= 1 && row.rocket >= 1){
                                        sql.run(`UPDATE items SET rocket = ${row.rocket - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 26) + itemRPG[1]) * row.scaledDamage), false);   //deals 85-110 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "ak47" && row.ak47 >= 1  && row.rifle_bullet >= 1){
                                        sql.run(`UPDATE items SET rifle_bullet = ${row.rifle_bullet - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 26) + itemAK47[1]) * row.scaledDamage), false);   //deals 35-60 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "bow" && row.bow >= 1  && row.arrow >= 1){
                                        sql.run(`UPDATE items SET arrow = ${row.arrow - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 10) + itemBOW[1]) * row.scaledDamage), false);   //deals 8-17 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "crossbow" && row.crossbow >= 1  && row.arrow >= 1){
                                        sql.run(`UPDATE items SET arrow = ${row.arrow - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 19) + itemCROSSBOW[1]) * row.scaledDamage), false);   //deals 15-33 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "spear" && row.spear >= 1){
                                        sql.run(`UPDATE items SET spear = ${row.spear - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 11) + itemSPEAR[1]) * row.scaledDamage), true);   //deals 15-25 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "club" && row.club >= 1){
                                        sql.run(`UPDATE items SET club = ${row.club - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 6) + itemCLUB[1]) * row.scaledDamage), true);   //deals 6-11 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "fork" && row.fork >= 1){
                                        sql.run(`UPDATE items SET fork = ${row.fork - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 6) + itemFORK[1]) * row.scaledDamage), true);   //deals 4-9 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "sword" && row.sword >= 1){
                                        sql.run(`UPDATE items SET sword = ${row.sword - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 11) + itemSWORD[1]) * row.scaledDamage), true);   //deals 10-20 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "rock" && row.rock >= 1){
                                        sql.run(`UPDATE items SET rock = ${row.rock - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 6) + itemROCK[1]) * row.scaledDamage), true);   //deals 5-10 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "glock" && row.glock >= 1  && row.pistol_bullet >= 1){
                                        sql.run(`UPDATE items SET pistol_bullet = ${row.pistol_bullet - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 10) + itemGLOCK[1]) * row.scaledDamage), false);   //deals 21-30 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "thompson" && row.thompson >= 1  && row.pistol_bullet >= 1){
                                        sql.run(`UPDATE items SET pistol_bullet = ${row.pistol_bullet - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 21) + itemTHOMPSON[1]) * row.scaledDamage), false);   //deals 25-45 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "bat" && row.bat >= 1  && row.baseball >= 1){
                                        sql.run(`UPDATE items SET baseball = ${row.baseball - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 21) + itemBAT[1]) * row.scaledDamage), false);   //deals 10-30 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "bat" && row.bat >= 1){
                                        sql.run(`UPDATE items SET bat = ${row.bat - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 9) + itemBAT[1]) * row.scaledDamage), true);   //deals 10-18 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "blunderbuss" && row.blunderbuss >= 1  && row.buckshot >= 1){
                                        sql.run(`UPDATE items SET buckshot = ${row.buckshot - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 33) + itemBLUNDERBUSS[1]) * row.scaledDamage), false);   //deals 8-40 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "revolver" && row.revolver >= 1  && row.pistol_bullet >= 1){
                                        sql.run(`UPDATE items SET pistol_bullet = ${row.pistol_bullet - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 11) + itemREVOLVER[1]) * row.scaledDamage), false);   //deals 25-35 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "grenade" && row.grenade >= 1){
                                        sql.run(`UPDATE items SET grenade = ${row.grenade - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 23) + itemGRENADE[1]) * row.scaledDamage), true);   //deals 8-30 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "spas" && row.spas >= 1  && row.buckshot >= 1){
                                        sql.run(`UPDATE items SET buckshot = ${row.buckshot - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 31) + itemSPAS[1]) * row.scaledDamage), false);   //deals 40-70 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "m4a1" && row.m4a1 >= 1  && row.rifle_bullet >= 1){
                                        sql.run(`UPDATE items SET rifle_bullet = ${row.rifle_bullet - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 6) + itemM4A1[1]) * row.scaledDamage), false);   //deals 45-50 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    //itemUsed.toLowerCase() == "awp" && row.awp >= 1 && row.bmg_50cal >= 1
                                    else if(itemUsed.toLowerCase() == "awp" && row.awp >= 1  && row.bmg_50cal >= 1){
                                        sql.run(`UPDATE items SET bmg_50cal = ${row.bmg_50cal - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 11) + (itemAWP[1] + 20)) * row.scaledDamage), false);   //deals 80-90 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "awp" && row.awp >= 1  && row.rifle_bullet >= 1){
                                        sql.run(`UPDATE items SET rifle_bullet = ${row.rifle_bullet - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 11) + itemAWP[1]) * row.scaledDamage), false);   //deals 60-70 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "javelin" && row.javelin >= 1  && row.rocket >= 1){
                                        sql.run(`UPDATE items SET rocket = ${row.rocket - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(itemJAVELIN[1] * row.scaledDamage), false);   //deals 100 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "rail_cannon" && row.rail_cannon >= 1  && row.plasma >= 1){
                                        sql.run(`UPDATE items SET plasma = ${row.plasma - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 191) + itemRAIL_CANNON[1]) * row.scaledDamage), false);   //deals 10-999 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "fish" && row.fish >= 1){
                                        sql.run(`UPDATE items SET fish = ${row.fish - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 7) + itemFISH[1]) * row.scaledDamage), true);   //deals 5-11 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "candycane" && row.candycane >= 1){
                                        sql.run(`UPDATE items SET candycane = ${row.candycane - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 13) + itemCANDYCANE[1]) * row.scaledDamage), true);   //deals 3-15 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "snowball" && row.snowball >= 1){
                                        sql.run(`UPDATE items SET snowball = ${row.snowball - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 26) + itemSNOWBALL[1]) * row.scaledDamage), true);   //deals 20-45 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "nutcracker" && row.nutcracker >= 1){
                                        sql.run(`UPDATE items SET nutcracker = ${row.nutcracker - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 36) + itemNUTCRACKER[1]) * row.scaledDamage), true);   //deals 30-65 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "peck_seed" && row.peck_seed >= 1){
                                        sql.run(`UPDATE items SET peck_seed = ${row.peck_seed - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 16) + itemPECK_SEED[1]) * row.scaledDamage), true);  //deals 20-35 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "golf_club" && row.golf_club >= 1){
                                        sql.run(`UPDATE items SET golf_club = ${row.golf_club - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 10) + itemGOLF_CLUB[1]) * row.scaledDamage), true);   //deals 12-21 damage unscaled

                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "stick" && row.stick >= 1){
                                        sql.run(`UPDATE items SET stick = ${row.stick - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 4) + itemSTICK[1]) * row.scaledDamage), true);  //deals 3-6 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(itemUsed.toLowerCase() == "ray_gun" && row.ray_gun >= 1  && row.plasma >= 1){
                                        sql.run(`UPDATE items SET plasma = ${row.plasma - 1} WHERE userId = ${message.author.id}`);
                                        hitOrMiss(Math.floor(((Math.random() * 91) + itemRAY_GUN[1]) * row.scaledDamage), false);  //deals 60-150 damage unscaled
                                        
                                        sql.run(`UPDATE scores SET attackTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`); //code that adds
                                        weapCooldown.add(message.author.id);                                                                     //user to cooldown list
                                    }
                                    else if(!weapCooldown.has(message.author.id)){
                                        return message.reply(`You don't have the item and/or need ammo for it!`);
                                    }
                                }
                                setTimeout(() => {
                                    weapCooldown.delete(message.author.id);
                                    sql.run(`UPDATE scores SET attackTime = ${0} WHERE userId = ${message.author.id}`);
                                }, weapCdSeconds * 1000);
                            });
                        });
                    }
                }).catch((err) => {
                    return message.reply('ERROR: ```'+err+'```');
                });
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
        let sellAmount = 1;
        let itemPrice = "";
        let recycleMin = 0;
        let recycleMax = 1;
        let extraScrap = "";
        let chance = Math.random();
        if(craftItem !== undefined){
            craftItem = craftItem.toLowerCase();
            //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
            if(craftItem.startsWith("rail")){
                craftItem = "RAIL_CANNON";
            }
            else if(craftItem.startsWith("ray")){
                craftItem = "RAY_GUN";
            }
            else if(craftItem.startsWith("ray")){
                craftItem = "RAY_GUN";
            }
            else if(craftItem.startsWith("ammo")){
                craftItem = "AMMOBOX";
            }
            else if(craftItem.startsWith("ultra_a")){
                craftItem = "ULTRA_AMMO";
            }
            else if(craftItem.startsWith("ultra")){
                craftItem = "ULTRA_BOX";
            }
            else{
                return message.reply("That item cannot be crafted!");
            }
            itemPrice = eval(`item${craftItem.toUpperCase()}[9]`);
            let itemName = eval(`item${craftItem.toUpperCase()}[0]`);
            const embedInfo = new Discord.RichEmbed()
            .setTitle("Craft `" + itemName + "` for")
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
                        sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                            if(itemName == "rail_cannon"){
                                if(itemRow.module >= 20 && itemRow.fiber_optics >= 2 && itemRow.steel >= 3 && itemRow.screw >= 1){
                                    message.reply("Successfully crafted `rail_cannon`!");
                                    sql.run(`UPDATE items SET rail_cannon = ${itemRow.rail_cannon + 1} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET module = ${itemRow.module - 20} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET fiber_optics = ${itemRow.fiber_optics - 2} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET steel = ${itemRow.steel - 3} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET screw = ${itemRow.screw - 1} WHERE userId = ${message.author.id}`);
                                }
                                else{
                                    message.reply("You are missing the required materials for this item!");
                                }
                            }
                            else if(itemName == "ray_gun"){
                                if(itemRow.module >= 23 && itemRow.fiber_optics >= 3 && itemRow.steel >= 2 && itemRow.adhesive >= 2 && itemRow.screw >= 1){
                                    message.reply("Successfully crafted `ray_gun`!");
                                    sql.run(`UPDATE items SET ray_gun = ${itemRow.ray_gun + 1} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET module = ${itemRow.module - 23} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET fiber_optics = ${itemRow.fiber_optics - 3} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET steel = ${itemRow.steel - 2} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET adhesive = ${itemRow.adhesive - 2} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET screw = ${itemRow.screw - 1} WHERE userId = ${message.author.id}`);
                                }
                                else{
                                    message.reply("You are missing the required materials for this item!");
                                }
                            }
                            else if(itemName == "ammo_box"){
                                if(itemRow.item_box >= 3){
                                    message.reply("Successfully crafted `ammo_box`!");
                                    sql.run(`UPDATE items SET ammo_box = ${itemRow.ammo_box + 1} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET item_box = ${itemRow.item_box - 3} WHERE userId = ${message.author.id}`);
                                }
                                else{
                                    message.reply("You are missing the required materials for this item!");
                                }
                            }
                            else if(itemName == "ultra_ammo"){
                                if(itemRow.ammo_box >= 3){
                                    message.reply("Successfully crafted `ultra_ammo`!");
                                    sql.run(`UPDATE items SET ultra_ammo = ${itemRow.ultra_ammo + 1} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET ammo_box = ${itemRow.ammo_box - 3} WHERE userId = ${message.author.id}`);
                                }
                                else{
                                    message.reply("You are missing the required materials for this item!");
                                }
                            }
                            else if(itemName == "ultra_box"){
                                if(itemRow.item_box >= 7){
                                    message.reply("Successfully crafted `ultra_box`!");
                                    sql.run(`UPDATE items SET ultra_box = ${itemRow.ultra_box + 1} WHERE userId = ${message.author.id}`);
                                    sql.run(`UPDATE items SET item_box = ${itemRow.item_box - 7} WHERE userId = ${message.author.id}`);
                                }
                                else{
                                    message.reply("You are missing the required materials for this item!");
                                }
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
        let sellAmount = 1;
        let itemPrice = "";
        let recycleMin = 0;
        let recycleMax = 1;
        let extraScrap = "";
        let chance = Math.random();
        let rand = "";
        if(sellItem !== undefined){
            sellItem = sellItem.toLowerCase();
            //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
            if(sellItem == "rpg"){
            }
            else if(sellItem == "item_box" || sellItem == "box"){
                sellItem = "BOX";
            }
            else if(sellItem == "ammo_box" || sellItem == "ammo"){
                sellItem = "AMMOBOX";
            }
            else if(sellItem == "ultra" || sellItem == "ultrabox"){
                sellItem = "ULTRA_BOX";
            }
            else if(sellItem == "rail" || sellItem == "cannon"){
                sellItem = "RAIL_CANNON";
            }
            else if(sellItem == "bmg" || sellItem == "50cal"){
                sellItem = "BMG_50CAL";
            }
            else if(sellItem == "iron" || sellItem == "shield"){
                sellItem = "IRON_SHIELD";
            }
            else if(sellItem == "gold" || sellItem == "goldshield"){
                sellItem = "GOLD_SHIELD";
            }
            else if(sellItem == "rifle_bullet"){
                sellItem = "RIFLEBULLET";
            }
            else if(sellItem == "pistol_bullet"){
                sellItem = "PISTOLBULLET";
            }
            else if(sellItem == "health_pot" || sellItem == "health"){
                sellItem = "HEALTH";
            }
            else if(sellItem == "peck" || sellItem == "peckseed"){
                sellItem = "PECK_SEED";
            }
            else if(!completeItemsCheck.includes(sellItem)){
                message.reply("Only `Legendary`+ items are eligible for recycling.");
                return;
            }
            else if(eval(`item${sellItem.toUpperCase()}[7]`) !== "Legendary" && eval(`item${sellItem.toUpperCase()}[7]`) !== "Ultra"){
                message.reply("Only `Legendary`+ items are eligible for recycling.");
                return;
            }
            if(eval(`item${sellItem.toUpperCase()}[7]`) == "Legendary"){
                recycleMin = 1;
                recycleMax = 3;
                let subArray = eval(`item${sellItem.toUpperCase()}[8]`);
                rand = subArray[Math.floor(Math.random() * subArray.length)];
                extraScrap = "0 - 1 " + eval(`item${sellItem.toUpperCase()}[8]`);
            }
            else if(eval(`item${sellItem.toUpperCase()}[7]`) == "Ultra"){
                recycleMin = 2;
                recycleMax = 4;
                let subArray = eval(`item${sellItem.toUpperCase()}[8]`);
                rand = subArray[Math.floor(Math.random() * subArray.length)];
                extraScrap = "1 " + eval(`item${sellItem.toUpperCase()}[8]`);
                chance = 1;
            }
            /*
            if(sellAmount == undefined){
                sellAmount = 1;
            }
            else if(!Number.isInteger(parseInt(sellAmount))){
                sellAmount = 1;
            }
            else if(sellAmount % 1 !== 0){
                sellAmount = 1;
            }
            itemPrice = Math.floor(Math.random() * ((recycleMax * sellAmount) - (recycleMin * sellAmount) + 1)) + (recycleMin * sellAmount) //Generates module amount
            */
            itemPrice = Math.floor(Math.random() * ((recycleMax) - (recycleMin) + 1)) + (recycleMin)
            let itemName = eval(`item${sellItem.toUpperCase()}[0]`);
            const embedInfo = new Discord.RichEmbed()
            .setTitle("Recycle `" + itemName + "` for")
            .setDescription("```" + (recycleMin) +" - "+(recycleMax) + " module\n\n"+extraScrap+"```")
            .setColor(0)
            .setImage("https://cdn.discordapp.com/attachments/454163538886524928/527630489851265025/goldLine.png")
            .setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/527391190975381505/LC_Recycle.png")
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
                        sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                            if(eval(`itemRow.${itemName}`) >= sellAmount){
                                //RECYCLE HERE
                                if(chance >= .5){
                                    methods.hasenoughspace(sql, message.author.id, itemPrice).then(hasenough => {
                                        if(!hasenough){
                                            return message.reply("**You don't have enough space in your inventory!** You can clear up space by selling some items.");
                                        }
                                        message.reply("`" + itemName + "` recycled for ```" + (itemPrice) + " module\nAND\n1 "+rand+"```");
                                        sql.run(`UPDATE items SET ${itemName} = ${eval(`itemRow.${itemName}`) - 1} WHERE userId = ${message.author.id}`);
                                        sql.run(`UPDATE items SET module = ${itemRow.module + itemPrice} WHERE userId = ${message.author.id}`);
                                        sql.run(`UPDATE items SET ${rand} = ${eval(`itemRow.${rand}`) + 1} WHERE userId = ${message.author.id}`);
                                    });
                                }
                                else{
                                    methods.hasenoughspace(sql, message.author.id, itemPrice - 1).then(hasenough => {
                                        if(!hasenough){
                                            return message.reply("**You don't have enough space in your inventory!** You can clear up space by selling some items.");
                                        }
                                        message.reply("`" + itemName + "` recycled for ```" + (itemPrice) + " module```");
                                        sql.run(`UPDATE items SET ${itemName} = ${eval(`itemRow.${itemName}`) - 1} WHERE userId = ${message.author.id}`);
                                        sql.run(`UPDATE items SET module = ${itemRow.module + itemPrice} WHERE userId = ${message.author.id}`);
                                    });
                                }
                                //sql.run(`UPDATE scores SET money = ${row.money + parseInt(itemPrice * sellAmount)} WHERE userId = ${message.author.id}`);
                                //sql.run(`UPDATE items SET ${itemName} = ${eval(`itemRow.${itemName}`) - (1 * sellAmount)} WHERE userId = ${message.author.id}`);
                            }
                            else{
                                message.reply("You don't have that item!");
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
            message.reply("Only `Legendary`+ items are eligible for recycling.");
        }
    });
    }
    item(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
            let args = message.content.split(" ").slice(1);
            let itemSearched = args[0];            
            if(itemSearched !== undefined){
                let itemDamage = "";
                let itemBuyPrice = "";
                let itemSellPrice = "";
                let itemName = "N/A";
                let itemAmmo = "No ammo required.";
                let itemRarity = "";
                let itemInfo = "";
                let itemImg = "";
                
                //itemImg = methods.getCorrectedItemInfo(itemSearched, true);
                itemImg = itemImgJSON[methods.getCorrectedItemInfo(itemSearched, false, false)];
                itemSearched = methods.getCorrectedItemInfo(itemSearched);

                itemName = eval(`item${itemSearched.toUpperCase()}[0]`) //HANDLES ALL ITEMS
    
                if(eval(`item${itemSearched.toUpperCase()}[2]`) !== ""){
                    itemDamage = `${eval(`item${itemSearched.toUpperCase()}[1]`)}-${eval(`item${itemSearched.toUpperCase()}[2]`)}`;
                }
                else{
                    itemDamage = eval(`item${itemSearched.toUpperCase()}[1]`);
                }
                itemAmmo = eval(`item${itemSearched.toUpperCase()}[3]`);
                itemBuyPrice = eval(`item${itemSearched.toUpperCase()}[4]`);
                itemSellPrice = eval(`item${itemSearched.toUpperCase()}[5]`);
                itemInfo = eval(`item${itemSearched.toUpperCase()}[6]`);
                itemRarity = eval(`item${itemSearched.toUpperCase()}[7]`);
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
                .setDescription(`🏷**${itemName} Info**`)
                .setColor(itemRarityColor)
                .setThumbnail(itemImg)
                .addField("***Rarity***", itemRarity)
                if(itemDamage !== "" && itemDamage !== "N/A"){
                    embedItem.addField("💥Damage", itemDamage)
                }
                if(itemAmmo !== "" && itemAmmo !== "N/A"){
                    embedItem.addField("🔻Ammo Required🔻", itemAmmo)
                }
                if(itemBuyPrice == ""){
                    embedItem.addField("Cost", "📤 Sell : $" + itemSellPrice)
                }
                else if(itemBuyPrice <= 50){
                    embedItem.addField("Cost", "📥 Buy : " + itemBuyPrice + " `tokens` | 📤 Sell : $" + itemSellPrice)
                }
                else{
                    embedItem.addField("Cost", "📥 Buy : $" + itemBuyPrice + " | 📤 Sell : $" + itemSellPrice)
                }
                if(itemRarity == "Legendary" && eval(`item${itemSearched.toUpperCase()}[8]`) !== undefined){
                    let itemComponents = eval(`item${itemSearched.toUpperCase()}[8]`);
                    let newList = itemComponents.join(' or ');
                    embedItem.addField("Recycles into", "```1-3 module\n0-1 " + newList+"```")
                }
                else if(itemRarity == "Ultra" && eval(`item${itemSearched.toUpperCase()}[8]`) !== undefined){
                    let itemComponents = eval(`item${itemSearched.toUpperCase()}[8]`);
                    let newList = itemComponents.join(' or ');
                    embedItem.addField("Recycles into", "```2-4 module\n1 " + newList+"```")
                    embedItem.addField("Items required to craft", "```"+ eval(`item${itemSearched.toUpperCase()}[9]`) +"```")
                }
                else if(eval(`item${itemSearched.toUpperCase()}[9]`) !== undefined){
                    embedItem.addField("Items required to craft", "```"+ eval(`item${itemSearched.toUpperCase()}[9]`) +"```")
                }
                embedItem.addField("Info", itemInfo)
                message.channel.send(embedItem);
            }
            else{
                //message.reply("You need to input an item. `"+prefix+"item <item>`");
                let fullCommonList = "`"+commonItems.sort().join('`\n`') + "`\n**Ammo:**\n`" + commonAmmo.sort().join('`\n`')+"`";
                let uncommonSub = uncommonItems.concat(uncommonComp);
                let fullUncommonList = "`"+uncommonSub.sort().join('`\n`') + "`\n**Ammo:**\n`" + uncommonAmmo.sort().join('`\n`')+"`";
                let rareSub = rareItems.concat(rareComp);
                let fullRareList = "`"+rareSub.sort().join('`\n`') + "`\n**Ammo:**\n`" + rareAmmo.sort().join('`\n`')+"`";
                let epicSub = epicItems.concat(epicComp);
                let fullEpicList = "`"+epicSub.sort().join('`\n`') + "`\n**Ammo:**\n`" + epicAmmo.sort().join('`\n`')+"`";
                let legendSub = legendItems.concat(legendComp);
                let fullLegendList = "`"+legendSub.sort().join('`\n`') + "`\n**Ammo:**\n`" + legendAmmo.sort().join('`\n`')+"`";
                let fullUltraList = "`"+ultraItems.sort().join('`\n`') + "`";
                console.log(fullCommonList);
                const embedInfo = new Discord.RichEmbed()
                .setColor(0)
                .setTitle("Full Items List")
                .setURL("https://lootcord.com/items")
                .addField("<:UnboxCommon:526248905676029968>Common",fullCommonList, true)
                .addField("<:UnboxUncommon:526248928891371520>Uncommon",fullUncommonList, true)
                .addField("<:UnboxRare:526248948579434496>Rare",fullRareList, true)
                .addField("<:UnboxEpic:526248961892155402>Epic",fullEpicList, true)
                .addField("<:UnboxLegendary:526248970914234368>Legendary",fullLegendList, true)
                .addField("<:UnboxUltra:526248982691840003>Ultra",fullUltraList, true)
                .setFooter("Use "+prefix+"item <item> to retrieve more information!")
                return message.channel.send(embedInfo);
            }
        }).catch(() => {
            message.reply("That item isn't in my database! Use `"+prefix+"items` to see a full list!");
            return;
        });
    }
    buy(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");  //makes sure they have account
                let args = message.content.split(" ").slice(1);
                let buyItem = args[0];   
                let buyAmount = args[1];
                if(buyItem !== undefined){
                    buyItem = buyItem.toLowerCase();
                    let itemName = "";

                    //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
                    if(buyItem == "rpg"){
                    }
                    else if(buyItem == "item_box" || buyItem == "box"){
                        buyItem = "BOX";
                    }
                    else if(buyItem == "ammo_box" || buyItem == "ammo"){
                        buyItem = "AMMOBOX";
                    }
                    else if(buyItem == "ultra" || buyItem == "ultrabox"){
                        buyItem = "ULTRA_BOX";
                    }
                    else if(buyItem == "rail" || buyItem == "cannon"){
                        buyItem = "RAIL_CANNON";
                    }
                    else if(buyItem == "ray" || buyItem == "raygun"){
                        buyItem = "RAY_GUN";
                    }
                    else if(buyItem.startsWith("fiber")){
                        buyItem = "FIBER_OPTICS";
                    }
                    else if(buyItem.startsWith("golf")){
                        buyItem = "GOLF_CLUB";
                    }
                    else if(buyItem.startsWith("ultra_a")){
                        buyItem = "ULTRA_AMMO";
                    }
                    else if(buyItem == "iron" || buyItem == "shield"){
                        buyItem = "IRON_SHIELD";
                    }
                    else if(buyItem == "gold" || buyItem == "goldshield"){
                        buyItem = "GOLD_SHIELD";
                    }
                    else if(buyItem == "bmg" || buyItem == "50cal"){
                        buyItem = "BMG_50CAL";
                    }
                    else if(buyItem == "rifle_bullet"){
                        buyItem = "RIFLEBULLET";
                    }
                    else if(buyItem == "pistol_bullet"){
                        buyItem = "PISTOLBULLET";
                    }
                    else if(buyItem == "health_pot" || buyItem == "health"){
                        buyItem = "HEALTH";
                    }
                    else if(buyItem == "peck" || buyItem == "peckseed"){
                        buyItem = "PECK_SEED";
                    }
                    else if(buyItem == "candy" || buyItem == "cane"){
                        buyItem = "CANDYCANE";
                    }
                    else if(buyItem == "mitten"){
                        buyItem = "MITTENS";
                    }
                    else if(buyItem == "ginger" || buyItem == "bread"){
                        buyItem = "GINGERBREAD";
                    }
                    else if(buyItem == "startingthegame" || buyItem == "immortal"){
                    }
                    else if(!completeItemsCheck.includes(buyItem)){
                        message.reply("You need to enter a valid item to buy! `"+prefix+"buy <item> <amount>`");
                        return;
                    }
                    let itemPrice = "";
                    if(buyItem == "startingthegame" || buyItem == "immortal"){
                        let dbName = "";
                        let itemType = "";
                        let itemTypeRow = "";
                        let buyPhrase = "";
                        buyAmount = 1;
                        if(buyItem =="immortal"){
                            itemName = "Immortal Redneck (Steam)";
                            itemPrice = 10;
                            dbName = "immortal";
                            itemTypeRow = "itemRow.token";
                            itemType = "token";
                            buyPhrase = "Purchase  `" + itemName + "` for " + (itemPrice) + " tokens?";
                        }
                        else if(buyItem =="startingthegame"){
                            itemName = "Starting The Game (Steam)";
                            itemPrice = 2000;
                            dbName = "startingthegame";
                            itemTypeRow = "row.money";
                            itemType = "money";
                            buyPhrase = "Purchase  `" + itemName + "` for $" + (itemPrice) + "?";
                        }
                        message.delete();
                        message.reply(buyPhrase).then(botMessage => {
                            botMessage.react('✅').then(() => botMessage.react('❌'));
                            const filter = (reaction, user) => {
                                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                            };
                            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                            .then(collected => {
                                const reaction = collected.first();

                                if(reaction.emoji.name === '✅'){
                                    botMessage.delete();
                                    sql.get(`SELECT * FROM gameCodes WHERE rowId = 0`).then(gameRow => {
                                    sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
                                    sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                                        let forSale = eval(`gameRow.${dbName}`);
                                        if(forSale <= 0){
                                            message.reply("Sorry, that game is sold out!");
                                        }
                                        else if(eval(itemTypeRow) >= itemPrice){ //edit
                                            if(itemType == "token"){
                                                sql.run(`UPDATE items SET ${itemType} = ${eval(itemTypeRow) - (itemPrice)} WHERE userId = ${message.author.id}`);
                                            }
                                            else if(itemType == "money"){
                                                sql.run(`UPDATE scores SET ${itemType} = ${eval(itemTypeRow) - (itemPrice)} WHERE userId = ${message.author.id}`);
                                            }
                                            sql.run(`UPDATE gameCodes SET ${dbName} = ${eval(`gameRow.${dbName}`) - 1} WHERE rowId = 0`);
                                            message.reply("You bought `" + itemName + "`!");
    
                                            const embedInfo = new Discord.RichEmbed()
                                            .setTitle(`🎁**We will PM you your game code soon!**`)
                                            .setAuthor(message.author.tag, message.author.avatarURL)
                                            .setColor(0)
                                            .addBlankField()
                                            .addField("Website", "https://lootcord.com",true)
                                            message.author.send(embedInfo);
                                            const embedLog = new Discord.RichEmbed()
                                            embedLog.setTitle("🎁GAME CODE BOUGHT BY\n"+message.author.username+ " ID : " + message.author.id)
                                            embedLog.setDescription("Game : `" + itemName + "`");
                                            embedLog.setColor(9043800);
                                            client.guilds.get("454163538055790604").channels.get("496740775212875816").send("<@168958344361541633>"); //change channel
                                            client.guilds.get("454163538055790604").channels.get("496740775212875816").send(embedLog);
                                        }
                                        else{
                                            message.reply("You don't have enough to purchase that item!");
                                        }
                                    });
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
                        itemPrice = eval(`item${buyItem.toUpperCase()}[4]`);
                        if(itemPrice == ""){
                            message.reply("That item is not for sale!");
                        }
                        else if(itemPrice <= 50){
                            if(buyAmount == undefined){
                                buyAmount = 1;
                            }
                            else if(!Number.isInteger(parseInt(buyAmount))){
                                buyAmount = 1;
                            }
                            else if(buyAmount % 1 !== 0){
                                buyAmount = 1;
                            }
                            else if(buyAmount < 1){
                                buyAmount = 1;
                            }
                            itemName = eval(`item${buyItem.toUpperCase()}[0]`);
                            message.delete();
                            message.reply("Purchase "+ buyAmount+ "x `" + itemName + "` for " + (itemPrice * buyAmount) + " tokens?").then(botMessage => {
                                botMessage.react('✅').then(() => botMessage.react('❌'));
                                const filter = (reaction, user) => {
                                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                                };
                                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                                .then(collected => {
                                    const reaction = collected.first();

                                    if(reaction.emoji.name === '✅'){
                                        botMessage.delete();
                                        sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                                            if(itemRow.token >= (eval(`item${buyItem.toUpperCase()}[4]`) * buyAmount)){ //edit
                                                sql.run(`UPDATE items SET token = ${itemRow.token - (itemPrice * buyAmount)} WHERE userId = ${message.author.id}`);
                                                sql.run(`UPDATE items SET ${itemName} = ${eval(`itemRow.${itemName}`) + (1 * buyAmount)} WHERE userId = ${message.author.id}`);
                                                message.reply("You bought " + buyAmount + "x " + itemName + "!");
                                            }
                                            else{
                                                message.reply("You don't have enough tokens!");
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
                        else{                                                         //CODE FOR BUYING ITEM
                            if(buyAmount == undefined){
                                buyAmount = 1;
                            }
                            else if(!Number.isInteger(parseInt(buyAmount))){
                                buyAmount = 1;
                            }
                            else if(buyAmount % 1 !== 0){
                                buyAmount = 1;
                            }
                            else if(buyAmount < 1){
                                buyAmount = 1;
                            }
                            itemName = eval(`item${buyItem.toUpperCase()}[0]`);
                            message.delete();
                            message.reply("Purchase "+ buyAmount+ "x `" + itemName + "` for $" + (itemPrice * buyAmount) + "?").then(botMessage => {
                                botMessage.react('✅').then(() => botMessage.react('❌'));
                                const filter = (reaction, user) => {
                                    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                                };
                                botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                                .then(collected => {
                                    const reaction = collected.first();

                                    if(reaction.emoji.name === '✅'){
                                        botMessage.delete();
                                        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
                                        sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                                            methods.hasenoughspace(sql, message.author.id, parseInt(buyAmount)).then(result => {
                                                if(row.money >= (eval(`item${buyItem.toUpperCase()}[4]`) * buyAmount)){
                                                    if(!result) return message.reply("**You don't have enough space in your inventory!** You can clear up space by selling some items.");
                                                    sql.run(`UPDATE scores SET money = ${row.money - (itemPrice * buyAmount)} WHERE userId = ${message.author.id}`);
                                                    sql.run(`UPDATE items SET ${itemName} = ${eval(`itemRow.${itemName}`) + (1 * buyAmount)} WHERE userId = ${message.author.id}`);
                                                    message.reply("You bought " + buyAmount + "x " + itemName + "!");
                                                }
                                                else{
                                                    message.reply("You don't have enough money!");
                                                }
                                            });
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
                    }
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
                if(sellItem !== undefined){
                    sellItem = sellItem.toLowerCase();
                    let itemType = "";
                    let commonTotal = 0;
                    let totalAmount = 0;
                    //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
                    if(sellItem.startsWith("common")){
                        itemType = "Common";
                        for (var i = 0; i < completeItemsCheck.length; i++) { //iterates through each item and checks if player has it
                            if(eval(`itemRow.${completeItemsCheck[i]}`)){ //checks if player has item
                                let itemName = completeItemsCheck[i];

                                if(itemName == "health_pot"){
                                    itemName = "HEALTH";
                                }
                                else if(itemName == "pistol_bullet"){
                                    itemName = "PISTOLBULLET";
                                }
                                else if(itemName == "rifle_bullet"){
                                    itemName = "RIFLEBULLET";
                                }
                                else if(itemName == "item_box"){
                                    itemName = "BOX";
                                }
                                else if(itemName == "ammo_box"){
                                    itemName = "AMMOBOX";
                                }
                                if(eval(`item${itemName.toUpperCase()}[7]`) == "Common"){
                                    totalAmount += eval(`itemRow.${completeItemsCheck[i]}`);
                                    commonTotal += (eval(`itemRow.${completeItemsCheck[i]}`) * eval(`item${itemName.toUpperCase()}[5]`));
                                }
                            }
                        }
                    }
                    else if(sellItem.startsWith("uncommon")){
                        itemType = "Uncommon";
                        for (var i = 0; i < completeItemsCheck.length; i++) { //iterates through each item and checks if player has it
                            if(eval(`itemRow.${completeItemsCheck[i]}`)){ //checks if player has item
                                let itemName = completeItemsCheck[i];

                                if(itemName == "health_pot"){
                                    itemName = "HEALTH";
                                }
                                else if(itemName == "pistol_bullet"){
                                    itemName = "PISTOLBULLET";
                                }
                                else if(itemName == "rifle_bullet"){
                                    itemName = "RIFLEBULLET";
                                }
                                else if(itemName == "item_box"){
                                    itemName = "BOX";
                                }
                                else if(itemName == "ammo_box"){
                                    itemName = "AMMOBOX";
                                }
                                if(eval(`item${itemName.toUpperCase()}[7]`) == "Uncommon"){
                                    totalAmount += eval(`itemRow.${completeItemsCheck[i]}`);
                                    commonTotal += (eval(`itemRow.${completeItemsCheck[i]}`) * eval(`item${itemName.toUpperCase()}[5]`));
                                }
                            }
                        }
                    }
                    else if(sellItem.startsWith("rare")){
                        itemType = "Rare";
                        for (var i = 0; i < completeItemsCheck.length; i++) { //iterates through each item and checks if player has it
                            if(eval(`itemRow.${completeItemsCheck[i]}`)){ //checks if player has item
                                let itemName = completeItemsCheck[i];

                                if(itemName == "health_pot"){
                                    itemName = "HEALTH";
                                }
                                else if(itemName == "pistol_bullet"){
                                    itemName = "PISTOLBULLET";
                                }
                                else if(itemName == "rifle_bullet"){
                                    itemName = "RIFLEBULLET";
                                }
                                else if(itemName == "item_box"){
                                    itemName = "BOX";
                                }
                                else if(itemName == "ammo_box"){
                                    itemName = "AMMOBOX";
                                }
                                if(eval(`item${itemName.toUpperCase()}[7]`) == "Rare"){
                                    totalAmount += eval(`itemRow.${completeItemsCheck[i]}`);
                                    commonTotal += (eval(`itemRow.${completeItemsCheck[i]}`) * eval(`item${itemName.toUpperCase()}[5]`));
                                }
                            }
                        }
                    }
                    else if(sellItem.startsWith("epic")){
                        itemType = "Epic";
                        for (var i = 0; i < completeItemsCheck.length; i++) { //iterates through each item and checks if player has it
                            if(eval(`itemRow.${completeItemsCheck[i]}`)){ //checks if player has item
                                let itemName = completeItemsCheck[i];

                                if(itemName == "health_pot"){
                                    itemName = "HEALTH";
                                }
                                else if(itemName == "pistol_bullet"){
                                    itemName = "PISTOLBULLET";
                                }
                                else if(itemName == "rifle_bullet"){
                                    itemName = "RIFLEBULLET";
                                }
                                else if(itemName == "item_box"){
                                    itemName = "BOX";
                                }
                                else if(itemName == "ammo_box"){
                                    itemName = "AMMOBOX";
                                }
                                if(eval(`item${itemName.toUpperCase()}[7]`) == "Epic"){
                                    totalAmount += eval(`itemRow.${completeItemsCheck[i]}`);
                                    commonTotal += (eval(`itemRow.${completeItemsCheck[i]}`) * eval(`item${itemName.toUpperCase()}[5]`));
                                }
                            }
                        }
                    }
                    else if(sellItem.startsWith("legendary")){
                        itemType = "Legendary";
                        for (var i = 0; i < completeItemsCheck.length; i++) { //iterates through each item and checks if player has it
                            if(eval(`itemRow.${completeItemsCheck[i]}`)){ //checks if player has item
                                let itemName = completeItemsCheck[i];

                                if(itemName == "health_pot"){
                                    itemName = "HEALTH";
                                }
                                else if(itemName == "pistol_bullet"){
                                    itemName = "PISTOLBULLET";
                                }
                                else if(itemName == "rifle_bullet"){
                                    itemName = "RIFLEBULLET";
                                }
                                else if(itemName == "item_box"){
                                    itemName = "BOX";
                                }
                                else if(itemName == "ammo_box"){
                                    itemName = "AMMOBOX";
                                }
                                if(eval(`item${itemName.toUpperCase()}[7]`) == "Legendary"){
                                    totalAmount += eval(`itemRow.${completeItemsCheck[i]}`);
                                    commonTotal += (eval(`itemRow.${completeItemsCheck[i]}`) * eval(`item${itemName.toUpperCase()}[5]`));
                                }
                            }
                        }
                    }
                    else if(sellItem.startsWith("ultra")){
                        itemType = "Ultra";
                        for (var i = 0; i < completeItemsCheck.length; i++) { //iterates through each item and checks if player has it
                            if(eval(`itemRow.${completeItemsCheck[i]}`)){ //checks if player has item
                                let itemName = completeItemsCheck[i];

                                if(itemName == "health_pot"){
                                    itemName = "HEALTH";
                                }
                                else if(itemName == "pistol_bullet"){
                                    itemName = "PISTOLBULLET";
                                }
                                else if(itemName == "rifle_bullet"){
                                    itemName = "RIFLEBULLET";
                                }
                                else if(itemName == "item_box"){
                                    itemName = "BOX";
                                }
                                else if(itemName == "ammo_box"){
                                    itemName = "AMMOBOX";
                                }
                                if(eval(`item${itemName.toUpperCase()}[7]`) == "Ultra"){
                                    totalAmount += eval(`itemRow.${completeItemsCheck[i]}`);
                                    commonTotal += (eval(`itemRow.${completeItemsCheck[i]}`) * eval(`item${itemName.toUpperCase()}[5]`));
                                }
                            }
                        }
                    }
                    else {
                        message.reply("You need to enter a valid type to sell! `"+prefix+"sellall <rarity>`");
                        return;
                    }
                    if(commonTotal == 0){
                        message.reply("You don't have any `" + itemType + "` items!");
                        return;
                    }
                    message.delete();
                    message.reply("Sell " + totalAmount + "x `" + itemType +"` items for $" + (commonTotal) + "?").then(botMessage => {
                        botMessage.react('✅').then(() => botMessage.react('❌'));
                        const filter = (reaction, user) => {
                            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                        };
                        botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                        .then(collected => {
                            const reaction = collected.first();

                            if(reaction.emoji.name === '✅'){
                                botMessage.delete();
                                /*
                                commonTotal = 0;
                                sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
                                sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(itemRow => {
                                    for (i = 0; i < completeItemsCheck.length; i++) { //iterates through each item and checks if player has it
                                        if(eval(`itemRow.${completeItemsCheck[i]}`)){ //checks if player has item
                                            let itemName = completeItemsCheck[i];
            
                                            if(itemName == "health_pot"){
                                                itemName = "HEALTH";
                                            }
                                            else if(itemName == "pistol_bullet"){
                                                itemName = "PISTOLBULLET";
                                            }
                                            else if(itemName == "rifle_bullet"){
                                                itemName = "RIFLEBULLET";
                                            }
                                            else if(itemName == "item_box"){
                                                itemName = "BOX";
                                            }
                                            else if(itemName == "ammo_box"){
                                                itemName = "AMMOBOX";
                                            }
                                            if(eval(`item${itemName.toUpperCase()}[7]`) == itemType){
                                                commonTotal += (eval(`itemRow.${completeItemsCheck[i]}`) * eval(`item${itemName.toUpperCase()}[5]`));
                                            }
                                        }
                                    }
                                    sql.run(`UPDATE scores SET money = ${row.money + parseInt(commonTotal)} WHERE userId = ${message.author.id}`);
                                    
                                    for (i = 0; i < completeItemsCheck.length; i++) { //iterates through each item and checks if player has it
                                        if(eval(`itemRow.${completeItemsCheck[i]}`)){
                                            let itemName = completeItemsCheck[i];
                                            if(itemName == "health_pot"){
                                                itemName = "HEALTH";
                                            }
                                            else if(itemName == "pistol_bullet"){
                                                itemName = "PISTOLBULLET";
                                            }
                                            else if(itemName == "rifle_bullet"){
                                                itemName = "RIFLEBULLET";
                                            }
                                            else if(itemName == "item_box"){
                                                itemName = "BOX";
                                            }
                                            else if(itemName == "ammo_box"){
                                                itemName = "AMMOBOX";
                                            }
                                            if(eval(`item${itemName.toUpperCase()}[7]`) == itemType){
                                                sql.run(`UPDATE items SET ${completeItemsCheck[i]} = ${0} WHERE userId = ${message.author.id}`);
                                            }
                                        }
                                    }
                                    message.reply(`Successfully sold all ${itemType} items.`);
                                });
                                });
                                */
                                sql.run(`UPDATE scores SET money = ${row.money + parseInt(commonTotal)} WHERE userId = ${message.author.id}`);
                                    
                                for (var i = 0; i < completeItemsCheck.length; i++) { //iterates through each item and checks if player has it
                                    if(eval(`itemRow.${completeItemsCheck[i]}`)){
                                        let itemName = completeItemsCheck[i];
                                        if(itemName == "health_pot"){
                                            itemName = "HEALTH";
                                        }
                                        else if(itemName == "pistol_bullet"){
                                            itemName = "PISTOLBULLET";
                                        }
                                        else if(itemName == "rifle_bullet"){
                                            itemName = "RIFLEBULLET";
                                        }
                                        else if(itemName == "item_box"){
                                            itemName = "BOX";
                                        }
                                        else if(itemName == "ammo_box"){
                                            itemName = "AMMOBOX";
                                        }
                                        if(eval(`item${itemName.toUpperCase()}[7]`) == itemType){
                                            sql.run(`UPDATE items SET ${completeItemsCheck[i]} = ${0} WHERE userId = ${message.author.id}`);
                                        }
                                    }
                                }
                                message.reply(`Successfully sold all ${itemType} items.`);
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
                    message.reply("You need to enter a valid type to sell! `"+prefix+"sellall <rarity>`");
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
                let sellAmount = args[1];
                if(sellItem !== undefined){
                    sellItem = sellItem.toLowerCase();
                    //THESE WILL BE USED FOR SPECIFIC FIXES (SUCH AS CHANGING NAME TO FIT ITEM ARRAYS)
                    if(sellItem == "rpg"){
                    }
                    else if(sellItem == "item_box" || sellItem == "box"){
                        sellItem = "BOX";
                    }
                    else if(sellItem == "ammo_box" || sellItem == "ammo"){
                        sellItem = "AMMOBOX";
                    }
                    else if(sellItem == "ultra" || sellItem == "ultrabox"){
                        sellItem = "ULTRA_BOX";
                    }
                    else if(sellItem == "rail" || sellItem == "cannon"){
                        sellItem = "RAIL_CANNON";
                    }
                    else if(sellItem == "ray" || sellItem == "raygun"){
                        sellItem = "RAY_GUN";
                    }
                    else if(sellItem.startsWith("fiber")){
                        sellItem = "FIBER_OPTICS";
                    }
                    else if(sellItem.startsWith("golf")){
                        sellItem = "GOLF_CLUB";
                    }
                    else if(sellItem.startsWith("ultra_a")){
                        sellItem = "ULTRA_AMMO";
                    }
                    else if(sellItem == "bmg" || sellItem == "50cal"){
                        sellItem = "BMG_50CAL";
                    }
                    else if(sellItem == "iron" || sellItem == "shield"){
                        sellItem = "IRON_SHIELD";
                    }
                    else if(sellItem == "gold" || sellItem == "goldshield"){
                        sellItem = "GOLD_SHIELD";
                    }
                    else if(sellItem == "rifle_bullet"){
                        sellItem = "RIFLEBULLET";
                    }
                    else if(sellItem == "pistol_bullet"){
                        sellItem = "PISTOLBULLET";
                    }
                    else if(sellItem == "health_pot" || sellItem == "health"){
                        sellItem = "HEALTH";
                    }
                    else if(sellItem == "peck" || sellItem == "peckseed"){
                        sellItem = "PECK_SEED";
                    }
                    else if(sellItem.startsWith("common") || sellItem.startsWith("uncommon") || sellItem.startsWith("rare") || sellItem.startsWith("epic") || sellItem.startsWith("legendary")){
                        message.reply("Use the `"+prefix+"sellall` command.");
                        return;
                    }
                    else if(!completeItemsCheck.includes(sellItem)){
                        return message.reply("You need to enter a valid item to sell! `"+prefix+"sell <item> <amount>`");
                    }
                    
                    let itemPrice = eval(`item${sellItem.toUpperCase()}[5]`);
                    
                    if(!itemPrice == ""){                                                         //CODE FOR BUYING ITEM | INDIVIDUALLY
                        if(sellAmount == undefined){
                            sellAmount = 1;
                        }
                        else if(!Number.isInteger(parseInt(sellAmount))){
                            sellAmount = 1;
                        }
                        else if(sellAmount % 1 !== 0){
                            sellAmount = 1;
                        }
                        else if(sellAmount < 1){
                            sellAmount = 1;
                        }
                        let itemName = eval(`item${sellItem.toUpperCase()}[0]`);
                        message.delete();
                        message.reply("Sell " + sellAmount + "x `" + itemName + "` for $" + (itemPrice * sellAmount) + "?").then(botMessage => {
                            botMessage.react('✅').then(() => botMessage.react('❌'));
                            const filter = (reaction, user) => {
                                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
                            };
                            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] })
                            .then(collected => {
                                const reaction = collected.first();

                                if(reaction.emoji.name === '✅'){
                                    botMessage.delete();
                                    sql.get(`SELECT * FROM items i
                                    JOIN scores s
                                    ON i.userId = s.userId
                                    WHERE s.userId="${message.author.id}"`).then(sellRow => {
                                        if(eval(`sellRow.${itemName}`) >= sellAmount){ //use hasitem method
                                            //use method to remove item
                                            sql.run(`UPDATE scores SET money = ${sellRow.money + parseInt(itemPrice * sellAmount)} WHERE userId = ${message.author.id}`);
                                            sql.run(`UPDATE items SET ${itemName} = ${eval(`sellRow.${itemName}`) - (1 * sellAmount)} WHERE userId = ${message.author.id}`);
                                            message.reply("Successfully sold " + sellAmount + "x " + itemName + " for " + (itemPrice * sellAmount) + ".");
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
                else{
                    message.reply("You need to enter a valid item to sell! `"+prefix+"sell <item> <amount>`");
                }
            });
        });
    }
    shop(message, sql, prefix){
        sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            sql.get(`SELECT * FROM gameCodes`).then(gameRow => {
            var shopItem = [[`item_box`, `📥 $${itemBOX[4]} | `, `📤 $${itemBOX[5]}`],[`rock`, ``, `📤 $${itemROCK[5]}`],[`arrow`, ``, `📤 $${itemARROW[5]}`],[`fork`, ``, `📤 $${itemFORK[5]}`],[`club`, ``, `📤 $${itemCLUB[5]}`],
            [`baseball`, ``, `📤 $${itemBASEBALL[5]}`],[`fish`, ``, `📤 $${itemFISH[5]}`],[`sword`, ``, `📤 $${itemSWORD[5]}`],[`bow`, ``, `📤 $${itemBOW[5]}`],[`ammo_box`, `📥 $${itemAMMOBOX[4]} | `, `📤 $${itemAMMOBOX[5]}`],
            [`pistol_bullet`, ``, `📤 $${itemPISTOLBULLET[5]}`],[`bat`, ``, `📤 $${itemBAT[5]}`],[`pills`, `📥 $${itemPILLS[4]} | `, `📤 $${itemPILLS[5]}`],[`spear`, ``, `📤 $${itemSPEAR[5]}`],[`health_pot`, `📥 $${itemHEALTH[4]} | `, `📤 $${itemHEALTH[5]}`],
            [`crossbow`, ``, `📤 $${itemCROSSBOW[5]}`],[`glock`, ``, `📤 $${itemGLOCK[5]}`],[`rifle_bullet`, ``, `📤 $${itemRIFLEBULLET[5]}`],[`blunderbuss`, ``, `📤 $${itemBLUNDERBUSS[5]}`],
            [`buckshot`, ``, `📤 $${itemBUCKSHOT[5]}`],[`revolver`, ``, `📤 $${itemREVOLVER[5]}`],[`grenade`, ``, `📤 $${itemGRENADE[5]}`],[`ak47`, ``, `📤 $${itemAK47[5]}`],
            [`thompson`, ``, `📤 $${itemTHOMPSON[5]}`],[`rocket`, ``, `📤 $${itemROCKET[5]}`],[`spas`, ``, `📤 $${itemSPAS[5]}`],[`medkit`, `📥 $${itemMEDKIT[4]} | `, `📤 $${itemMEDKIT[5]}`],
            [`m4a1`, ``, `📤 $${itemM4A1[5]}`],[`ultra_box`, `📥 $${itemULTRA_BOX[4]} | `, `📤 $${itemULTRA_BOX[5]}`],[`iron_shield`, `📥 $${itemIRON_SHIELD[4]} | `, `📤 $${itemIRON_SHIELD[5]}`],[`peck_seed`, ``, `📤 $${itemPECK_SEED[5]}`],
            [`rpg`, ``, `📤 $${itemRPG[5]}`],[`javelin`, ``, `📤 $${itemJAVELIN[5]}`],[`awp`, ``, `📤 $${itemAWP[5]}`],[`gold_shield`, `📥 $${itemGOLD_SHIELD[4]} | `, `📤 $${itemGOLD_SHIELD[5]}`],[`plasma`, ``, `📤 $${itemPLASMA[5]}`],
            [`bmg_50cal`, ``, `📤 $${itemBMG_50CAL[5]}`],[`rail_cannon<:UnboxUltra:526248982691840003>`, ``, `📤 $${itemRAIL_CANNON[5]}`],[`token`, ``, `📤 $${itemTOKEN[5]}`],[`module`, ``, `📤 $${itemMODULE[5]}`],[`screw`, ``, `📤 $${itemSCREW[5]}`],[`steel`, ``, `📤 $${itemSTEEL[5]}`],
            [`fiber_optics`, ``, `📤 $${itemFIBER_OPTICS[5]}`],[`adhesive`, ``, `📤 $${itemADHESIVE[5]}`],[`ray_gun<:UnboxUltra:526248982691840003>`, ``, `📤 $${itemRAY_GUN[5]}`],[`golf_club`, ``, `📤 $${itemGOLF_CLUB[5]}`],[`ultra_ammo`, ``, `📤 $${itemULTRA_AMMO[5]}`],
            [`stick`, ``, `📤 $${itemSTICK[5]}`],[`reroll_scroll`, ``, `📤 $${itemREROLL_SCROLL[5]}`],[`xp_potion`, ``, `📤 $${itemXP_POTION[5]}`]];
            shopItem.sort(); //sort items alphabetically
            /* LIMITED ITEMS no longer for sale
            [`candycane`, `📥 ${itemCANDYCANE[4]} tokens | `, `📤 $${itemCANDYCANE[5]}`],
            [`gingerbread`, `📥 ${itemGINGERBREAD[4]} tokens | `, `📤 $${itemGINGERBREAD[5]}`],[`mittens`, `📥 ${itemMITTENS[4]} tokens | `, `📤 $${itemMITTENS[5]}`],[`stocking`, `📥 ${itemSTOCKING[4]} tokens | `, `📤 $${itemSTOCKING[5]}`],[`snowball`, `📥 ${itemSNOWBALL[4]} tokens | `, `📤 $${itemSNOWBALL[5]}`],
            [`nutcracker`, `📥 ${itemNUTCRACKER[4]} tokens | `, `📤 $${itemNUTCRACKER[5]}`]
            */
            let pageNum = 0;
            let itemFilteredItems = [];
            let maxPage = Math.ceil(shopItem.length/8);
            const firstEmbed = new Discord.RichEmbed()
            firstEmbed.setTitle(`**ITEM SHOP**`);
            firstEmbed.setDescription("📥 Buy 📤 Sell\nUse `buy (ITEM)` to purchase and `sell (ITEM)` to sell items.\n\nLimit 1 per person");
            firstEmbed.setThumbnail("https://cdn.discordapp.com/attachments/454163538886524928/497356681139847168/thanbotShopIcon.png");

            firstEmbed.addField("Unfortunately, there are no steam keys for sale at this time.","Check back at a later time.");
            /*
            if(gameRow.startingthegame > 5){
                firstEmbed.addField("Starting The Game (Steam key)", "📥 $2000 | 5+ Remaining | Use `"+prefix+"buy startingthegame`");
            }
            else{
                firstEmbed.addField("Starting The Game (Steam key)", "📥 $2000 | "+gameRow.startingthegame+" Remaining | Use `"+prefix+"buy startingthegame`");
            }
            */
            firstEmbed.setFooter(`Home page`);
            firstEmbed.setColor(0);
    
            message.channel.send(firstEmbed).then(botMessage => {
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
                            collectorMsg.edit(firstEmbed);
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
                                                .addField("🔵"+message.member.displayName + "'s MONEY", "$" + player1money,true)
                                                .addField("🔴"+message.guild.members.get(userNameID).displayName + "'s MONEY", "$" + player2money,true)
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
                                                if(!completeItemsCheck.includes(removeThis)){
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
                                                if(!completeItemsCheck.includes(itemName)){
                                                    response.reply("That item doesn't exist!");
                                                }
                                                else if(itemName == "token"){
                                                    response.reply("You can't trade tokens!");
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
    displayInvSlots(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            methods.getitemcount(sql, message.author.id).then(itemCt => {
                if(row.backpack !== "none"){
                    message.reply("\n**Backpack equipped:** `" + row.backpack + "`\n**Inventory space:** `" + itemCt.capacity + "` (base 10 ***+"+itemInfoJson[row.backpack].inv_slots+"***)\nIncrease space by equipping a better backpack!");
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
                if(itemInfoJson[equipitem] !== undefined && itemInfoJson[equipitem].equippable == "true"){
                    methods.hasitems(sql, message.author.id, equipitem, 1).then(haspack => {
                        if(haspack){
                            if(row.backpack == "none" && itemInfoJson[equipitem].type == "backpack"){
                                sql.run(`UPDATE scores SET backpack = '${equipitem}' WHERE userId = ${message.author.id}`);
                                sql.run(`UPDATE scores SET inv_slots = ${10 + itemInfoJson[equipitem].inv_slots} WHERE userId = ${message.author.id}`);
                                sql.run(`UPDATE items SET ${equipitem} = ${row[equipitem] - 1} WHERE userId = ${message.author.id}`);
                                methods.getitemcount(sql, message.author.id).then(itemCt => {
                                    message.reply("Successfully equipped `" + equipitem + "` and gained **" + itemInfoJson[equipitem].inv_slots + "** item slots. (" + (itemInfoJson[equipitem].inv_slots + 10) + " max)");
                                });
                            }
                            else if(row.armor == "none" && itemInfoJson[equipitem].type == "armor"){
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
    unwrap(message, sql, prefix){ //NOT USED as of 3.0.0
        sql.get(`SELECT * FROM items WHERE userId ="${message.author.id}"`).then(row => {
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(timeRow => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            if(serverReward.has(message.author.id)){
                message.reply("You need to wait  `" + (((voteCdSeconds * 1000 - ((new Date()).getTime() - timeRow.prizeTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours` before unwrapping another present.");
                return;
            }
            setTimeout(() => {
                serverReward.delete(message.author.id);
                sql.run(`UPDATE scores SET prizeTime = ${0} WHERE userId = ${message.author.id}`);
            }, voteCdSeconds * 1000);
            let chance = Math.floor(Math.random() * 201) //1-200
            let rand = "";
            if(chance <= 150){                                   //LIMITED ITEMS % chance
                rand = limitedItems[Math.floor(Math.random() * limitedItems.length)];
                sql.run(`UPDATE items SET ${rand} = ${eval("row." + rand) + 1} WHERE userId = ${message.author.id}`);
            }
            else if(chance <= 185){                               //RARE ITEMS 35% chance
                rand = rareItems[Math.floor(Math.random() * rareItems.length)];
                sql.run(`UPDATE items SET ${rand} = ${eval("row." + rand) + 1} WHERE userId = ${message.author.id}`);
            }
            else{                               //RARE ITEMS 12% chance
                rand = epicItems[Math.floor(Math.random() * epicItems.length)];
                sql.run(`UPDATE items SET ${rand} = ${eval("row." + rand) + 1} WHERE userId = ${message.author.id}`);
            }
            sql.run(`UPDATE items SET token = ${row.token + 1} WHERE userId = ${message.author.id}`);
            message.reply("🎁 You open the gift and receive : \n```" + rand + " and a token!```");
            sql.run(`UPDATE scores SET prizeTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
            serverReward.add(message.author.id);
        });
        });
    }

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
        let otherCmds = ["`rules`","`cooldowns`","`delete`","`deactivate`","`server`","`update`","`health`","`money`","`level`","`points`","`leaderboard [s]`","`setprefix`","`discord`","`profile [@user]`","`upgrade [skill]`","`backpack`"]
        otherCmds.sort();
        const helpInfo = new Discord.RichEmbed()
        .setTitle("`"+prefix+"play`** - Adds you to the game.**")
        .addField("⚔Items", "🔸`"+prefix+"use <item> [@user]`- Attack users with weapons or use items on self.\n🔸`"+prefix+"inv [@user]` - Displays inventory.\n▫`"+prefix+"trade <@user>` - Trade items and money with user.\n▫`"+prefix+"item [item]`" +
        " - Lookup item information.\n▫`"+prefix+"shop` - Shows buy/sell values of all items.\n▫`"+prefix+"buy <item> [amount]` - Purchase an item.\n▫`"+prefix+"sell <item> [amount]` - Sell an item.\n▫`"+prefix+"sellall <rarity>` - Sell every item of specific rarity (ex. `"+prefix+"sellall common`)." +
        "\n▫`"+prefix+"craft <item>` - Craft Ultra items!\n▫`"+prefix+"recycle <item>` - Recycle Legendary+ items for components.\n✨`" +prefix+"equip <item>` - Equip a backpack or armor.")
        .addField("🎲Games/Free stuff", "▫`"+prefix+"scramble <easy/hard>` - Unscramble a random word for a prize!\n▫`"+prefix+"trivia` - Answer the questions right for a reward!\n▫`"+prefix+"hourly` - Claim a free item_box every hour.\n▫`"+prefix+"vote` - Vote for the bot every 12hrs to receive an `ultra_box`\n▫`"+prefix+"gamble <type> <amount>` - Gamble your money away!")
        //.addField("🔰Stats", ,true)
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
    prefix(message, sql, prefix){//USED TO CHANGE SERVER PREFIX
        if(message.member.hasPermission("MANAGE_GUILD")){
            let args = message.content.split(" ").slice(1);
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
        else{
            message.reply("You need the `Manage Server` permission to use this command!")
        }
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
            let hourlyReady = "✅ ready"
            let triviaReady = "✅ ready"
            let scrambleReady = "✅ ready"
            let attackReady = "✅ ready"
            let healReady = "✅ ready"
            let voteReady = "✅ ready"
            let gambleReady = "✅ ready"
            //let giftReady = "✅ ready"
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
                attackReady = ((weapCdSeconds * 1000 - ((new Date()).getTime() - row.attackTime)) / 60000).toFixed(1) + " minutes";
            }
            if(healCooldown.has(message.author.id)){
                healReady = ((healCdSeconds * 1000 - ((new Date()).getTime() - row.healTime)) / 60000).toFixed(1) + " minutes";
            }
            if(voteCooldown.has(message.author.id)){
                voteReady = (((voteCdSeconds * 1000 - ((new Date()).getTime() - row.voteTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours";
            }
            if(gambleCooldown.has(message.author.id)){
                gambleReady = ((gambleCdSeconds * 1000 - ((new Date()).getTime() - row.gambleTime)) / 1000).toFixed(0) + " seconds";
            }
            /*
            if(serverReward.has(message.author.id)){
                giftReady = (((voteCdSeconds * 1000 - ((new Date()).getTime() - row.prizeTime)) / 60000).toFixed(1)/60).toFixed(1) + " hours";
            }
            embedLeader.addField("🎁unwrap", "`" + giftReady + "`")
            */
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
    }
    leaderboard(message, sql, prefix){
        var leaders = [];
        var levelLeaders = [];
        var killLeaders = [];
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
                            leadersMoney.push(`💵**${client.users.get(row.USERID).tag}**` + ' - $' + row.MONEY);
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
                sql.all('SELECT userId,money FROM scores ORDER BY money DESC LIMIT 5').then(rows => {
                    rows.forEach(function (row) {
                        try{
                            leaders.push(`💵**${client.users.get(row.userId).tag}**` + ' - $' + row.money);  
                        }
                        catch(err){
                            leaders.push(`💵Unknown - $` + row.money);  
                        }
                    });
                    leaders[0] = leaders[0].replace("💵", "💰");
                    sql.all('SELECT userId,level FROM scores ORDER BY level DESC LIMIT 5').then(lvlRows => {
                        lvlRows.forEach(function (lvlRow) {
                            try{
                                levelLeaders.push(`🔹**${client.users.get(lvlRow.userId).tag}**` + ' - Level :  ' + lvlRow.level);  
                            }
                            catch(err){
                                levelLeaders.push(`🔹Unknown - Level : ` + lvlRow.level);  
                            }
                        });
                        levelLeaders[0] = levelLeaders[0].replace("🔹","💠");
                        sql.all('SELECT userId,kills FROM scores ORDER BY kills DESC LIMIT 5').then(rows => {
                            rows.forEach(function (row) {
                                try{
                                    killLeaders.push(`🏅**${client.users.get(row.userId).tag}**` + ' - ' + row.kills + " kills");  
                                }
                                catch(err){
                                    killLeaders.push(`🏅Unknown - ` + row.kills + " kills");  
                                }
                            });
                            killLeaders[0] = killLeaders[0].replace("🏅","🏆");
                            const embedLeader = new Discord.RichEmbed() 
                            .setTitle(`**Global Leaderboard**`)
                            .setColor(0)
                            .addField("Money", leaders, true)
                            .addField("Level", levelLeaders, true)
                            .addField("Kills", killLeaders, true)
                            .setFooter("Top 5")
                            message.channel.send(embedLeader);
                        });
                        /*
                        const embedLeader = new Discord.RichEmbed() 
                        .setTitle(`**Global Leaderboard**`)
                        .setColor(13215302)
                        .addField("Money", leaders)
                        .addField("Level", levelLeaders)
                        .setFooter("Top 5")
                        message.channel.send(embedLeader);
                        */
                    });
                });
            }
        });
    }
    money(message, sql, prefix){
        sql.get(`SELECT * FROM scores WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("You don't have an account. Use `" + prefix + "play` to make one!");
            message.reply(`You currently have $${row.money}`);
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
                            const embedInfo = new Discord.RichEmbed()
                            .setTitle("⛔Account deleted⛔\n`"+message.author.tag + " : " + message.author.id + "` **Data**")
                            .setDescription("User inventory code prior to deletion:\n```" + result.invCode + "```")
                            .setTimestamp()
                            .setColor(16636672)
                            client.guilds.get("454163538055790604").channels.get("500467081226223646").send(embedInfo);

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
    
                            deleteCooldown.add(message.author.id);
                            setTimeout(() => {
                                deleteCooldown.delete(message.author.id);
                            }, hourlyCdSeconds * 1000);
                            if(message.content.startsWith(prefix + "suicide")){
                                message.channel.send(`${message.author} ${quotes[chance]}...\nYour account has been deleted.`);
                            }
                            else{
                                message.reply(`Your account has been deleted.`);
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

    //MODERATOR COMMANDS
    //temporary
    showUserVotes(message, moddedUsers, sql){
        if(!moddedUsers.has(message.author.id)){
            return message.reply("Only mods can use this command!");
        }
        else{
            sql.all('SELECT userId, vote FROM userPoll').then(rows => {
                let yesVotes = 0;
                let noVotes = 0;
                rows.forEach(function (row) {
                    if(row.vote == "yes"){
                        yesVotes += 1;
                    }
                    else if(row.vote == "no"){
                        noVotes += 1;
                    }
                });
                const embedLeader = new Discord.RichEmbed() 
                .setTitle(`**Votes for monthly wipes**`)
                .setColor(0)
                .addField("Yes", yesVotes, true)
                .addField("No", noVotes, true)
                message.channel.send(embedLeader);
            });
        }
    }
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
            .addField("User", result.objArray.slice(0,result.objArray.length/2), true)
            .addField("Data", result.objArray.slice(result.objArray.length/2,100), true)
            .setFooter(result.objArray.length)
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

        if(da.length < 85){
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
            ray_gun = ${da[51]}, golf_club = ${da[52]}, ultra_ammo = ${da[53]}, stick = ${da[54]}, reroll_scroll = ${da[55]}, xp_potion = ${da[56]} WHERE userId = ${userId}`);

            sql.run(`UPDATE scores SET money = ${da[57]}, level = ${da[59]}, points = ${da[58]}, stats = ${da[80]}, used_stats = ${da[83]}, scaledDamage = ${da[82]}, 
            luck = ${da[81]}, maxHealth = ${da[61]}, health = ${da[60]}, kills = ${da[78]}, deaths = ${da[77]} WHERE userId = ${userId}`);
        }
    }
    
    //ADMIN COMMANDS
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
            else if(!completeItemsCheck.includes(itemName)){
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
                    sql.run(`UPDATE scores SET voteTime = ${0}, scrambleTime = ${0}, triviaTime = ${0}, hourlyTime = ${0}, gambleTime = ${0}, 
                    healTime = ${0}, deactivateTime = ${0}, activateTime = ${0}, attackTime = ${0} WHERE userId = ${userId}`);
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
        console.log("got heres");
        if(!adminUsers.has(message.author.id)){
            message.reply("Only admins can use this command!");
            return;
        }
        console.log("gotts here");
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
                    sql.all('SELECT userId FROM scores').then(rows => { //REMOVE IN STABLE UPDATE
                        rows.forEach(function (row) {
                            //test each user
                            methods.monthlywipe(sql, row.userId);
                        });
                    });
                    botMessage.edit("Wiped");
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
}

module.exports = new Commands();