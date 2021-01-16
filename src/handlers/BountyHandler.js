class BountyHandler {
	constructor(app) {
		this.app = app
	}

	/**
	 *
	 * @param {string} placedBy ID of user placing bounty
	 * @param {string} userId ID of user to place bounty on
	 * @param {number} money Amount of money
	 */
	async addBounty(placedBy, userId, money) {
		await this.app.query('INSERT INTO bounties (userId, placedBy, money) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE money = money + ?',
			[userId, placedBy, money, money])
	}

	/**
	 * Removes bounties from player.
	 * @param {string} userId
	 * @param {boolean} reimburse Whether or not to give money back to people who placed bounty
	 */
	async removeBounties(userId, reimburse = true) {
		if (reimburse) {
			await this.app.query('UPDATE scores INNER JOIN bounties ON bounties.placedBy = scores.userId SET scores.money = scores.money + bounties.money WHERE bounties.userId = ?',
				[userId])
		}

		await this.app.query('DELETE FROM bounties WHERE userId = ?',
			[userId])
	}

	async getBounty(userId) {
		const bounty = await this.app.query('SELECT SUM(money) AS hit FROM bounties WHERE userId = ?', [userId])

		return bounty[0].hit || 0
	}

	async getPlacedBounties(userId) {
		const bounties = await this.app.query('SELECT * FROM bounties WHERE placedBy = ?', [userId])

		return bounties
	}

	/**
	 * Gives everyone who placed an active bounty their money back and removes all existing bounties.
	 */
	async reimburseAll() {
		await this.app.query('UPDATE scores INNER JOIN ( SELECT placedBy, SUM(money) as total FROM bounties GROUP BY placedBy ) b ON b.placedBy = scores.userId SET scores.money = scores.money + b.total')
		await this.app.query('DELETE FROM bounties')
	}
}

module.exports = BountyHandler
