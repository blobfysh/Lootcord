module.exports = {
	name: 'getdonators',
	aliases: [],
	description: 'Get a list of all donators.',
	long: 'Get a list of all donators.',
	args: {},
	examples: [],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		try {
			const kofiList = []
			const patreonTier1List = []
			const patreonTier2List = []
			const patreonTier3List = []
			const patreonTier4List = []

			const kofiPatrons = await app.query('SELECT * FROM cooldown WHERE type = \'patron\'')

			// patreon patrons
			const tier1Patrons = await app.query('SELECT * FROM patrons WHERE tier = 1')
			const tier2Patrons = await app.query('SELECT * FROM patrons WHERE tier = 2')
			const tier3Patrons = await app.query('SELECT * FROM patrons WHERE tier = 3')
			const tier4Patrons = await app.query('SELECT * FROM patrons WHERE tier = 4')


			for (let i = 0; i < kofiPatrons.length; i++) {
				const user = await app.common.fetchUser(kofiPatrons[i].userId, { cacheIPC: false })

				kofiList.push(`${i + 1}. ${user.username}#${user.discriminator} (${user.id})`)
			}

			for (let i = 0; i < tier1Patrons.length; i++) {
				const user = await app.common.fetchUser(tier1Patrons[i].userId, { cacheIPC: false })

				patreonTier1List.push(`${i + 1}. ${user.username}#${user.discriminator} (${user.id})`)
			}

			for (let i = 0; i < tier2Patrons.length; i++) {
				const user = await app.common.fetchUser(tier2Patrons[i].userId, { cacheIPC: false })

				patreonTier2List.push(`${i + 1}. ${user.username}#${user.discriminator} (${user.id})`)
			}

			for (let i = 0; i < tier3Patrons.length; i++) {
				const user = await app.common.fetchUser(tier3Patrons[i].userId, { cacheIPC: false })

				patreonTier3List.push(`${i + 1}. ${user.username}#${user.discriminator} (${user.id})`)
			}

			for (let i = 0; i < tier4Patrons.length; i++) {
				const user = await app.common.fetchUser(tier4Patrons[i].userId, { cacheIPC: false })

				patreonTier4List.push(`${i + 1}. ${user.username}#${user.discriminator} (${user.id})`)
			}

			const modMsg = new app.Embed()
				.setAuthor('Donator list')
				.addField('Ko-fi Donators', `\`\`\`\n${kofiList.join('\n') || 'None'}\`\`\``)
				.addField('Patreon Tier 1 Donators', `\`\`\`\n${patreonTier1List.join('\n') || 'None'}\`\`\``)
				.addField('Patreon Tier 2 Donators', `\`\`\`\n${patreonTier2List.join('\n') || 'None'}\`\`\``)
				.addField('Patreon Tier 3 Donators', `\`\`\`\n${patreonTier3List.join('\n') || 'None'}\`\`\``)
				.addField('Patreon Tier 4 Donators', `\`\`\`\n${patreonTier4List.join('\n') || 'None'}\`\`\``)
				.setColor('#29ABE0')
			message.channel.createMessage(modMsg)
		}
		catch (err) {
			message.reply(`Error: \`\`\`\n${err}\`\`\``)
		}
	}
}
