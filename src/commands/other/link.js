exports.command = {
	name: 'link',
	aliases: ['invite'],
	description: 'Sends a link to invite the bot.',
	long: 'Sends a link to invite the bot.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	execute (app, message, { args, prefix, guildInfo }) {
		const invite = new app.Embed()
			.setDescription('You can invite Lootcord using this [link](https://discord.com/oauth2/authorize?client_id=493316754689359874&permissions=388160&scope=bot%20applications.commands \'Click to invite Lootcord\')!')
			.setColor('#ADADAD')

		message.channel.createMessage(invite)
	}
}
