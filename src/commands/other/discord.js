exports.command = {
	name: 'discord',
	aliases: ['disc', 'support', 'server'],
	description: 'Sends a link to the Lootcord server.',
	long: 'Sends a link to the official Lootcord Discord Server.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	execute (app, message, { args, prefix, guildInfo }) {
		message.channel.createMessage('Come join the discord server! Suggest new ideas, submit bug reports, join giveaways, get an exclusive first look at updates on the LootDev bot,\n\nor just chill and play Lootcord with everyone 😃\nhttps://discord.gg/apKSxuE')
	}
}
