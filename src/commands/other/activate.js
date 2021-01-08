module.exports = {
	name: 'activate',
	aliases: ['play'],
	description: 'Activate your account!',
	long: 'Activates your account on the server.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const activatedGuilds = await app.query('SELECT * FROM userGuilds WHERE userId = ?', [message.author.id])

		for (let i = 0; i < activatedGuilds.length; i++) {
			if (activatedGuilds[i].guildId === message.channel.guild.id) return message.reply('❌ Your account is already active on this server!')
		}

		const isPatron = await app.patreonHandler.isPatron(message.author.id)

		if (activatedGuilds.length >= 3 && !isPatron) return message.reply('❌ You cannot be active in more than **3** servers at once!\n\nIf you wish to activate in this server, you should use the `deactivate` command in a server you are already activated in.')
		else if (activatedGuilds.length >= 5) return message.reply('❌ You cannot be active in more than **5** servers at once!\n\nIf you wish to activate in this server, you should use the `deactivate` command in a server you are already activated in.')

		await app.cd.clearCD(message.author.id, `activate|${message.channel.guild.id}`)
		await app.cd.setCD(message.author.id, `activate|${message.channel.guild.id}`, 3600 * 1000)
		await app.player.activate(message.author.id, message.channel.guild.id)

		if (Object.keys(app.config.activeRoleGuilds).includes(message.channel.guild.id)) {
			try {
				message.member.addRole(app.config.activeRoleGuilds[message.channel.guild.id].activeRoleID)
			}
			catch (err) {
				console.warn('Failed to add active role.')
			}
		}

		return message.reply('✅ Account activated in this server')
	}
}
