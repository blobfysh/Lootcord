const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'activate',
	aliases: ['play'],
	description: 'Activate your account!',
	long: 'Activates your account on the server.',
	args: {},
	examples: [],
	permissions: ['sendMessages'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo }) {
		const activatedGuilds = await app.query('SELECT * FROM userguilds WHERE userId = ?', [message.author.id])

		for (let i = 0; i < activatedGuilds.length; i++) {
			if (activatedGuilds[i].guildId === message.channel.guild.id) return reply(message, '❌ Your account is already active on this server!')
		}

		const isPatron = await app.patreonHandler.isPatron(message.author.id)

		if (activatedGuilds.length >= 3 && !isPatron) return reply(message, '❌ You cannot be active in more than **3** servers at once!\n\nIf you wish to activate in this server, you should use the `deactivate` command in a server you are already activated in.')
		else if (activatedGuilds.length >= 5) return reply(message, '❌ You cannot be active in more than **5** servers at once!\n\nIf you wish to activate in this server, you should use the `deactivate` command in a server you are already activated in.')

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

		return reply(message, '✅ Account activated in this server')
	}
}
