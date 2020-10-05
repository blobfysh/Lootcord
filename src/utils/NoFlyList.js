const axios = require('axios')

class NoFlyList {
	constructor(config) {
		this.token = config.nflToken
	}

	/**
     * Get a list of blacklisted users
     * @returns {Promise} Array of objects containing blacklist information
     */
	getList() {
		return new Promise((resolve, reject) => {
			axios({
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.token}`
				},
				url: 'https://dice.jonah.pw/nfl/blacklist'
			}).then(result => {
				resolve(result.data)
			}).catch(err => {
				console.log('ERROR!')
				reject(err)
			})
		})
	}

	/**
     * Get blacklist information for a user
     * @param {string} id ID of user to get blacklist information for
     * @returns {Promise} Object containing user blacklist information or undefined if no user was found
     */
	getUser(id) {
		return new Promise((resolve, reject) => {
			axios({
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.token}`
				},
				url: `https://dice.jonah.pw/nfl/blacklist/${id}`
			}).then(result => {
				resolve(result.data)
			}).catch(err => {
				reject(err)
			})
		})
	}
}

module.exports = NoFlyList
