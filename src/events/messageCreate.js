exports.run = async function (message) {
	if (message.author.bot) return

	// bot is not ready to accept commands
	if (!this.isReady) return

	this.commandHandler.handle(message)
}
