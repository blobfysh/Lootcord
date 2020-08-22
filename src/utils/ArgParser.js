const SpellCorrector = require('../structures/Corrector');
const ignoredItemCorrections = ['bounty', 'fuck', 'cock', 'armor', 'all', 'money', 'arms', 'arm', 'loot', 'og']; // don't correct these words into items

class ArgParser {
    constructor(app){
        this.app = app;
        this.badgedata = app.badgedata;
        this.itemCorrector = new SpellCorrector([...Object.keys(this.app.itemdata), ...this._getAliases().filter(item => item.length > 3)]);
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
    
                    if(this.app.itemdata[correctedArg] && !this._isNumber(args[i])){
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

        else if(this._getAliases().includes(itemSearched)){
            return Object.keys(this.app.itemdata).filter(item => this.app.itemdata[item].aliases.includes(itemSearched))[0];
        } 

        else{
            // try using spell correction to find the item name
            let itemCorrected = this.itemCorrector.getWord(itemSearched);

            return this.app.itemdata[itemCorrected] ? itemCorrected : Object.keys(this.app.itemdata).filter(item => this.app.itemdata[item].aliases.includes(itemCorrected))[0];
        }
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
                if(arg.endsWith('m')){
                    numbers.push(Math.floor(parseFloat(arg) * 1000000))
                }
                else if(arg.endsWith('k')){
                    numbers.push(Math.floor(parseFloat(arg) * 1000))
                }
                else{
                    numbers.push(Math.floor(Number(arg)));
                }
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
        else if(arg.endsWith('m') && !isNaN(arg.slice(0, -1)) && Number(arg.slice(0, -1))){
            return true;
        }
        else if(arg.endsWith('k') && !isNaN(arg.slice(0, -1)) && Number(arg.slice(0, -1))){
            return true;
        }
        else return false;
    }

    _getAliases(){
        let aliases = [];

        for(let item in this.app.itemdata){
            for(let alias of this.app.itemdata[item].aliases){
                aliases.push(alias);
            }
        }

        return aliases;
    }
}

module.exports = ArgParser;