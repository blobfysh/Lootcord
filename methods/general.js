//const Discord = require("discord.js");
//const { query } = require('../mysql.js');
//const config = require('../json/_config.json');
const itemdata = require("../json/completeItemList");

class Methods {
    isUser(mention){
        return /^<@!?(\d+)>$/.test(mention)
        // ^<?@?!?(\d+)>?$ - Allow user id only to return true
    }

    isItem(itemName){
        if(itemdata[itemName] == undefined) return false;
        else return true;
    }

    isNum(num){
        if(num == undefined || !Number.isInteger(parseInt(num))) return false;
        else return true;
    }

    async getUserInfo(message, user, member = false){
        if(!user) return undefined;

        var userId = user.match(/^<?@?!?(\d+)>?$/);

        if(!userId) return undefined;

        try{
            return member ? await message.guild.fetchMember(userId[1], false) : await message.client.fetchUser(userId[1], false);
        }
        catch(err){
            return undefined;
        }
    }

    getUserId(user){
        if(!user) return undefined;
        
        var userId = user.match(/^<?@?!?(\d+)>?$/);

        if(!userId) return undefined
        else return userId[1];
    }

    getNum(num, parseNegatives = true){
        if(parseInt(num) < 1){
            if(parseNegatives) return 1;
            else return parseInt(num);
        }
        else if(num == undefined || !Number.isInteger(parseInt(num)) || num % 1 !== 0){
            return 1;
        }
        else{
            return parseInt(num);
        }
    }

    getCorrectedItemInfo(itemName = ''){
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

    parseArgsWithSpaces(arg1, arg2 = '', arg3 = '', getNum = false, getUser = false){
        var itemName = this.getCorrectedItemInfo(arg1 + '_' + arg2);

        if(this.isItem(itemName)){
            if(getNum){
                if(this.isNum(arg3)) return arg3;
                else return undefined;
            }
            else if(getUser){
                if(this.isUser(arg3)) return arg3;
                else return undefined;
            }
            return itemName;
        }
        else{
            itemName = this.getCorrectedItemInfo(arg1);

            if(this.isItem(itemName)){
                if(getNum){
                    if(this.isNum(arg2)) return arg2;
                    else if(this.isNum(arg3)) return arg3;
                    else return undefined;
                }
                else if(getUser){
                    if(this.isUser(arg2)) return arg2;
                    else if(this.isUser(arg3)) return arg3;
                    else return undefined;
                }
                return itemName;
            }
            else return arg1;
        }
    }
}

console.log(new Methods().parseArgsWithSpaces('rifle', 'body', '<@!494220264129953792>', false, true));

module.exports = new Methods();