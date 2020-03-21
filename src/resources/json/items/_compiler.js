/*
    Run this to compile the item json's into completeItemList.json

    TODO remove equippable attribute, add category and type

    type = 'healing' while category would be 'usable'
    type = 'backpack' while category would be 'equippable'
    type = 'box' while category would be 'usable'
    type = 'melee' while category would be 'weapon'
    type = 'gun' while category would be 'weapon'
    type = 'banner' while category would be 'equippable'
    type = 'shield' while category would be 'usable'
    type = 'ammo' while category would be 'ammo'
    type = 'jackpot' while category would be 'usable'

    these categories and types could be used to describe what an item does since many items function the same
    then, we can just check the type/category in the use command 
    if(category === 'usable'){
        use the item based on the type
    }

    peck_seed would still need special checks (thanks peck_seed...)
    requiresAmmo would still be needed for bat (thanks bat...)
*/
const fs = require('fs');