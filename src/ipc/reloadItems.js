const ArgParser = require('../utils/ArgParser')

exports.run = function(msg) {
	console.log('[APP] Reloading items')
	delete require.cache[require.resolve('../resources/json/items/completeItemList')]
	this.itemdata = require('../resources/json/items/completeItemList')
	this.parse = new ArgParser(this) // must reload arg parser so the spell correction can update
}
