exports.command = {
	name: 'donate',
	aliases: ['patreon'],
	description: 'Help support the bot!',
	long: '[Help support the development of Lootcord and get some cool rewards!](https://www.patreon.com/bePatron?u=14199989)',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute (app, message, { args, prefix, guildInfo }) {
		if (!await app.patreonHandler.isPatron(message.author.id)) {
			return message.channel.createMessage(`**Help support the development of Lootcord!** Become a patron and get some cool rewards like:
            \n- **Access to the spawn system.** Team up to fight enemies that can spawn in a channel of your choice (you can see this in action on the official server). Enemies include a helicopter, scientists, a tank, and more!\n- **Reduced global spam cooldown** from 3 seconds to 1 second.\n- An animated ${app.itemdata.patron.icon}\`patron\` banner to show off your support.\n- A role in the official Discord server.\n- Supporting the development of the bot!
            \nhttps://www.patreon.com/lootcord`)
		}

		const spawnsInfo = await app.mysql.select('spawnchannels', 'userId', message.author.id, true)
		const activeSpawnChannels = []

		for (let i = 0; i < spawnsInfo.length; i++) {
			activeSpawnChannels.push(`${i + 1}. <#${spawnsInfo[i].channelId}>`)
		}

		const donateEmb = new app.Embed()
			.setAuthor('Thank you!', message.author.avatarURL)
			.addField('Patron Status', 'active 😃')
			.addField(`Active Enemy Spawn Channels (${activeSpawnChannels.length})`, activeSpawnChannels.join('\n') || 'None')
			.addField('How do I claim my weekly reward?', `Use \`${prefix}weekly\` to claim your ${app.itemdata.supply_drop.icon}\`supply_drop\` every week!`)
			.addField('How do I use the enemy spawn system?', 'Spawn enemies in a channel using the `enablespawns` command.' +
        '\n\nTo stop all active enemy spawns use `disablespawns`.' +
        '\n\nOnce an enemy has spawned, you or anyone in the server can use the `enemy` command to view the enemy and fight it!' +
        '\n\n*Enemies spawn every 8 - 12 hours, they will then stay until defeated or until their time runs out.*')
			.setColor('#f96854')
		message.channel.createMessage(donateEmb)
	}
}
