const Jimp = require('jimp');

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

    /**
     * 
     * @param {*} message Message of player to check level up for.
     */
    async checkLevelXP(message, row){
        try{
            let xp = this.app.common.calculateXP(row.points, row.level);

            if(row.points >= xp.totalNeeded) {

                console.log(row.points + ' is greater than ' + xp.totalNeeded)
                let levelItem = "";

                await this.app.query(`UPDATE scores SET points = points + 1, level = level + 1 WHERE userId = ${message.author.id}`);

                if((row.level + 1) > 15){
                    levelItem = `${this.app.itemdata['supply_signal'].icon}\`supply_signal\``;
                    await this.app.itm.addItem(message.author.id, 'supply_signal', 1);
                }
                else if((row.level + 1) > 10){
                    levelItem = `2x ${this.app.itemdata['ultra_box'].icon}\`ultra_box\``;
                    await this.app.itm.addItem(message.author.id, 'ultra_box', 2);
                }
                else if((row.level + 1) > 5){
                    levelItem = `${this.app.itemdata['ultra_box'].icon}\`ultra_box\``;
                    await this.app.itm.addItem(message.author.id, 'ultra_box', 1);
                }
                else{
                    levelItem = `2x ${this.app.itemdata['item_box'].icon}\`item_box\``;
                    await this.app.itm.addItem(message.author.id, 'item_box', 2);
                }

                // ignore bot list discords
                if(this.app.config.botListDiscords.includes(message.guild.id)) return;

                const guildRow = (await this.app.query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`))[0];
                
                try{
                    const lvlUpImage = await this.getLevelImage(message.author.username, message.author.avatarURL, row.level + 1);
                    
                    if(guildRow.levelChan !== undefined && guildRow.levelChan !== "" && guildRow.levelChan !== 0){
                        try{
                            await this.app.bot.createMessage(guildRow.levelChan, {
                                content: `<@${message.author.id}>,\nLEVEL **${row.level + 1}!**\n\n**Item received!** ${levelItem}`
                            }, {
                                file: lvlUpImage,
                                name: 'userLvl.jpeg'
                            });
                        }
                        catch(err){
                            // level channel not found
                            console.warn('Could not find level channel.');
                        }
                    }
                    else{
                        message.channel.createMessage({
                            content: `<@${message.author.id}>,\n**LEVEL UP!**\n\n**Item received!** ${levelItem}`
                        }, {
                            file: lvlUpImage,
                            name: 'userLvl.jpeg'
                        });
                    }
                }
                catch(err){
                    console.log(require('util').inspect(err));
                    // error creating level up image
                }
            }
        }
        catch(err){
            console.log(require('util').inspect(err));
        }
    }

    async getLevelImage(name, playerImage, level){
        const image = await Jimp.read('./src/resources/images/LvlUp2.png');
        const avatar = await Jimp.read(playerImage);
        const largeFont = await Jimp.loadFont('./src/resources/fonts/BebasNeue37.fnt');
        const smallFont = await Jimp.loadFont('./src/resources/fonts/BebasNeue25.fnt');
        image.quality(70);
        avatar.resize(64, 64);

        image.print(largeFont, 0, 0, {
            text: "lvl " + level,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
        }, 128, 144);
        
        image.print(smallFont, 0, 0, {
            text: name.substring(0, 13),
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_TOP
        }, 128, 144);

        image.composite(avatar, 32, 32);

        return new Promise((resolve, reject) => {
            image.getBuffer(Jimp.AUTO, (err, buffer) => {
                if(err) reject(new Error(err));

                resolve(buffer);
            });
        });
        
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