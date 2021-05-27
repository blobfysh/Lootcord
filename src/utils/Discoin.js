const axios = require('axios')

class Discoin {
	constructor (config) {
		this.token = config.discoinToken
	}

	request (userId, exchAmount, currencyType) {
		return new Promise((resolve, reject) => {
			axios({
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.token}`
				},
				data: {
					user: userId,
					amount: exchAmount,
					to: currencyType,
					from: 'LCN',
					handled: false
				},
				url: 'https://discoin.zws.im/transactions'
			}).then(result => {
				if (result.status !== 201) reject(result)

				resolve(result)
			}).catch(err => {
				reject(err)
			})
		})
	}

	handle (transId) {
		return new Promise((resolve, reject) => {
			axios({
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${this.token}`
				},
				data: {
					handled: true
				},
				url: `https://discoin.zws.im/transactions/${transId}`
			}).then(result => {
				if (result.status !== 200) reject(new Error('Discoin API error'))

				resolve(result)
			}).catch(err => {
				reject(err)
			})
		})
	}

	getUnhandled () {
		return new Promise((resolve, reject) => {
			axios({
				method: 'GET',
				url: 'https://discoin.zws.im/transactions?s=%7B%22to.id%22%3A%20%22LCN%22%2C%20%22handled%22%3A%20false%7D'
			}).then(result => {
				resolve(result)
			}).catch(err => {
				reject(err)
			})
		})
	}

	getCurrencies () {
		return new Promise((resolve, reject) => {
			axios({
				method: 'GET',
				url: 'https://discoin.zws.im/currencies'
			}).then(result => {
				const currenciesArr = []

				for (let i = 0; i < result.data.length; i++) {
					currenciesArr.push(result.data[i].id)
				}

				resolve(currenciesArr)
			}).catch(err => {
				reject(err)
			})
		})
	}
}

module.exports = Discoin
