const BADGES_PER_PAGE = 9

exports.command = {
	name: 'badges',
	aliases: ['badge'],
	description: 'Shows all badges and how to obtain them.',
	long: 'Shows all badges and how to obtain them.',
	args: {},
	examples: [],
	permissions: ['sendMessages', 'embedLinks', 'externalEmojis'],
	ignoreHelp: false,
	requiresAcc: false,
	requiresActive: false,
	guildModsOnly: false,
	worksInDMs: true,

	async execute (app, message, { args, prefix, guildInfo }) {
		const badgeList = Object.keys(app.badgedata)

		if (badgeList.length > BADGES_PER_PAGE) {
			return app.btnCollector.paginate(message, generatePages(app, Object.keys(app.badgedata).sort(), BADGES_PER_PAGE))
		}

		await message.channel.createMessage(generatePages(app, badgeList, BADGES_PER_PAGE)[0])
	}
}

function generatePages (app, badges, itemsPerPage) {
	const pages = []
	const maxPage = Math.ceil(badges.length / itemsPerPage)

	for (let i = 1; i < maxPage + 1; i++) {
		const indexFirst = (itemsPerPage * i) - itemsPerPage
		const indexLast = itemsPerPage * i
		const filteredBadges = badges.slice(indexFirst, indexLast)

		const pageEmbed = new app.Embed()
			.setTitle('Badge List')
			.setDescription('You can view the badges you own by checking your `profile`. You can set a display badge using `setbadge` to have it show next to your name on some commands.')
			.setFooter('Use badge <badge> to see more information about a badge.')
			.setColor(13451564)

		for (const badge of filteredBadges.sort()) {
			pageEmbed.addField(`${app.badgedata[badge].icon}\`${badge}\``, app.badgedata[badge].description, true)
		}

		pages.push(pageEmbed)
	}

	return pages
}
