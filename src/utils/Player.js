class Player {
    constructor(app){
        this.app = app;
    }

    /**
     * 
     * @param {string} id ID to check if account exists
     */
    async hasAccount(id){
        if(await this.getRow(id)) return true;
        
        return false;
    }

    /**
     * 
     * @param {string} id ID of player to get information for
     */
    async getRow(id){
        return (await this.app.query(`SELECT * FROM scores WHERE userId ="${id}"`))[0];
    }

    async createAccount(id){
        await this.app.query(insertScoreSQL, [id, (new Date()).getTime(), 100, 1, 100, 100, 1.00, 'none', 'none', 'none', 'none']);
        await this.app.itm.addItem(id, 'item_box', 1);
    }

    /**
     * 
     * @param {string} id ID of player to activate
     * @param {string} guild ID of guild to activate player in
     */
    async activate(id, guild){
        await this.app.query(`INSERT INTO userGuilds (userId, guildId) VALUES (${id}, ${guild})`);

        // check if guildInfo table has guild
        if(!(await this.app.query(`SELECT * FROM guildInfo WHERE guildId = ${guild}`)).length){
            await this.app.query(`INSERT IGNORE INTO guildInfo (guildId, killChan, levelChan, dropChan, dropItemChan, dropItem, randomOnly) VALUES (${guild}, 0, 0, 0, 0, '', 0)`);
        }
    }

    /**
     * 
     * @param {string} id ID of user to deactivate
     * @param {string} guild ID of guild to deactivate user from
     * @param {{addCD: boolean}} options addCD will give user a deactivate cooldown
     */
    async deactivate(id, guild, options = { addCD: false }){
        if(options.addCD){
            // needed to make cooldown an option because if user leaves server to deactivate the timers could overlap.
            //TODO make option to clear deactivate cd and add new one?
            await this.app.cd.setCD(id, 'deactivate', 86400 * 1000);
        }

        // delete user from server
        await this.app.query(`DELETE FROM userGuilds WHERE userId = ${id} AND guildId = ${guild}`);
    }

    /**
     * 
     * @param {string} id ID of user to check
     * @param {string} guild Guild to check if user is active in
     */
    async isActive(id, guild){
        if((await this.app.query(`SELECT * FROM userGuilds WHERE userId = ${id} AND guildId = ${guild}`)).length){
            return true;
        }
        
        return false;
    }
}

const insertScoreSQL = `
INSERT IGNORE INTO scores (
    userId,
    createdAt,
    money,
    level,
    health,
    maxHealth,
    scaledDamage,
    backpack,
    armor,
    ammo,
    badge,
    inv_slots,
    points,
    kills,
    deaths,
    stats,
    luck,
    used_stats,
    status,
    banner,
    language,
    voteCounter,
    power,
    max_power,
    clanId,
    clanRank,
    lastActive,
    notify1,
    notify2,
    notify3,
    prestige)
    VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        0, 0, 0, 0, 0, 0, 0, '', 'recruit', 'en-us', 
        0, 5, 5, 0, 0, NOW(), 0, 0, 0, 0
    )
`

module.exports = Player;