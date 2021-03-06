exports.command = {
	name: 'mysettings',
	aliases: ['usersettings', 'settings'],
	description: 'View your settings and how to change them.',
	long: 'View your current settings and how to change them.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const userRow = await app.player.getRow(message.author.id, serverSideGuildId)
		const notifyBmStr = userRow.notify1 ? '(Disable with `togglebmnotify`)' : '(Enable with `togglebmnotify`)'
		const notifyDeathStr = userRow.notify2 ? '(Disable with `toggleattacknotify`)' : '(Enable with `toggleattacknotify`)'
		const notifyRaidedStr = userRow.notify3 ? '(Disable with `toggleraidnotify`)' : '(Enable with `toggleraidnotify`)'

		if (serverSideGuildId) {
			const settings = new app.Embed()
				.setAuthor(`Settings for: ${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
				.addField('Notify you when your clan is raided:', userRow.notify3 ? `✅ Enabled ${notifyRaidedStr}` : `❌ Disabled ${notifyRaidedStr}`)
				.addField('Display Badge', app.badgedata[userRow.badge] ? `${app.badgedata[userRow.badge].icon}\`${userRow.badge}\`` : '❌ Not set (Set with `setbadge <badge>`)')

			await message.channel.createMessage(settings)
		}
		else {
			const settings = new app.Embed()
				.setAuthor(`Settings for: ${message.author.username}#${message.author.discriminator}`, message.author.avatarURL)
				.addField('Notify you when your listing on the Black Market sells:', userRow.notify1 ? `✅ Enabled ${notifyBmStr}` : `❌ Disabled ${notifyBmStr}`)
				.addField('Notify you when you\'ve been attacked:', userRow.notify2 ? `✅ Enabled ${notifyDeathStr}` : `❌ Disabled ${notifyDeathStr}`)
				.addField('Notify you when your clan is raided:', userRow.notify3 ? `✅ Enabled ${notifyRaidedStr}` : `❌ Disabled ${notifyRaidedStr}`)
				.addField('Display Badge', app.badgedata[userRow.badge] ? `${app.badgedata[userRow.badge].icon}\`${userRow.badge}\`` : '❌ Not set (Set with `setbadge <badge>`)')

			await message.channel.createMessage(settings)
		}
	}
}
