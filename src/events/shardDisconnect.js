exports.run = function(error, id) {
	this.cache.incr('shards_disconnected')
}
