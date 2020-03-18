//const Discord = require("discord.js");
const { query } = require('../mysql.js');
//const config = require('../json/_config.json');
const itemdata = require("../json/completeItemList");
const MicroSpellingCorrecter = require('micro-spelling-correcter');
const spell = new MicroSpellingCorrecter(Object.keys(itemdata));
const badgedata = require('../json/badges');


class Methods {
    isUser(mention, allowTag = false, message = undefined){
        if(/^<@!?(\d+)>$/.test(mention[0])){
            return true;
        }
        else if(allowTag && /^(.*)#([0-9]{4})$/.test(mention.join(' '))){
            if(this.getUserId(mention, true, message)){
                return true;
            }
            else{
                return false;
            }
        }
        return false
    }

    isItem(itemName){
        if(itemdata[itemName] == undefined) return false;
        else return true;
    }

    isBadge(badgeName){
        if(badgedata[badgeName]) return true;
        else return false;
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
            return member ? await message.guild.fetchMember(userId[1], true) : await message.client.fetchUser(userId[1], false);
        }
        catch(err){
            return undefined;
        }
    }

    getUserId(user, allowTag = false, message = undefined){
        if(!user || !user.length) return undefined;
        console.log(user);
        
        var userId = user[0].match(/^<?@?!?(\d+)>?$/);

        if(!userId) {
            try{
                const userTag = user.join(' ').match(/^(.*)#([0-9]{4})$/);
                userId = message.guild.members.find(guildUser => guildUser.user.username.toLowerCase() === userTag[1].toLowerCase() && guildUser.user.discriminator === userTag[2]).id
                return userId;
            }
            catch(err){
                return undefined;
            }
        }
        
        else return userId[1];
    }

    getNum(num, parseNegatives = true, options = {ignoreNonNums: false}){
        if(parseInt(num) < 1){
            if(parseNegatives) return 1;
            else if(options.ignoreNonNums) return undefined
            else return parseInt(num);
        }
        else if(num == undefined || !Number.isInteger(parseInt(num)) || num % 1 !== 0){
            if(options.ignoreNonNums) return undefined;
            return 1;
        }
        else{
            return parseInt(num);
        }
    }

    getCorrectedItemInfo(itemName = ''){
        let itemSearched = itemName.toLowerCase();
        let itemCorrected = spell.correct(itemSearched.slice(0, 13));

        if(itemSearched.endsWith('_')) itemSearched = itemSearched.replace('_', '');

        switch(itemSearched){
            case "item_box":
            case "box":
            case "item": itemSearched = "item_box"; break;
            case "ultra": itemSearched = "ultra_box"; break;
            case "rail":
            case "cannon": itemSearched = "rail_cannon"; break;
            case "ak": itemSearched = "ak47"; break;
            case "m4": itemSearched = "m4a1"; break;
            case "ray": itemSearched = "ray_gun"; break;
            case "golf": itemSearched = "golf_club"; break;
            case "fiber":
            case "optics": itemSearched = "fiber_optics"; break;
            case "gold": itemSearched = "gold_shield"; break;
            case "iron": 
            case "shield": itemSearched = "iron_shield"; break;
            case "peck":
            case "seed": itemSearched = "peck_seed"; break;
            case "health": itemSearched = "health_pot"; break;
            case "xp": itemSearched = "xp_potion"; break;
            case "reroll": itemSearched = "reroll_scroll"; break;
            case "canvas": itemSearched = "canvas_bag"; break;
            case "light": itemSearched = "light_pack"; break;
            case "hikers":
            case "hiker": itemSearched = "hikers_pack"; break;
            case "easter":
            case "egg": itemSearched = "easter_egg"; break;
            case "golden": itemSearched = "golden_egg"; break;
            case "tnt": itemSearched = "tnt_egg"; break;
            case "candy": itemSearched = "candy_bar"; break;
            case "magic": itemSearched = "magic_staff"; break;
            case "care":
            case "package": itemSearched = "care_package"; break;
            case "cyber": itemSearched = "cyber_pack"; break;
            case "supply": itemSearched = "suppy_signal"; break;
            case "powder": itemSearched = "gunpowder"; break;
            case "smg": itemSearched = "smg_body"; break;
            case "pump": itemSearched = "pump_body"; break;
            case "assault": itemSearched = "assault_body"; break;
            case "rifle":
            case "body": itemSearched = "rifle_body"; break;
            case "desert":
            case "deagle": itemSearched = "desert_eagle"; break;
            case "762": itemSearched = "7.62x39_fmj"; break;
            case "556": itemSearched = "5.56x45_fmj"; break;
            case "50ae":
            case ".50": itemSearched = ".50ae_hp"; break;
            case "slug": itemSearched = "12g_slug"; break;
            case "blunder": itemSearched = "blunderbuss"; break;
            case "cross": itemSearched = "crossbow"; break;
            case "buckshot":
            case "12g": itemSearched = "12g_buckshot"; break;
            case ".45":
            case "acp": itemSearched = ".45_fmj"; break;
            case ".44": itemSearched = ".44_fmj"; break;
            case "9mm":
            case "bullet":
            case "9x19": itemSearched = "9x19_fmj"; break;
            case "7n23": itemSearched = "7.62x39_7n23"; break;
            case "m61": itemSearched = "7.62x51_m61"; break;
            case "m80": itemSearched = "7.62x51_m80"; break;
            case "m855": itemSearched = "5.56x45_m855"; break;

            default:
                if(this.isItem(itemCorrected)){
                    itemSearched = itemCorrected;
                }
        }
        return itemSearched.toLowerCase();
    }

    parseArgsWithSpaces(arg1, arg2 = '', arg3 = '', getNum = false, getUser = false, getUseArgs = false, options = {clanDeposit: false, getMarketPrice: false, BMarg4: ''}){
        var itemName = this.getCorrectedItemInfo(arg1 + '_' + arg2);

        if(this.isItem(itemName)){
            if(getUseArgs){
                if(arg2 == 'rand' || arg2 == 'random') return arg2;
                else if(this.isNum(arg2)) return arg2;
                else if(this.isUser([arg2])) return arg2;
                else if(arg3 == 'rand' || arg3 == 'random') return arg3;
                else if(this.isNum(arg3)) return arg3;
                else if(this.isUser([arg3])) return arg3;
                else return undefined;
            }
            else if(getNum){
                if(this.isNum(arg2)) return arg2;
                else if(this.isNum(arg3)) return arg3;
                else return undefined;
            }
            else if(getUser){
                if(this.isUser(arg3)) return arg3;
                else return undefined;
            }
            else if(options.getMarketPrice){
                if(this.isNum(options.BMarg4)) return options.BMarg4
                return arg3;
            }
            return itemName;
        }
        else{
            itemName = this.getCorrectedItemInfo(arg1);

            if(this.isItem(itemName)){
                if(getUseArgs){
                    if(arg2 == 'rand' || arg2 == 'random') return arg2;
                    else if(this.isNum(arg2)) return arg2;
                    else if(this.isUser([arg2])) return arg2;
                    else if(arg3 == 'rand' || arg3 == 'random') return arg3;
                    else if(this.isNum(arg3)) return arg3;
                    else if(this.isUser([arg3])) return arg3;
                    else return undefined;
                }
                else if(getNum){
                    if(this.isNum(arg2)) return arg2;
                    else if(this.isNum(arg3)) return arg3;
                    else return undefined;
                }
                else if(getUser){
                    if(this.isUser(arg2)) return arg2;
                    else if(this.isUser(arg3)) return arg3;
                    else return undefined;
                }
                else if(options.getMarketPrice){
                    return arg3;
                }
                return itemName;
            }
            else if(options.clanDeposit) return arg2;
            else if(getNum || getUser || getUseArgs) return undefined;
            else return arg1;
        }
    }

    parseBadgeWithSpaces(arg1, arg2){
        if(badgedata[arg1 + '_' + arg2]){
            return arg1 + '_' + arg2;
        }
        else if(badgedata[arg1]){
            return arg1;
        }
        else return arg1;
    }

    /**
     * 
     * @param {*} userId User to retrieve items for (in an object format).
     */
    async getItemObject(userId){
        const itemRows = (await query(`SELECT item, COUNT(item) AS amount FROM user_items WHERE userId = "${userId}" GROUP BY item`));
        var itemObj = {}
    
        for(var i = 0; i < itemRows.length; i++){
            itemObj[itemRows[i].item] = itemRows[i].amount;
        }
    
        return itemObj;
    }

    /**
     * 
     * @param {*} userId User to retrieve badges for (in an array format).
     */
    async getBadges(userId){
        const badges = (await query(`SELECT badge FROM badges WHERE userId = "${userId}"`));
        var badgeArr = [];

        for(var badge of badges){
            if(badgedata[badge.badge]) badgeArr.push(badge.badge);
        }

        return badgeArr;
    }
}

module.exports = new Methods();