const SpellCorrector = require('../structures/Corrector');
const ignoredItemCorrections = ['bounty', 'fuck', 'cock', 'armor']; // don't correct these words into items

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
            let correctedArgs = this.correctItem(args[i] + '_' + args[i + 1] + '_' + args[i + 2]);

            // check if 3 args makes up item
            if(this.app.itemdata[correctedArgs] && !this._isNumber(args[i]) && !this._isNumber(args[i + 1]) && !this._isNumber(args[i + 2])){
                args.splice(i, 1);
                args.splice(i, 1);
                args.splice(i, 1);
                i -= 1;

                itemArgs.push(correctedArgs);
            }
            else{
                // check if 2 args makes up item
                correctedArgs = this.correctItem(args[i] + '_' + args[i + 1]);

                if(this.app.itemdata[correctedArgs] && !this._isNumber(args[i]) && !this._isNumber(args[i + 1])){
                    args.splice(i, 1);
                    args.splice(i, 1);
                    i -= 1;
    
                    itemArgs.push(correctedArgs);
                }
                else{
                    // check if 1 arg makes up item
                    let correctedArg = this.correctItem(args[i]);
    
                    if(this.app.itemdata[correctedArg]){
                        args.splice(i, 1);
                        i -= 1;
    
                        itemArgs.push(correctedArg);
                    }    
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
        let itemParts = itemSearched.split('_');

        // prevent unnecessary spell corection calls. 
        if(itemParts[itemParts.length - 1] === 'undefined' || ignoredItemCorrections.includes(itemSearched)){
            return undefined;
        } 

        switch(itemSearched){
            case "item_box":
            case "box":
            case "loot":
            case "container":
            case "item": itemSearched = "crate"; break;
            case "rifle":
            case "ak":
            case "assault":
            case "ak47":
            case "ak-47": itemSearched = "assault_rifle"; break;
            case "med":
            case "med_syringe":
            case "syringe": itemSearched = "medical_syringe"; break;
            case "medkit": itemSearched = "large_medkit"; break;
            case "large_box": itemSearched = "large_wood_box"; break;
            case "drop":
            case "airdrop":
            case "supply": itemSearched = "supply_drop"; break;
            case "signal": itemSearched = "supply_signal"; break;
            case "pipy":
            case "pipey":
            case "waterpipe": itemSearched = "waterpipe_shotgun"; break;
            case "shotgun":
            case "pump":
            case "shotty":
            case "pumpy": itemSearched = "pump_shotgun"; break;
            case "gp":
            case "boom":
            case "powder": itemSearched = "gunpowder"; break;
            case "sar":
            case "semi": itemSearched = "semi_rifle"; break;
            case "p2":
            case "p250":
            case "pistol": itemSearched = "semi_pistol"; break;
            case "custom":
            case "smg": itemSearched = "custom_smg"; break;
            case "m2":
            case "machine_gun": itemSearched = "m249"; break;
            case "rpg":
            case "launcher": itemSearched = "rocket_launcher"; break;
            case "tommy":
            case "thommy": itemSearched = "thompson"; break;
            case "crossy": itemSearched = "crossbow"; break;
            case "pick": itemSearched = "pickaxe"; break;
            case "f1":
            case "grenade": itemSearched = "f1_grenade"; break;
            case "spear": itemSearched = "wooden_spear"; break;
            case "metal_frags":
            case "metal_frag":
            case "frags":
            case "metal_fragments": itemSearched = "metal"; break;
            case "salvaged":
            case "cleaver": itemSearched = "salvaged_cleaver"; break;
            case "sword": itemSearched = "salvaged_sword"; break;
            case "knife": itemSearched = "bone_knife"; break;
            case "timed_explosive": itemSearched = "c4"; break;
            case "bolty":
            case "sniper":
            case "bolt":
            case "bolt_action": itemSearched = "bolt_rifle"; break;
            case "revy":
            case "revo":
            case "revvy": itemSearched = "revolver"; break;
            case "mili":
            case "milli":
            case "mili_crate":
            case "milly":
            case "milly_crate":
            case "military":
            case "milli_crate": itemSearched = "military_crate"; break;
            case "55":
            case "556":
            case "rifle_ammo":
            case "5.56x45":
            case "556x45":
            case "5.56": itemSearched = "rifle_bullet"; break;
            case "9mm":
            case "9mil":
            case "9mill":
            case "9m":
            case "9x19":
            case "bullet":
            case "ammo":
            case "ammunition":
            case "pistol_ammo": itemSearched = "pistol_bullet"; break;
            case "slug": itemSearched = "12g_slug"; break;
            case "buck":
            case "buckshot":
            case "12_gauge":
            case "shotgun_ammo":
            case "shotgun_bullet":
            case "shotty_ammo":
            case "shotty_bullet":
            case "12g": itemSearched = "12g_buckshot"; break;
            case "spring": itemSearched = "metal_spring"; break;
            case "pipe": itemSearched = "metal_pipe"; break;
            case "body": itemSearched = "rifle_body"; break;
            case "tech":
            case "trash": itemSearched = "tech_trash"; break;
            case "hazzy":
            case "hazmat":
            case "radsuit":
            case "haz":
            case "rad_suit": itemSearched = "hazmat_suit"; break;
            case "lr":
            case "lr_300": itemSearched = "lr-300"; break;
            case "m92":
            case "m9": itemSearched = "m92_pistol"; break;
            case "spas":
            case "spas_12": itemSearched = "spas-12"; break;
            case "hv":
            case "hv_bullet":
            case "high_velocity":
            case "hv_rifle":
            case "high_velocity_bullet":
            case "hv_ammo": itemSearched = "hv_rifle_bullet"; break;
            case "candy":
            case "chocolate":
            case "chocolate_bar": itemSearched = "candy_bar"; break;
            case "snow": itemSearched = "snowball"; break;
            case "pail":
            case "candy_bucket": itemSearched = "candy_pail"; break;

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