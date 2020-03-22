const itemdata = require('../resources/json/items/completeItemList');
const badgedata = require('../resources/json/badges');
const MicroSpellingCorrecter = require('micro-spelling-correcter');
const spell = new MicroSpellingCorrecter(Object.keys(itemdata));
/**
 * Returns an array of items
 */
exports.getItemsFromArgs = function(args){
    let itemArgs = args.map((arg, i) => {

        // check if two args make up item name
        let correctedArgs = exports.getCorrectedItem(arg + '_' + (args[i + 1]));
        if(itemdata[correctedArgs]){
            
            // remove the next element because we already found an item using it.
            args.splice(args.indexOf(args[i + 1]), 1);

            // return the item
            return correctedArgs
        }

        // check if single arg was item
        let correctedArg = exports.getCorrectedItem(arg);
        if(itemdata[correctedArg]) return correctedArg;
        
        // no item found
        else return undefined;
    });

    return itemArgs.filter(arg => arg !== undefined);
}

// corrects the item name
exports.getCorrectedItem = function(itemName = ''){
    let itemSearched = itemName.toLowerCase();

    // prevent unnecessary spell corection calls. 
    if(itemSearched.split('_')[1] == 'undefined') return undefined;

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
            // try using spell correction to find the item name
            let itemCorrected = spell.correct(itemSearched.slice(0, 13));

            if(itemdata[itemCorrected]){
                itemSearched = itemCorrected;
            }
    }

    return itemSearched;
}

exports.getNumbersFromArgs = function(args){
    let numbers = [];
    for(let arg of args){
        arg = arg.replace(/[^0-9.-]+/g,"");

        if(!isNaN(arg)){
            numbers.push(Math.floor(Number(arg)));
        }
    }
    
    return numbers.filter(num => num >= 0);
}

exports.getBadgesFromArgs = function(args){
    let badgeArgs = args.map((arg, i) => {

        let badge = arg + '_' + (args[i + 1]);
        // check if two args make up  badge
        if(badgedata[badge]){
            
            // remove the next element because we already found a badge using it.
            args.splice(args.indexOf(args[i + 1]), 1);

            // return the item
            return badge
        }

        // check if single arg was badge
        if(itemdata[arg]) return arg;
        
        // no badge found
        else return undefined;
    });

    return badgeArgs.filter(arg => arg !== undefined);
}
