const Filter = require('bad-words')
const { BUTTONS } = require('../../../resources/constants')
const { reply } = require('../../../utils/messageUtils')
const filter = new Filter()
const CREATION_COST = 10000

exports.command = {
	name: 'create',
	aliases: [],
	description: 'Create a clan.',
	long: 'Create a clan. Costs 10,000 scrap.',
	args: { name: 'Desired name of your clan.' },
	examples: [],
	requiresClan: false,
	requiresActive: true,
	minimumRank: 0,

	async execute (app, message, { args, prefix, guildInfo, serverSideGuildId }) {
		const scoreRow = await app.player.getRow(message.author.id, serverSideGuildId)
		const clanName = args.join(' ')

		if (!args.length) {
			return reply(message, 'Please specify a clan tag.')
		}
		else if (Math.floor((message.author.id / 4194304) + 1420070400000) > Date.now() - (30 * 24 * 60 * 60 * 1000)) {
			return reply(message, '❌ Your Discord account must be at least 30 days old to create a clan! This helps us prevent alt abuse. 😭')
		}
		else if (scoreRow.clanId !== 0) {
			return reply(message, '❌ You are already in a clan!')
		}
		else if (!/^[a-zA-Z0-9 ]+$/.test(clanName)) {
			return reply(message, '❌ Special characters are not supported in clan tags. Supported: Alphanumeric characters and space')
		}
		else if (clanName.length < 4 || clanName.length > 20) {
			return reply(message, `Clan tags must be at least 4 characters long up to a max of 20 characters. The one you entered is ${clanName.length} characters.`)
		}
		else if (filter.isProfane(clanName)) {
			return reply(message, '❌ The clan tag you are trying to use contains innappropiate language. **Vulgar clan tags will not be tolerated.**')
		}

		const clanRow = await app.clans.searchClanRow(clanName, serverSideGuildId)

		if (clanRow) {
			return reply(message, '❌ A clan with that tag already exists!')
		}
		else if (scoreRow.money < CREATION_COST) {
			return reply(message, `❌ You need at least ${app.common.formatNumber(CREATION_COST)} to create a clan! You only have ${app.common.formatNumber(scoreRow.money)}.\n\nCome back when you've racked up some more money...`)
		}

		const botMessage = await message.channel.createMessage({
			content: `**📤 Cost: ${app.common.formatNumber(CREATION_COST)}**\n\nCreate clan with the tag: \`${clanName}\`?`,
			components: BUTTONS.confirmation
		})

		try {
			const confirmed = (await app.btnCollector.awaitClicks(botMessage.id, i => i.user.id === message.author.id))[0]

			if (confirmed.customID === 'confirmed') {
				const transaction = await app.mysql.beginTransaction()
				const scoreRow2 = await app.player.getRowForUpdate(transaction.query, message.author.id, serverSideGuildId)
				const clanRow2 = await app.clans.searchClanRow(clanName, serverSideGuildId)

				if (scoreRow2.clanId !== 0) {
					await transaction.commit()

					return confirmed.respond({
						content: '❌ You are already in a clan!',
						components: []
					})
				}
				else if (scoreRow2.money < CREATION_COST) {
					await transaction.commit()

					return confirmed.respond({
						content: `❌ You need at least ${app.common.formatNumber(CREATION_COST)} to create a clan! You only have ${app.common.formatNumber(scoreRow2.money)}.\n\nCome back when you've racked up some more money...`,
						components: []
					})
				}
				else if (clanRow2) {
					await transaction.commit()

					return confirmed.respond({
						content: '❌ A clan with that tag already exists!',
						components: []
					})
				}

				let clanID

				await app.player.removeMoneySafely(transaction.query, message.author.id, CREATION_COST, serverSideGuildId)

				if (serverSideGuildId) {
					await transaction.query(insertServerClanSQL, [message.channel.guild.id, clanName, message.author.id, Date.now()])

					clanID = (await transaction.query('SELECT clanId FROM server_clans WHERE ownerId = ? AND guildId = ?', [message.author.id, message.channel.guild.id]))[0].clanId

					await transaction.query('UPDATE server_scores SET clanId = ?, clanRank = 4 WHERE userId = ? AND guildId = ?', [clanID, message.author.id, message.channel.guild.id])
				}
				else {
					await transaction.query(insertClansSQL, [clanName, message.author.id, Date.now()])

					clanID = (await transaction.query('SELECT clanId FROM clans WHERE ownerId = ?', [message.author.id]))[0].clanId

					await transaction.query('UPDATE scores SET clanId = ?, clanRank = 4 WHERE userId = ?', [clanID, message.author.id])
				}

				await transaction.commit()

				await confirmed.respond({
					content: `Congratulations! You are now the proud leader of the \`${clanName}\` clan!\n\nView your clan information with \`${prefix}clan info\` and check the inventory with \`${prefix}clan inv\`.`,
					components: []
				})
			}
			else {
				botMessage.delete()
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

const insertServerClanSQL = `
INSERT IGNORE INTO server_clans (
	guildId,
    name,
    ownerId,
    money,
    status,
    iconURL,
    clanCreated,
    clanViews)
    VALUES (
        ?, ?, ?,
        0, '', '',
        ?, 0
    )
`

const insertClansSQL = `
INSERT IGNORE INTO clans (
    name,
    ownerId,
    money,
    status,
    iconURL,
    clanCreated,
    clanViews)
    VALUES (
        ?, ?,
        0, '', '',
        ?, 0
    )
`
