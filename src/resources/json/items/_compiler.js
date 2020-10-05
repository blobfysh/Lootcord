/*
    Run this to compile the item json's into completeItemList.json

    node _compiler.js

    or run with 'verbose' to see specific attribute changes:

    node _compiler.js verbose


    NOTE: You could technically edit the completeItemList.json file directly and see changes,
    but it will quickly become overwhelming to do so, that is why this compiler exists.

    This will also show any changes made to the completeItemList, so you can verify you changed all the correct items.
*/

const args = process.argv.slice(2)
const fs = require('fs')

const previousList = require('./completeItemList')

const ranged = require('./ranged')
const melee = require('./melee')
const items = require('./items')
const ammo = require('./ammo')
const materials = require('./materials')
const storage = require('./storage')
const banners = require('./banners')

const combinedTmp = { ...ranged, ...melee, ...items, ...ammo, ...materials, ...storage, ...banners }
const combined = {}

for (const key of Object.keys(combinedTmp).sort()) {
	combined[key] = combinedTmp[key]
}

const itemsLost = {}
const itemsGained = {}
const itemsChanged = {}

for (const item of Object.keys(previousList)) {
	if (!combined[item]) {
		itemsLost[item] = previousList[item].category
	}

	for (const key of Object.keys(previousList[item])) {
		if (combined[item]) {
			if (combined[item][key] === undefined) {
				args.includes('verbose') ? console.log(`${key} was removed from ${item}`) : undefined
				itemsChanged[item] = {
					rarity: combined[item].rarity,
					changes: itemsChanged[item] ? itemsChanged[item].changes + 1 : 1
				}
			}
			else if (combined[item][key].toString() !== previousList[item][key].toString()) {
				args.includes('verbose') ? console.log(`${key} value was modified for ${item}`) : undefined
				itemsChanged[item] = {
					rarity: combined[item].rarity,
					changes: itemsChanged[item] ? itemsChanged[item].changes + 1 : 1
				}
			}
		}
	}

	if (combined[item]) {
		for (const key of Object.keys(combined[item])) {
			if (previousList[item]) {
				if (previousList[item][key] === undefined) {
					args.includes('verbose') ? console.log(`${key} was added to ${item}`) : undefined
					itemsChanged[item] = {
						rarity: combined[item].rarity,
						changes: itemsChanged[item] ? itemsChanged[item].changes + 1 : 1
					}
				}
			}
		}
	}
}

for (const item of Object.keys(combined)) {
	if (previousList[item] === undefined) {
		itemsGained[item] = combined[item].category
	}
}

console.warn(`===================\nItems gained (${Object.keys(itemsGained).length}):\n`)
console.log(`\nRanged: ${Object.keys(itemsGained).filter(item => itemsGained[item] === 'Ranged').sort().join(', ')}`)
console.log(`\nMelee: ${Object.keys(itemsGained).filter(item => itemsGained[item] === 'Melee').sort().join(', ')}`)
console.log(`\nItems: ${Object.keys(itemsGained).filter(item => itemsGained[item] === 'Items').sort().join(', ')}`)
console.log(`\nAmmo: ${Object.keys(itemsGained).filter(item => itemsGained[item] === 'Ammo').sort().join(', ')}`)
console.log(`\nMaterials: ${Object.keys(itemsGained).filter(item => itemsGained[item] === 'Materials').sort().join(', ')}`)
console.log(`\nStorage: ${Object.keys(itemsGained).filter(item => itemsGained[item] === 'Storage').sort().join(', ')}`)
console.log(`\nBanners: ${Object.keys(itemsGained).filter(item => itemsGained[item] === 'Banners').sort().join(', ')}`)


console.warn(`\n===================\nItems lost (${Object.keys(itemsLost).length}):\n`)
console.log(`\nRanged: ${Object.keys(itemsLost).filter(item => itemsLost[item] === 'Ranged').sort().join(', ')}`)
console.log(`\nMelee: ${Object.keys(itemsLost).filter(item => itemsLost[item] === 'Melee').sort().join(', ')}`)
console.log(`\nItems: ${Object.keys(itemsLost).filter(item => itemsLost[item] === 'Items').sort().join(', ')}`)
console.log(`\nAmmo: ${Object.keys(itemsLost).filter(item => itemsLost[item] === 'Ammo').sort().join(', ')}`)
console.log(`\nMaterials: ${Object.keys(itemsLost).filter(item => itemsLost[item] === 'Materials').sort().join(', ')}`)
console.log(`\nStorage: ${Object.keys(itemsLost).filter(item => itemsLost[item] === 'Storage').sort().join(', ')}`)
console.log(`\nBanners: ${Object.keys(itemsLost).filter(item => itemsLost[item] === 'Banners').sort().join(', ')}`)


console.warn(`\n===================\nItems with changed attributes (${Object.keys(itemsChanged).length} total):`)
console.log('# inside parenthesis is number of attributes changed.')
console.log(`\nRanged: ${Object.keys(itemsChanged).filter(item => itemsChanged[item].category === 'Ranged').sort().map(item => `${item}(${itemsChanged[item].changes})`).join(', ')}`)
console.log(`\nMelee: ${Object.keys(itemsChanged).filter(item => itemsChanged[item].category === 'Melee').sort().map(item => `${item}(${itemsChanged[item].changes})`).join(', ')}`)
console.log(`\nItems: ${Object.keys(itemsChanged).filter(item => itemsChanged[item].category === 'Items').sort().map(item => `${item}(${itemsChanged[item].changes})`).join(', ')}`)
console.log(`\nAmmo: ${Object.keys(itemsChanged).filter(item => itemsChanged[item].category === 'Ammo').sort().map(item => `${item}(${itemsChanged[item].changes})`).join(', ')}`)
console.log(`\nMaterials: ${Object.keys(itemsChanged).filter(item => itemsChanged[item].category === 'Materials').sort().map(item => `${item}(${itemsChanged[item].changes})`).join(', ')}`)
console.log(`\nStorage: ${Object.keys(itemsChanged).filter(item => itemsChanged[item].category === 'Storage').sort().map(item => `${item}(${itemsChanged[item].changes})`).join(', ')}`)
console.log(`\nBanners: ${Object.keys(itemsChanged).filter(item => itemsChanged[item].category === 'Banners').sort().map(item => `${item}(${itemsChanged[item].changes})`).join(', ')}`)


console.log('===================')
console.log(`Total items in new list: ${Object.keys(combined).length}`)
console.log(`Total items in previous list: ${Object.keys(previousList).length}`)

fs.renameSync('completeItemList.json', 'completeItemList_old.json')

fs.writeFile('completeItemList.json', JSON.stringify(combined, null, 4), err => {
	if (err) {
		console.error('There was an error trying to save the new list!')
		console.log(err)
		return
	}

	console.log('\n\nSuccess! The previous completeItemList.json was saved as completeItemList_old.json')
})
