module.exports = {
	name: 'deactivate',
	aliases: [''],
	description: 'Deactivate your account in a server.',
	long: 'Deactivates your account on server it\'s used in. Deactivating prevents you from being attacked in that server **BUT** also prevents you from being able to attack or use items.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const activateCD = await app.cd.getCD(message.author.id, `activate|${message.channel.guild.id}`)
		const attackCD = await app.cd.getCD(message.author.id, 'attack')

		if (activateCD) return message.reply(`You must wait \`${activateCD}\` after activating in order to deactivate`)

		else if (attackCD) return message.reply('You can\'t deactivate while you have an attack cooldown!')

		const botMessage = await message.reply('Deactivating your account will prevent you from using commands or being targeted in **this** server.\n\n**Are you sure?**')

		try {
			const result = await app.react.getConfirmation(message.author.id, botMessage, 15000)

			if (result) {
				const attackCDAfter = await app.cd.getCD(message.author.id, 'attack')

				if (attackCDAfter) return botMessage.edit('You can\'t deactivate while you have an attack cooldown!')

				// All checks passed, deactivate account
				await app.player.deactivate(message.author.id, message.channel.guild.id)

				botMessage.edit('Your account has been disabled on this server')

				if (Object.keys(app.config.activeRoleGuilds).includes(message.channel.guild.id)) {
					try {
						message.member.removeRole(app.config.activeRoleGuilds[message.channel.guild.id].activeRoleID)
					}
					catch (err) {
						console.warn('Failed to remove active role.')
					}
				}
			}
			else {
				botMessage.delete()
			}
		}
		catch (err) {
			botMessage.edit('You didn\'t react in time!')
		}
	}
}
