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

    /**
     * Returns an icon based on how much health player has
     * @param {number} curHP Player's current health
     * @param {number} maxHP Player's maximum health
     */
    getHealthIcon(curHP, maxHP){
        let hpPerc = curHP / maxHP;

        if(hpPerc >= .75){
            return this.app.icons.health.full;
        }
        else if(hpPerc >= .5){
            return this.app.icons.health.percent_75;
        }
        else if(hpPerc >= .25){
            return this.app.icons.health.percent_50;
        }
        else if(hpPerc >= .1){
            return this.app.icons.health.percent_25;
        }
        else{
            return this.app.icons.health.empty;
        }
    }

    /**
     * Checks if players has the amount specified
     * @param {string} id ID of player to check
     * @param {number} amount Amount of money to check
     */
    async hasMoney(id, amount){
        let row = await this.getRow(id);
        
        if(row.money >= amount){
            return true;
        }
        else{
            return false;
        }
    }

    /**
     * 
     * @param {string} id ID of player to remove from
     * @param {number} amount Amount to remove
     */
    async removeMoney(id, amount){
        await this.app.query(`UPDATE scores SET money = money - ${parseInt(amount)} WHERE userId = ${id}`);
    }

    /**
     * 
     * @param {*} id ID of user to add money to.
     * @param {*} amount Amount of money to add.
     */
    async addMoney(id, amount){
        await this.app.query(`UPDATE scores SET money = money + ${parseInt(amount)} WHERE userId = ${id}`);
    }

    /**
     * 
     * @param {*} id ID of user to add xp to.
     * @param {*} amount Amount of xp to add.
     */
    async addPoints(id, amount){
        await this.app.query(`UPDATE scores SET points = points + ${parseInt(amount)} WHERE userId = ${id}`);
    }

    /**
     * 
     * @param {string} badge Badge to get icon for
     */
    getBadge(badge){
        let badgeInfo = this.app.badgedata[badge];

        if(badgeInfo){
            return badgeInfo.icon
        }
        else return '';
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