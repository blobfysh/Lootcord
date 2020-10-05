exports.run = function(id) {
	this.cache.incr('shards_resumed')
}
