const { BUTTONS } = require('../../resources/constants')

exports.command = {
	name: 'deactivate',
	aliases: [],
	description: 'Deactivate your account in a server.',
	long: 'Deactivates your account on server it\'s used in. Deactivating prevents you from being attacked in that server **BUT** also prevents you from being able to attack or use items.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'addReactions'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: true,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const activateCD = await app.cd.getCD(message.author.id, `activate|${message.channel.guild.id}`)
		const attackCD = await app.cd.getCD(message.author.id, 'attack', { serverSideGuildId })

		if (activateCD) return message.reply(`You must wait \`${activateCD}\` after activating in order to deactivate`)

		else if (attackCD) return message.reply('You can\'t deactivate while you have an attack cooldown!')

		const botMessage = await message.reply({
			content: 'Deactivating your account will prevent you from using commands or being targeted in **this** server.\n\n**Are you sure?**',
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				const attackCDAfter = await app.cd.getCD(message.author.id, 'attack', { serverSideGuildId })

				if (attackCDAfter) {
					return confirmed.respond({
						content: 'You can\'t deactivate while you have an attack cooldown!',
						components: []
					})
				}

				// All checks passed, deactivate account
				await app.player.deactivate(message.author.id, message.channel.guild.id)

				await confirmed.respond({
					content: 'Your account has been disabled on this server.',
					components: []
				})

				if (Object.keys(app.config.activeRoleGuilds).includes(message.channel.guild.id)) {
					try {
						await message.member.removeRole(app.config.activeRoleGuilds[message.channel.guild.id].activeRoleID)
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
			botMessage.edit({
				content: '❌ Command timed out.',
				components: []
			})
		}
	}
}
