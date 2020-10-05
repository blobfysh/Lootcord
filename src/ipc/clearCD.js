exports.run = function(msg) {
	this.cd.clearTimers(msg.userId, msg.type)
}
