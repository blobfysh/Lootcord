exports.command = {
	name: 'serversettings',
	aliases: ['guildsettings'],
	description: 'View the servers settings and how to change them.',
	long: 'View current settings for the server and see how to change them.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const killfeedStr = message.channel.guild.channels.get(guildInfo.killChan) ? '(Disable with `togglekillfeed`)' : '(Set with `togglekillfeed`)'
		const lvlChanStr = message.channel.guild.channels.get(guildInfo.levelChan) ? '(Disable with `togglelevelchannel`)' : '(Set with `togglelevelchannel`)'

		const settings = new app.Embed()
			.setTitle(`Settings for: ${message.channel.guild.name}`)
			.setDescription('Changing these settings requires that you have the `Manage Server` permission.')
			.addField('Prefix\n(Change with `setprefix`)', prefix)
			.addField(`Killfeed Channel\n${killfeedStr}`, message.channel.guild.channels.get(guildInfo.killChan) ? message.channel.guild.channels.get(guildInfo.killChan).mention : 'None set')
			.addField(`Level-up Channel\n${lvlChanStr}`, message.channel.guild.channels.get(guildInfo.levelChan) ? message.channel.guild.channels.get(guildInfo.levelChan).mention : 'None set')
			.addField('Attack Mode\n(Change with `togglerandomattacks`)', guildInfo.randomOnly ? 'Random only' : 'Selectable')
			.addField('Server-side Economy Mode\n(Change with `toggleservereconomy`)', guildInfo.serverOnly ? 'Enabled' : 'Disabled (global economy mode)')

		if (serverSideGuildId) {
			settings.addField('Clans\n(Enable/disable with `toggleclans`)', guildInfo.clansDisabled ? 'Disabled' : 'Enabled')
		}

		if (message.channel.guild.iconURL) {
			settings.setThumbnail(message.channel.guild.iconURL)
		}

		await message.channel.createMessage(settings)
	}
}
