exports.run = async function (msg) {
	const guild = this.bot.guilds.get(msg.guildId)
	if (guild) {
		const member = await this.common.fetchMember(guild, msg.userId)

		try {
			if (member) await member.removeRole(msg.roleId)
		}
		catch (err) {
			console.warn('Failed removing active role.')
			console.warn(err)
		}
	}
}
