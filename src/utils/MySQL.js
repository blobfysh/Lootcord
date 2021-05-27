const mysql = require('mysql')

class MySQL {
	constructor (config) {
		this.db = mysql.createPool({
			connectionLimit: 10,
			host: config.sql.host,
			user: config.sql.user,
			password: config.sql.password,
			database: config.sql.database,
			supportBigNumbers: true,
			bigNumberStrings: false,
			charset: 'utf8mb4'
		})
		/*
		this.db.on('acquire', connection => {
			console.log('[MYSQL] Used an existing connection from the pool')
		})
		this.db.on('release', connection => {
			console.log(`Connection ${connection.threadId} released`)
		})
		*/
		this.db.on('connection', connection => {
			console.log(`[MYSQL][${connection.threadId}] Created a new connection in the pool`)
		})
	}

	query (sql, args) {
		return new Promise((resolve, reject) => {
			// query automatically releases connection after finished
			this.db.query(sql, args, (err, rows) => {
				if (err) return reject(err)

				resolve(rows)
			})
		})
	}

	/**
	 * Begins a database transaction, returns methods to query and commit transaction
	 */
	beginTransaction () {
		return new Promise((resolve, reject) => {
			this.db.getConnection((conError, connection) => {
				if (conError) {
					return reject(conError)
				}

				connection.beginTransaction(transactionError => {
					if (transactionError) {
						connection.rollback(() => {
							connection.release()
							reject(transactionError)
						})
					}
					else {
						// transaction started successfully
						const query = (sql, args) => new Promise((resolveQuery, rejectQuery) => {
							connection.query(sql, args, (queryError, rows) => {
								if (queryError) {
									// there was an error processing query, rollback transaction and release
									connection.rollback(() => {
										connection.release()
										rejectQuery(queryError)
									})
								}
								else {
									resolveQuery(rows)
								}
							})
						})

						const commit = () => new Promise((resolveCommit, rejectCommit) => {
							connection.commit(err => {
								if (err) {
									// rollback transaction
									connection.rollback(() => {
										connection.release()
										rejectCommit(err)
									})
								}
								else {
									connection.release()
									resolveCommit('success')
								}
							})
						})

						resolve({ query, commit })
					}
				})
			})
		})
	}

	/**
     * Performs an escaped update, changing the column to value
     * @param {string} table
     * @param {string} column
     * @param {*} value
     * @param {string} conditionColumn
     * @param {*} conditionValue
     * @override
     */
	async update (table, column, value, conditionColumn, conditionValue) {
		let sql = 'UPDATE ?? SET ?? = ? WHERE ?? = ?'

		sql = mysql.format(sql, [table, column, value, conditionColumn, conditionValue])

		return this.query(sql)
	}

	/**
     * Performs an escaped update, increasing the column by value
     * @param {string} table
     * @param {string} column
     * @param {*} value
     * @param {string} conditionCol
     * @param {*} conditionVal
     */
	async updateIncr (table, column, value, conditionCol, conditionVal) {
		let sql = 'UPDATE ?? SET ?? = ?? + ? WHERE ?? = ?'

		sql = mysql.format(sql, [table, column, column, value, conditionCol, conditionVal])

		return this.query(sql)
	}

	/**
     * Performs an escaped update, decreasing the column by value
     * @param {string} table Table to update
     * @param {string} column Column to change
     * @param {*} value Value to subtract from column
     * @param {string} conditionCol Column to search for in WHERE clause
     * @param {*} conditionVal Value of column in WHERE clause
     */
	async updateDecr (table, column, value, conditionCol, conditionVal) {
		let sql = 'UPDATE ?? SET ?? = ?? - ? WHERE ?? = ?'

		sql = mysql.format(sql, [table, column, column, value, conditionCol, conditionVal])

		return this.query(sql)
	}

	/**
     * Performs an escaped select query.
     * @param {string} table The table to select from
     * @param {string} conditionCol The column to search condition for
     * @param {*} conditionVal The condition
     * @param {boolean} selectRows Whether or not to return multiple rows
     */
	async select (table, conditionCol, conditionVal, selectRows = false) {
		let sql = 'SELECT * FROM ?? WHERE ?? = ?'

		sql = mysql.format(sql, [table, conditionCol, conditionVal])

		return selectRows ? this.query(sql) : (await this.query(sql))[0]
	}
}

module.exports = MySQL
