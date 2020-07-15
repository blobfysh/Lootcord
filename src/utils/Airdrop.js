
class Airdrop {
    constructor(app){
        this.app = app;
        this.timers = [];
    }

    initAirdrop(guildId){
        let rand = Math.round(Math.random() * (14400 * 1000)) + (14400 * 1000); // Generate random time from 4 - 8 hours 14400
        console.log(`[AIRDROP] Counting down from ${this.app.cd.convertTime(rand)}`);

        let timeObj = {guild: guildId, started: Date.now(), length: rand, timer: setTimeout(() => {
            this.callAirdrop(guildId, 'care_package');
        }, rand)};
    
        this.timers.push(timeObj);
    }

    async callAirdrop(guildId, itemToDrop){
        try{
            const activeRow = await this.app.query(`SELECT * FROM userGuilds WHERE guildId = ${guildId}`);
            
            // less than 5 active players in guild, cancel the airdrop
            if(Object.keys(activeRow).length < 5){
                this.app.query(`UPDATE guildInfo SET dropChan = 0 WHERE guildId ='${guildId}'`);
                this.cancelAirdrop(guildId);
                return;
            }

            const dropChan = await this.app.query(`SELECT * FROM guildInfo WHERE guildId = ${guildId}`);
            let guildPrefix = await this.app.cache.get(`prefix|${guildId}`);

            if(!guildPrefix){
                // check db for prefix
                guildPrefix = await this.app.query(`SELECT * FROM guildPrefix WHERE guildId = ${guildId}`);

                if(guildPrefix.length && guildPrefix[0].prefix){
                    await this.app.cache.set(`prefix|${guildId}`, guildPrefix[0].prefix, 43200);
                    guildPrefix = guildPrefix[0].prefix;
                }
                else{
                    // no prefix found in cache or db, use config
                    await this.app.cache.set(`prefix|${guildId}`, this.app.config.prefix, 43200);
                    guildPrefix = this.app.config.prefix;
                }
            }

            let channelToDrop = dropChan[0].dropChan;

            const dropEmbed = new this.app.Embed()
            .setDescription(`**A ${this.app.itemdata[itemToDrop].icon}\`${itemToDrop}\` has arrived!**\n\nUse \`${guildPrefix}claimdrop\` to claim it.`)
            .setImage(this.app.itemdata[itemToDrop].image)
            .setFooter('You have 5 minutes to claim this drop.')
            .setColor(13451564)
            
            await this.app.bot.createMessage(channelToDrop, dropEmbed);
            await this.app.query(`UPDATE guildInfo SET dropItemChan = '${channelToDrop}' WHERE guildId = ${guildId}`);
            await this.app.query(`UPDATE guildInfo SET dropItem = '${itemToDrop}' WHERE guildId = ${guildId}`);

            setTimeout(async () => {
                const guildRow = await this.app.common.getGuildInfo(guildId);

                if(guildRow.dropItem !== ''){
                    await this.app.query(`UPDATE guildInfo SET dropItem = '' WHERE guildId = ${guildId}`);
                    await this.app.query(`UPDATE guildInfo SET dropItemChan = 0 WHERE guildId = ${guildId}`);

                    await this.app.bot.createMessage(channelToDrop, '**The ' + this.app.itemdata[itemToDrop].icon + '`' + itemToDrop + '` was stolen!** Better luck next time...');
                }
            }, 300 * 1000);

            this.cancelAirdrop(guildId); // remove timer from timers array
            this.initAirdrop(guildId); // start another airdrop countdown
        }
        catch(err){

            // cancel airdrops for guild because it clearly isn't working
            this.app.query(`UPDATE guildInfo SET dropChan = 0 WHERE guildId ='${guildId}'`);
            this.cancelAirdrop(guildId);
            console.log(err);
        }
        
    }

    cancelAirdrop(guildId){
        for(let arrObj of this.timers){
            if(arrObj.guild == guildId){
                clearTimeout(arrObj.timer);

                this.timers.splice(this.timers.indexOf(arrObj), 1);
            }
        }
    }

    /**
     * Just a helper method for checking airdrops with eval command "t-eval app.airdrop.getAirdropGuilds()"
     */
    getAirdropGuilds(){
        let airdrops = [];

        for(let arrObj of this.timers){
            airdrops.push(arrObj.guild + ' - ' + this.app.cd.convertTime( (arrObj.started + arrObj.length) - Date.now() ));
        }

        return airdrops;
    }
}

module.exports = Airdrop;