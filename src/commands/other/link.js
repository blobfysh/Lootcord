module.exports = {
	name: 'link',
	aliases: ['invite'],
	description: 'Sends a link to invite the bot.',
	long: 'Sends a link to invite the bot.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	execute(app, message, { args, prefix, guildInfo }) {
		const invite = new app.Embed()
			.setDescription('You can invite Lootcord using this [link](https://discord.com/oauth2/authorize?client_id=493316754689359874&permissions=388160&scope=bot%20applications.commands \'Click to invite Lootcord\')!' +
			'\n\nAlso check out [Lootcord Monthly](https://discord.com/oauth2/authorize?client_id=755926417954308106&permissions=388160&scope=bot%20applications.commands \'Click to invite Lootcord Monthly\'), a new version of Lootcord that wipes items/money at the start of each month.')
			.setColor(13451564)

		message.channel.createMessage(invite)
	}
}
