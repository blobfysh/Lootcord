/*
    Run this to compile the item json's into completeItemList.json

    node _compiler.js

    or run with 'verbose' to see specific attribute changes: 
    
    node _compiler.js verbose


    NOTE: You could technically edit the completeItemList.json file directly and see changes, 
    but it will quickly become overwhelming to do so, that is why this compiler exists.

    This will also show any changes made to the completeItemList, so you can verify you changed all the correct items.
*/

const args         = process.argv.slice(2);
const fs           = require('fs');

const previousList = require('./completeItemList');

const common       = require('./common');
const uncommon     = require('./uncommon');
const rare         = require('./rare');
const epic         = require('./epic');
const legendary    = require('./legendary');
const ultra        = require('./ultra');
const limited      = require('./limited');

const combined     = { ...common, ...uncommon, ...rare, ...epic, ...legendary, ...ultra, ...limited };

let itemsLost = {};
let itemsGained= {};
let itemsChanged = {};

for(let item of Object.keys(previousList)){

    if(!combined[item]){
        itemsLost[item] = previousList[item].rarity;
    }

    for(let key of Object.keys(previousList[item])){
        if(combined[item]){
            if(combined[item][key] == undefined){
                args.includes('verbose') ? console.log(key + ' was removed from ' + item) : undefined;
                itemsChanged[item] = {
                    rarity: combined[item].rarity,
                    changes: itemsChanged[item] ? itemsChanged[item].changes + 1 : 1
                };
            }
            else if(combined[item][key].toString() !== previousList[item][key].toString()){
                args.includes('verbose') ? console.log(key + ' value was modified for ' + item) : undefined;
                itemsChanged[item] = {
                    rarity: combined[item].rarity,
                    changes: itemsChanged[item] ? itemsChanged[item].changes + 1 : 1
                };
            }
        }
    }
    
    if(combined[item]){
        for(let key of Object.keys(combined[item])){
            if(previousList[item]){
                if(previousList[item][key] == undefined){
                    args.includes('verbose') ? console.log(key + ' was added to ' + item) : undefined;
                    itemsChanged[item] = {
                        rarity: combined[item].rarity,
                        changes: itemsChanged[item] ? itemsChanged[item].changes + 1 : 1
                    };
                }
            }
        }    
    }
}

for(let item of Object.keys(combined)){
    if(previousList[item] == undefined){
        itemsGained[item] = combined[item].rarity;
    }
}

console.warn(`===================\nItems gained (${Object.keys(itemsGained).length}):\n`);
console.log('\nCommon: ' + Object.keys(itemsGained).filter(item => itemsGained[item] == 'Common').sort().join(', '));
console.log('\nUncommon: ' + Object.keys(itemsGained).filter(item => itemsGained[item] == 'Uncommon').sort().join(', '));
console.log('\nRare: ' + Object.keys(itemsGained).filter(item => itemsGained[item] == 'Rare').sort().join(', '));
console.log('\nEpic: ' + Object.keys(itemsGained).filter(item => itemsGained[item] == 'Epic').sort().join(', '));
console.log('\nLegendary: ' + Object.keys(itemsGained).filter(item => itemsGained[item] == 'Legendary').sort().join(', '));
console.log('\nUltra: ' + Object.keys(itemsGained).filter(item => itemsGained[item] == 'Ultra').sort().join(', '));
console.log('\nLimited: ' + Object.keys(itemsGained).filter(item => itemsGained[item] == 'Limited').sort().join(', '));


console.warn(`\n===================\nItems lost (${Object.keys(itemsLost).length}):\n`);
console.log('\nCommon: ' + Object.keys(itemsLost).filter(item => itemsLost[item] == 'Common').sort().join(', '));
console.log('\nUncommon: ' + Object.keys(itemsLost).filter(item => itemsLost[item] == 'Uncommon').sort().join(', '));
console.log('\nRare: ' + Object.keys(itemsLost).filter(item => itemsLost[item] == 'Rare').sort().join(', '));
console.log('\nEpic: ' + Object.keys(itemsLost).filter(item => itemsLost[item] == 'Epic').sort().join(', '));
console.log('\nLegendary: ' + Object.keys(itemsLost).filter(item => itemsLost[item] == 'Legendary').sort().join(', '));
console.log('\nUltra: ' + Object.keys(itemsLost).filter(item => itemsLost[item] == 'Ultra').sort().join(', '));
console.log('\nLimited: ' + Object.keys(itemsLost).filter(item => itemsLost[item] == 'Limited').sort().join(', '));


console.warn(`\n===================\nItems with changed attributes (${Object.keys(itemsChanged).length} total):`);
console.log('# inside parenthesis is number of attributes changed.');
console.log('\nCommon: ' + Object.keys(itemsChanged).filter(item => itemsChanged[item].rarity == 'Common').sort().map(item => item + '(' + itemsChanged[item].changes + ')').join(', '));
console.log('\nUncommon: ' + Object.keys(itemsChanged).filter(item => itemsChanged[item].rarity == 'Uncommon').sort().map(item => item + '(' + itemsChanged[item].changes + ')').join(', '));
console.log('\nRare: ' + Object.keys(itemsChanged).filter(item => itemsChanged[item].rarity == 'Rare').sort().map(item => item + '(' + itemsChanged[item].changes + ')').join(', '));
console.log('\nEpic: ' + Object.keys(itemsChanged).filter(item => itemsChanged[item].rarity == 'Epic').sort().map(item => item + '(' + itemsChanged[item].changes + ')').join(', '));
console.log('\nLegendary: ' + Object.keys(itemsChanged).filter(item => itemsChanged[item].rarity == 'Legendary').sort().map(item => item + '(' + itemsChanged[item].changes + ')').join(', '));
console.log('\nUltra: ' + Object.keys(itemsChanged).filter(item => itemsChanged[item].rarity == 'Ultra').sort().map(item => item + '(' + itemsChanged[item].changes + ')').join(', '));
console.log('\nLimited: ' + Object.keys(itemsChanged).filter(item => itemsChanged[item].rarity == 'Limited').sort().map(item => item + '(' + itemsChanged[item].changes + ')').join(', '));


console.log('===================')
console.log('Total items in new list: ' + Object.keys(combined).length);
console.log('Total items in previous list: ' + Object.keys(previousList).length);

fs.renameSync('completeItemList.json', 'completeItemList_old.json');

fs.writeFile('completeItemList.json',JSON.stringify(combined, null, 4), function(err) {
    if(err) {
        console.error('There was an error trying to save the new list!');
        console.log(err);
        return;
    }

    console.log('\n\nSuccess! The previous completeItemList.json was saved as completeItemList_old.json');
});