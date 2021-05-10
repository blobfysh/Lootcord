exports.command = {
	name: 'level',
	aliases: ['lvl'],
	description: 'Displays level.',
	long: 'Displays your level along with your current scaled damage.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis', 'attachFiles'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute(app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		try {
			const row = await app.player.getRow(message.author.id, serverSideGuildId)
			const xp = app.common.calculateXP(row.points, row.level)
			const craftableItems = Object.keys(app.itemdata).filter(item => app.itemdata[item].craftedWith !== '' && app.itemdata[item].craftedWith.level === row.level + 1)
			craftableItems.sort(app.itm.sortItemsHighLow.bind(app))

			const recipes = craftableItems.length ?
				`\n\nCrafting recipes you'll unlock next level:\n${craftableItems.map(item => `${app.itemdata[item].icon}\`${item}\``).join('\n')}` :
				''

			message.channel.createMessage({
				content: `Your current level is **${row.level}** (XP: **${xp.curLvlXp} / ${xp.neededForLvl}**)${recipes}`
			}, {
				file: await app.player.getLevelImage(message.author.avatarURL, row.level),
				name: 'userLvl.jpeg'
			})
		}
		catch (err) {
			console.log(err)
			message.reply('There was an error creating your level image! woops...')
		}
	}
}
