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
        return (await this.app.query(`SELECT * FROM scores WHERE userId = ? AND userId > 0`, [id]))[0];
    }

    async createAccount(id){
        await this.app.query(insertScoreSQL, [id, (new Date()).getTime(), 100, 1, 100, 100, 1.00, 'none', 'none', 'none', 'none']);
        await this.app.itm.addItem(id, 'item_box', 1);
        
        const newPlayer = new this.app.Embed()
        .setTitle('Thanks for joining Lootcord!')
        .setColor(13215302)
        .setDescription('Make sure to follow the [rules](https://lootcord.com/rules)!\n\nSupport server: https://discord.gg/apKSxuE\n\nFor more on using the bot check this [link](https://github.com/blobfysh/Lootcord/wiki)')
        .addField("Items Received", this.app.icons.plus + "1x " + this.app.itemdata['item_box'].icon + "`item_box`")
        .addField("Getting Started", `Open your ${this.app.itemdata['item_box'].icon}\`item_box\` by **using** it: \`t-use item_box\`\nYou can see every item you own with the \`inv\` command.\n\nAttack other players by **using** a weapon on them: \`t-use rock @user\`\n\nVarious stats are displayed on your \`profile\`!\n\n**Good luck and HAPPY LOOTING**`)
        .setFooter("This message will only be sent the first time your account is created.")
        this.app.common.messageUser(id, newPlayer)
    }

    /**
     * 
     * @param {string} id ID of player to activate
     * @param {string} guild ID of guild to activate player in
     */
    async activate(id, guild){
        await this.app.query(`INSERT INTO userGuilds (userId, guildId) VALUES (${id}, ${guild})`);
    }

    /**
     * 
     * @param {string} id ID of user to deactivate
     * @param {string} guild ID of guild to deactivate user from
     */
    async deactivate(id, guild){
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
    getHealthIcon(curHP, maxHP, nextLine = false){
        let numHearts = Math.ceil(maxHP / 25);
        let hpStr = '';

        for(let i = 0; i < numHearts; i++){
            let hpPerc = curHP / 25;

            // add new line of hearts every 5 hearts
            if(nextLine && i % 5 == 0) hpStr += '\n';

            if(hpPerc >= 1){
                hpStr += this.app.icons.health.full

                curHP -= 25;
            }
            else if(hpPerc > 0){
                if(hpPerc >= .66){
                    hpStr += this.app.icons.health.percent_75;
                }
                else if(hpPerc >= .33){
                    hpStr += this.app.icons.health.percent_50;
                }
                else{
                    hpStr += this.app.icons.health.percent_25;
                }

                curHP = 0;
            }
            else{
                hpStr += this.app.icons.health.empty;
            }
        }

        return hpStr;
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

        this.app.query(insertTransaction, [id, 0, amount]);
    }

    /**
     * 
     * @param {*} id ID of user to add money to.
     * @param {*} amount Amount of money to add.
     */
    async addMoney(id, amount){
        await this.app.query(`UPDATE scores SET money = money + ${parseInt(amount)} WHERE userId = ${id}`);
        
        this.app.query(insertTransaction, [id, amount, 0]);
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
                    levelItem = `1x ${this.app.itemdata['item_box'].icon}\`item_box\``;
                    await this.app.itm.addItem(message.author.id, 'item_box', 1);
                }

                if(row.level + 1 >= 5){
                    await this.app.itm.addBadge(message.author.id, 'loot_goblin');
                }
                if(row.level + 1 >= 25){
                    await this.app.itm.addBadge(message.author.id, 'loot_fiend');
                }
                if(row.level + 1 >= 100){
                    await this.app.itm.addBadge(message.author.id, 'loot_legend');
                }

                // ignore bot list discords
                if(this.app.config.ignoreLvlMessages.includes(message.guild.id)) return;

                const guildRow = await this.app.common.getGuildInfo(message.guild.id);
                
                try{
                    const lvlUpImage = await this.getLevelImage(message.author.avatarURL, row.level + 1);
                    
                    if(guildRow.levelChan !== undefined && guildRow.levelChan !== "" && guildRow.levelChan !== 0){
                        try{
                            await this.app.bot.createMessage(guildRow.levelChan, {
                                content: `**${message.author.username}** leveled up!\n**Item received:** ${levelItem}`
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
                            content: `<@${message.author.id}> level up!\n**Item received:** ${levelItem}`
                        }, {
                            file: lvlUpImage,
                            name: 'userLvl.jpeg'
                        });
                    }
                }
                catch(err){
                    console.log(err);
                    // error creating level up image
                }
            }
        }
        catch(err){
            console.log(err);
        }
    }

    async getLevelImage(playerImage, level){
        //const smallFont = await Jimp.loadFont('./src/resources/fonts/Quicksand_Light25.fnt');
        const image = await Jimp.read('./src/resources/images/LvlUp2.png');
        const avatar = await Jimp.read(playerImage);
        const largeFont = await Jimp.loadFont('./src/resources/fonts/BebasNeueWhite.fnt');

        image.quality(70);
        avatar.resize(64, 64);

        image.print(largeFont, 0, 85, {
            text: "LVL " + level,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        }, 108, 128);
        
        /* Old lvl image showing users name
        image.print(smallFont, 0, 0, {
            text: name.substring(0, 13),
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_TOP
        }, 164, 144);
        */

        image.composite(avatar, 22, 16);

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

const insertTransaction = `
INSERT INTO transactions (
    userId,
    date,
    gained,
    lost)
    VALUES (
        ?, NOW(), ?, ?
    )
`

module.exports = Player;