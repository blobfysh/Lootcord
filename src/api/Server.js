const express = require('express')
const bodyParser = require('body-parser')

const fs = require('fs')
const path = require('path')

const routes = fs.readdirSync(path.join(__dirname, '/routes'))

class Server {
	constructor(sharder, mysql, cache, config) {
		this.sharder = sharder
		this.mysql = mysql
		this.cache = cache
		this.config = config
		this.server = express()
	}

	launch() {
		this.server.use(bodyParser.json())
		this.server.use(bodyParser.urlencoded({ extended: false }))

		for (const file of routes) {
			const route = require(`./routes/${file}`)

			route.setClient(this)

			this.server.use(route.path, route.router)
		}

		this.server.listen(this.config.serverPort, () => {
			console.log(`[SERVER] Server running on port ${this.config.serverPort}`)
		})
	}
}

module.exports = Server
