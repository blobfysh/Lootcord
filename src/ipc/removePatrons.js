exports.run = function(msg) {
	const guild = this.bot.guilds.get(this.config.supportGuildID)
	if (guild) {
		this.patreonHandler.removePatrons(guild)
	}
}
