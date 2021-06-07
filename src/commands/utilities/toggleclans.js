const { BUTTONS } = require('../../resources/constants')
const { reply } = require('../../utils/messageUtils')

exports.command = {
	name: 'toggleclans',
	aliases: [],
	description: 'Toggles whether or not clan commands can be used. Can only be used if server-side economy mode is enabled.',
	long: 'Toggles whether or not clan commands can be used. Can only be used if server-side economy mode is enabled.\n\nUser **MUST** have the Manage Server permission.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	serverEconomyOnly: true,
	guildModsOnly: true,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const botMessage = await reply(message, {
			content: `Are you sure you want to **${guildInfo.clansDisabled ? 'enable' : 'disable'}** clans?`,
			components: BUTTONS.confirmation
		})

		try {
			const result = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (result.customID === 'confirmed') {
				if (guildInfo.clansDisabled === 0) {
					await app.query('UPDATE guildinfo SET clansDisabled = 1 WHERE guildId = ?', [message.channel.guild.id])
				}
				else {
					await app.query('UPDATE guildinfo SET clansDisabled = 0 WHERE guildId = ?', [message.channel.guild.id])
				}

				await result.respond({
					content: `✅ Clans have been **${guildInfo.clansDisabled === 0 ? 'disabled' : 'enabled'}**!`,
					components: []
				})
			}
			else {
				await botMessage.delete()
			}
		}
		catch (err) {
			await botMessage.edit({
				content: '❌ Command timed out.',
				components: []
			})
		}
	}
}
