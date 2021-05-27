const express = require('express')
const router = express.Router()
let client

function setClient (c) {
	client = c
}

router.post('/', (req, res) => {
	if (req.body.data) {
		client.sharder.sendTo(0, {
			_eventName: 'donation',
			data: req.body.data
		})
	}

	res.status(200).send('Success')
})

module.exports = {
	setClient,
	path: '/kofi',
	router
}
