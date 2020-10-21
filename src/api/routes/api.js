const express = require('express')
const router = express.Router()
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

module.exports = {
	setClient,
	path: '/api',
	router
}
