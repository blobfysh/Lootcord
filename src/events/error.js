exports.run = function (error, id) {
	console.error(error)
	this.cache.incr('errors')
}
