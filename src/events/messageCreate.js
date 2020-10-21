exports.run = async function(message) {
	if (message.author.bot) return

	// bot is not ready to accept commands
	if (!this.isReady) return

	if (this.config.ignoredGuilds.includes(message.channel.guild.id)) return

	this.commandHandler.handle(message)
}
