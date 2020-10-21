const ArgParser = require('../utils/ArgParser')

exports.run = function(msg) {
	console.log('[APP] Reloading items')
	delete require.cache[require.resolve('../resources/items/banners')]
	delete require.cache[require.resolve('../resources/items/storage')]
	delete require.cache[require.resolve('../resources/items/materials')]
	delete require.cache[require.resolve('../resources/items/ammo')]
	delete require.cache[require.resolve('../resources/items/items')]
	delete require.cache[require.resolve('../resources/items/melee')]
	delete require.cache[require.resolve('../resources/items/ranged')]

	this.itemdata = this.loadItems()
	this.parse = new ArgParser(this) // must reload arg parser so the spell correction can update
}
