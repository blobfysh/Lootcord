exports.run = async function(msg) {
	const guild = this.bot.guilds.get(msg.guildId)
	if (guild) {
		const member = await this.common.fetchMember(guild, msg.userId)

		try {
			if (member) await member.addRole(this.config.donatorRoles.kofi)
		}
		catch (err) {
			console.warn('Failed adding donator role.')
			console.warn(err)
		}
	}
}
