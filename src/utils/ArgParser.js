const SpellCorrector = require('../structures/Corrector');
const ignoredItemCorrections = ['bounty', 'fuck', 'cock']; // don't correct these words into items

class ArgParser {
    constructor(app){
        this.app = app;
        this.badgedata = app.badgedata;
        this.itemCorrector = new SpellCorrector(Object.keys(this.app.itemdata).filter(item => item.length > 3));
        this.badgeCorrector = new SpellCorrector(Object.keys(this.app.badgedata));
    }

    /**
     * Finds all items from an array of arguments
     * @param {string[]} args Array of args to find items from
     * @param {number} amount Max amount of items to find
     */
    items(args, amount = 1){
        let itemArgs = [];

        for(let i = 0; i < args.length; i++){
            let correctedArgs = this.correctItem(args[i] + '_' + args[i + 1]);

            if(this.app.itemdata[correctedArgs] && !this._isNumber(args[i]) && !this._isNumber(args[i + 1])){
                args.splice(i, 1);
                args.splice(i, 1);
                i -= 1;

                itemArgs.push(correctedArgs);
            }
            else{
                let correctedArg = this.correctItem(args[i]);

                if(this.app.itemdata[correctedArg]){
                    args.splice(i, 1);
                    i -= 1;

                    itemArgs.push(correctedArg);
                }    
            }

            if(itemArgs.length >= amount) break;
        }

        return itemArgs;
    }

    /**
     * Corrects common typos into an actual item name
     * @param {string} itemName String to correct into an item
     */
    correctItem(itemName = ''){
        let itemSearched = itemName.toLowerCase();

        // prevent unnecessary spell corection calls. 
        if(itemSearched.split('_')[1] === 'undefined' || ignoredItemCorrections.includes(itemSearched)){
            return undefined;
        } 

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
            case "potion":
            case "health_potion":
            case "health": itemSearched = "health_pot"; break;
            case "exp":
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
            case "signal":
            case "supply": itemSearched = "supply_signal"; break;
            case "gp":
            case "powder": itemSearched = "gunpowder"; break;
            case "smg": itemSearched = "smg_body"; break;
            case "pump": itemSearched = "pump_body"; break;
            case "assault": itemSearched = "assault_body"; break;
            case "rifle":
            case "body": itemSearched = "rifle_body"; break;
            case "desert":
            case "deagle": itemSearched = "desert_eagle"; break;
            case "7.62":
            case "7.62x39":
            case "762x39":
            case "7.62x39_fmj":
            case "762x39_fmj":
            case "762": itemSearched = "7.62_fmj"; break;
            case "5.56x45":
            case "556x45":
            case "5.56x45_fmj":
            case "5.56x45_fmj":
            case "5.56":
            case "556": itemSearched = "5.56_fmj"; break;
            case "50ae":
            case ".50ae":
            case ".50": itemSearched = ".50ae_hp"; break;
            case "slug": itemSearched = "12g_slug"; break;
            case "870":
            case "shotty":
            case "shotgun":
            case "remington": itemSearched = "remington_870"; break;
            case "cross": itemSearched = "crossbow"; break;
            case "buckshot":
            case "12g": itemSearched = "12g_buckshot"; break;
            case "45":
            case ".45":
            case "acp": itemSearched = ".45_fmj"; break;
            case ".44": itemSearched = ".44_fmj"; break;
            case "9mm":
            case "bullet":
            case "9fmj":
            case "9x19": itemSearched = "9mm_fmj"; break;
            case "7n23": itemSearched = "7.62_7n23"; break;
            case "m61": itemSearched = "7.62_m61"; break;
            case "m80": itemSearched = "7.62_m80"; break;
            case "m855": itemSearched = "5.56_m855"; break;

            default:
                // try using spell correction to find the item name
                let itemCorrected = this.itemCorrector.getWord(itemSearched);

                if(this.app.itemdata[itemCorrected]){
                    itemSearched = itemCorrected;
                }
        }

        return itemSearched;
    }

    /**
     * 
     * @param {string[]} args Array of args to find numbers from
     */
    numbers(args){
        let numbers = [];
        for(let arg of args){
            arg = arg.replace(/,/g,"");
            
            if(this._isNumber(arg)){
                numbers.push(Math.floor(Number(arg)));
            }
            else if(arg.endsWith('m') && !isNaN(arg.slice(0, -1)) && Number(arg.slice(0, -1))){
                numbers.push(Math.floor(parseFloat(arg) * 1000000))
            }
            else if(arg.endsWith('k') && !isNaN(arg.slice(0, -1)) && Number(arg.slice(0, -1))){
                numbers.push(Math.floor(parseFloat(arg) * 1000))
            }
        }
        return numbers.filter(num => num >= 0);
    }

    /**
     * Finds all badge names from an array
     * @param {string[]} args Array of args to find badges from
     */
    badges(args){
        let badgeArgs = args.map((arg, i) => {

            let badge = arg + '_' + (args[i + 1]);
            // check if two args make up  badge
            if(this.badgedata[badge.toLowerCase()]){
                // remove the next element because we already found a badge using it.
                args.splice(args.indexOf(args[i + 1]), 1);
    
                // return the item
                return badge.toLowerCase();
            }
            else{
                const corrected = this.badgeCorrector.getWord(badge.toLowerCase());

                if(this.badgedata[corrected]){
                    args.splice(args.indexOf(args[i + 1]), 1);

                    return corrected;
                }
            }
    
            // check if single arg was badge
            if(this.badgedata[arg.toLowerCase()]){
                return arg.toLowerCase();
            }
            else{
                const corrected = this.badgeCorrector.getWord(arg.toLowerCase());

                if(this.badgedata[corrected]){
                    return corrected;
                }
            }
            
            return undefined;
        });
    
        return badgeArgs.filter(arg => arg !== undefined);
    }

    /**
     * 
     * @param {*} message Discord message object
     * @param {string[]} args Array of args to find members from
     * @returns {Array<Member>} Array of members
     */
    members(message, args){
        let newArgs = args.slice(0, 6);

        let userArgs = newArgs.map((arg, i) => {

            // regex tests for <@!1234etc>, will pass when player mentions someone or types a user id
            if(/^<?@?!?(\d+)>?$/.test(arg)){
                
                // remove <, @, !, > characters from arg to leave only numbers
                let userId = arg.match(/^<?@?!?(\d+)>?$/)[1];

                // find member matching id
                let member = message.channel.guild.members.find(member => member.id === userId);

                return member;
            }
            else if(/^(.*)#([0-9]{4})$/.test(arg)){
                let userTag = arg.split('#');
                // check for usernames with space
                let previousArgs = newArgs.slice(0, i);

                previousArgs.push(userTag[0]);

                for(let i = 1; i < previousArgs.length + 1; i++){
                    // start checking args backwards, starting from the arg that had # in it, ie. big blob fysh#4679, it would check blob fysh then check big blob fysh
                    let userToCheck = previousArgs.slice(i * -1).join(' ');

                    let member = message.channel.guild.members.find(member => {
                        return (member.username.toLowerCase() === userToCheck.toLowerCase() && member.discriminator === userTag[1] ||
                        (member.nick && member.nick.toLowerCase() === userToCheck) && member.discriminator === userTag[1])
                    });

                    if(member) return member;
                }

                return undefined;
            }

            // no user found
            else return undefined;
        });

        return userArgs.filter(arg => arg !== undefined);
    }

    _isNumber(arg){
        if(!isNaN(arg) && Number(arg) && !arg.includes('.')){
            return true;
        }
        else return false;
    }
}

module.exports = ArgParser;