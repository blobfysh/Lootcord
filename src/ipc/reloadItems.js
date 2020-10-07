const ArgParser = require('../utils/ArgParser')

exports.run = function(msg) {
	console.log('[APP] Reloading items')
	delete require.cache[require.resolve('../resources/json/items/banners')]
	delete require.cache[require.resolve('../resources/json/items/storage')]
	delete require.cache[require.resolve('../resources/json/items/materials')]
	delete require.cache[require.resolve('../resources/json/items/ammo')]
	delete require.cache[require.resolve('../resources/json/items/items')]
	delete require.cache[require.resolve('../resources/json/items/melee')]
	delete require.cache[require.resolve('../resources/json/items/ranged')]

	this.itemdata = this.loadItems()
	this.parse = new ArgParser(this) // must reload arg parser so the spell correction can update
}
