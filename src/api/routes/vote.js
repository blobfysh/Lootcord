const express = require('express')
const router = express.Router()
let client

function setClient(c) {
	client = c
}

router.post('/topgg', (req, res) => {
	if (req.headers.authorization !== client.config.apiAuth) return res.status(401).send('Unauthorized')

	if (req.body.user) {
		client.sharder.sendTo(0, {
			_eventName: 'vote',
			vote: req.body,
			type: 'topgg'
		})
	}

	res.status(200).send('Successfully received vote!')
})

router.post('/dbl', (req, res) => {
	if (!req.headers['x-dbl-signature'] || req.headers['x-dbl-signature'].split(' ')[0] !== client.config.apiAuth) return res.status(401).send('Unauthorized')

	if (req.body.id) {
		client.sharder.sendTo(0, {
			_eventName: 'vote',
			vote: {
				user: req.body.id
			},
			type: 'dbl'
		})
	}

	res.status(200).send('Successfully received vote!')
})

module.exports = {
	setClient,
	path: '/vote',
	router
}
