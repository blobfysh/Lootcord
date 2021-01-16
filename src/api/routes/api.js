const fs = require('fs')
const path = require('path')
const express = require('express')
const router = express.Router()

const categories = fs.readdirSync(path.join(__dirname, '/../../commands'))
const ranged = require('../../resources/items/ranged')
const melee = require('../../resources/items/melee')
const items = require('../../resources/items/items')
const ammo = require('../../resources/items/ammo')
const materials = require('../../resources/items/materials')
const storage = require('../../resources/items/storage')
const banners = require('../../resources/items/banners')

let client

function setClient(c) {
	client = c
}

router.post('/searchbm', async(req, res) => {
	if (req.headers.authorization !== client.config.apiAuth) return res.status(401).send('Unauthorized')

	const listings = await client.mysql.query('SELECT * FROM blackmarket WHERE itemName = ? ORDER BY pricePer ASC LIMIT 50', [req.body.input])

	res.status(200).send(listings)
})

router.post('/leaderboard', async(req, res) => {
	if (req.headers.authorization !== client.config.apiAuth) return res.status(401).send('Unauthorized')

	const leaderboard = await client.cache.get('leaderboard')

	if (!leaderboard) return res.status(200).send(undefined)

	res.status(200).send(JSON.parse(leaderboard).leadersOBJ)
})

router.post('/patrons', async(req, res) => {
	if (req.headers.authorization !== client.config.apiAuth) return res.status(401).send('Unauthorized')

	const patrons = await client.cache.get('patronsCache')

	if (!patrons) return res.status(200).send(undefined)

	res.status(200).send(JSON.parse(patrons))
})

router.post('/commands', async(req, res) => {
	if (req.headers.authorization !== client.config.apiAuth) return res.status(401).send('Unauthorized')

	const commandInfo = []

	function getUsage(command) {
		let finalStr = `t-${command.name}`

		for (const arg of Object.keys(command.args)) {
			finalStr += ` <${arg}>`
		}

		return finalStr
	}

	for (const category of categories) {
		const commandFiles = fs.readdirSync(path.join(__dirname, `/../../commands/${category}`)).filter(file => file.endsWith('.js'))

		for (const file of commandFiles) {
			const command = require(`../../commands/${category}/${file}`)

			commandInfo.push({
				command: command.name,
				patronOnly: !!command.premiumCmd,
				shortDesc: command.description,
				category,
				usage: getUsage(command)
			})
		}
	}

	res.status(200).json(commandInfo)
})


router.post('/items', async(req, res) => {
	if (req.headers.authorization !== client.config.apiAuth) return res.status(401).send('Unauthorized')

	res.status(200).json({
		...ranged,
		...melee,
		...items,
		...ammo,
		...materials,
		...storage,
		...banners
	})
})

router.get('/bans', async(req, res) => {
	if (req.headers.authorization !== client.config.apiAuth) return res.status(401).send('Unauthorized')

	const bannedUsers = await client.mysql.query('SELECT * FROM banned')

	res.status(200).json(bannedUsers)
})

router.get('/tradebans', async(req, res) => {
	if (req.headers.authorization !== client.config.apiAuth) return res.status(401).send('Unauthorized')

	const bannedUsers = await client.mysql.query('SELECT * FROM tradebanned')

	res.status(200).json(bannedUsers)
})

router.get('/guildbans', async(req, res) => {
	if (req.headers.authorization !== client.config.apiAuth) return res.status(401).send('Unauthorized')

	const bannedGuilds = await client.mysql.query('SELECT * FROM bannedguilds')

	res.status(200).json(bannedGuilds)
})

module.exports = {
	setClient,
	path: '/api',
	router
}
