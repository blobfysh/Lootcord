
class PatreonHandler {
    constructor(app){
        this.app = app;
    }

    checkPatron(oldMember, newMember){
        if(oldMember.roles.includes(this.app.config.donatorRoles.tier1Patreon) && !newMember.roles.includes(this.app.config.donatorRoles.tier1Patreon)){
            // lost tier1
            this.lostTier1(newMember.id, `\`${newMember.id}\`'s tier 1 donator perks expried.`);
            console.log('Lost patron level 1');
        }
        else if(!oldMember.roles.includes(this.app.config.donatorRoles.tier1Patreon) && newMember.roles.includes(this.app.config.donatorRoles.tier1Patreon)){
            // gained tier1
            this.gainedTier1(newMember.id);
        }

        if(oldMember.roles.includes(this.app.config.donatorRoles.tier2Patreon) && !newMember.roles.includes(this.app.config.donatorRoles.tier2Patreon)){
            // lost tier2
            this.lostTier2(newMember.id, `\`${newMember.id}\`'s tier 2 donator perks expried.`);
        }
        else if(!oldMember.roles.includes(this.app.config.donatorRoles.tier2Patreon) && newMember.roles.includes(this.app.config.donatorRoles.tier2Patreon)){
            // gained tier2
            this.gainedTier2(newMember.id);
        }

        if(oldMember.roles.includes(this.app.config.donatorRoles.tier3Patreon) && !newMember.roles.includes(this.app.config.donatorRoles.tier3Patreon)){
            // lost tier3
            this.lostTier3(newMember.id, `\`${newMember.id}\`'s tier 3 donator perks expried.`);
        }
        else if(!oldMember.roles.includes(this.app.config.donatorRoles.tier3Patreon) && newMember.roles.includes(this.app.config.donatorRoles.tier3Patreon)){
            // gained tier3
            this.gainedTier3(newMember.id);
        }

        if(oldMember.roles.includes(this.app.config.donatorRoles.tier4Patreon) && !newMember.roles.includes(this.app.config.donatorRoles.tier4Patreon)){
            // lost tier4
            this.lostTier4(newMember.id, `\`${newMember.id}\`'s tier 4 donator perks expried.`);
        }
        else if(!oldMember.roles.includes(this.app.config.donatorRoles.tier4Patreon) && newMember.roles.includes(this.app.config.donatorRoles.tier4Patreon)){
            // gained tier4
            this.gainedTier4(newMember.id);
        }
    }

    async checkPatronLeft(member){
        if(await this.app.cd.getCD(member.id, 'patron1')){
            this.lostTier1(member.id, '`' + member.id + '` left support server...');

            const patronEmbed = new this.app.Embed()
            .setTitle('😦 uh oh...')
            .setDescription(`Your patreon benefits won't work if you leave the support server!`)
            .setColor('#f96854')
            this.app.common.messageUser(member.id, patronEmbed);
        }
        else if(await this.app.cd.getCD(member.id, 'patron2')){
            this.lostTier2(member.id, '`' + member.id + '` left support server...');

            const patronEmbed = new this.app.Embed()
            .setTitle('😦 uh oh...')
            .setDescription(`Your patreon benefits won't work if you leave the support server!`)
            .setColor('#f96854')
            this.app.common.messageUser(member.id, patronEmbed);
        }
        else if(await this.app.cd.getCD(member.id, 'patron3')){
            this.lostTier3(member.id, '`' + member.id + '` left support server...');

            const patronEmbed = new this.app.Embed()
            .setTitle('😦 uh oh...')
            .setDescription(`Your patreon benefits won't work if you leave the support server!`)
            .setColor('#f96854')
            this.app.common.messageUser(member.id, patronEmbed);
        }
        else if(await this.app.cd.getCD(member.id, 'patron4')){
            this.lostTier4(member.id, '`' + member.id + '` left support server...');

            const patronEmbed = new this.app.Embed()
            .setTitle('😦 uh oh...')
            .setDescription(`Your patreon benefits won't work if you leave the support server!`)
            .setColor('#f96854')
            this.app.common.messageUser(member.id, patronEmbed);
        }
    }

    async gainedTier1(userId){
        const patreonLogEmbed = new this.app.Embed()
        .setTitle('New Patron!')
        .addField('User', '```fix\n' + userId + '```', true)
        .addField('Tier', '```\nTier 1 (Loot Fiend)```', true)
        .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/708499928586125372/1200px-Patreon_logomark.png')
        .setColor('#f96854')

        const patronEmbed = new this.app.Embed()
        .setTitle('😲 a donator!')
        .setDescription(`Thank you for helping me create Lootcord!!\n\nYou can view your benefits with the \`patreon\` command!`)
        .setFooter('💙 blobfysh')
        .setColor('#f96854')
        
        try{
            await this.app.query("INSERT INTO patrons (userId, tier, started) VALUES (?, ?, ?)", [userId, 1, Date.now()]);
            await this.app.cache.setNoExpire(`patron1|${userId}`, 'Patron Monthly Tier 1');
            await this.addPatronItems(userId);

            await this.app.common.messageUser(userId, patronEmbed, { throwErr: true });

            patreonLogEmbed.setFooter('✅ Success');
            this.app.messager.messageLogs(patreonLogEmbed);
        }
        catch(err){
            patreonLogEmbed.addField('Error', '```\n' + err + '```')
            patreonLogEmbed.setFooter('❌ Failed to send message to user.');
            this.app.messager.messageLogs(patreonLogEmbed);
        }
    }

    async gainedTier2(userId){
        const patreonLogEmbed = new this.app.Embed()
        .setTitle('New Patron!')
        .addField('User', '```fix\n' + userId + '```', true)
        .addField('Tier', '```\nTier 2 (Loot Hoarder)```', true)
        .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/708499928586125372/1200px-Patreon_logomark.png')
        .setColor('#f96854')

        const patronEmbed = new this.app.Embed()
        .setTitle('😲 a donator!')
        .setDescription(`Thank you for helping me create Lootcord!!\n\nYou can view your benefits with the \`patreon\` command!`)
        .setFooter('💙 blobfysh')
        .setColor('#f96854')
        
        try{
            await this.app.query("INSERT INTO patrons (userId, tier, started) VALUES (?, ?, ?)", [userId, 2, Date.now()]);
            await this.app.cache.setNoExpire(`patron2|${userId}`, 'Patron Monthly Tier 2');
            await this.addPatronItems(userId);

            await this.app.common.messageUser(userId, patronEmbed, { throwErr: true });

            patreonLogEmbed.setFooter('✅ Success');
            this.app.messager.messageLogs(patreonLogEmbed);
        }
        catch(err){
            patreonLogEmbed.addField('Error', '```\n' + err + '```')
            patreonLogEmbed.setFooter('❌ Failed to send message to user.');
            this.app.messager.messageLogs(patreonLogEmbed);
        }
    }

    async gainedTier3(userId){
        const patreonLogEmbed = new this.app.Embed()
        .setTitle('New Patron!')
        .addField('User', '```fix\n' + userId + '```', true)
        .addField('Tier', '```\nTier 3 (Loot Lord)```', true)
        .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/708499928586125372/1200px-Patreon_logomark.png')
        .setColor('#f96854')

        const patronEmbed = new this.app.Embed()
        .setTitle('😲 a donator!')
        .setDescription(`Thank you for helping me create Lootcord!!\n\nYou can view your benefits with the \`patreon\` command!`)
        .setFooter('💙 blobfysh')
        .setColor('#f96854')
        
        try{
            await this.app.query("INSERT INTO patrons (userId, tier, started) VALUES (?, ?, ?)", [userId, 3, Date.now()]);
            await this.app.cache.setNoExpire(`patron3|${userId}`, 'Patron Monthly Tier 3');
            await this.addPatronItems(userId);

            await this.app.common.messageUser(userId, patronEmbed, { throwErr: true });

            patreonLogEmbed.setFooter('✅ Success');
            this.app.messager.messageLogs(patreonLogEmbed);
        }
        catch(err){
            patreonLogEmbed.addField('Error', '```\n' + err + '```')
            patreonLogEmbed.setFooter('❌ Failed to send message to user.');
            this.app.messager.messageLogs(patreonLogEmbed);
        }
    }

    async gainedTier4(userId){
        const patreonLogEmbed = new this.app.Embed()
        .setTitle('New Patron!')
        .addField('User', '```fix\n' + userId + '```', true)
        .addField('Tier', '```\nTier 4 (Ultra Looter)```', true)
        .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/708499928586125372/1200px-Patreon_logomark.png')
        .setColor('#f96854')

        const patronEmbed = new this.app.Embed()
        .setTitle('😲 a donator!')
        .setDescription(`Thank you for helping me create Lootcord!!\n\nYou can view your benefits with the \`patreon\` command!`)
        .setFooter('💙 blobfysh')
        .setColor('#f96854')
        
        try{
            await this.app.query("INSERT INTO patrons (userId, tier, started) VALUES (?, ?, ?)", [userId, 4, Date.now()]);
            await this.app.cache.setNoExpire(`patron4|${userId}`, 'Patron Monthly Tier 4');
            await this.addPatronItems(userId);

            await this.app.common.messageUser(userId, patronEmbed, { throwErr: true });

            patreonLogEmbed.setFooter('✅ Success');
            this.app.messager.messageLogs(patreonLogEmbed);
        }
        catch(err){
            patreonLogEmbed.addField('Error', '```\n' + err + '```')
            patreonLogEmbed.setFooter('❌ Failed to send message to user.');
            this.app.messager.messageLogs(patreonLogEmbed);
        }
    }

    async lostTier1(userId, msg = undefined){
        try{
            await this.app.query(`DELETE FROM patrons WHERE userId = ? AND tier = ?`, [userId, 1]);
            await this.app.cd.clearCD(userId, 'patron1');
            await this.removePatronItems(userId);

            const patreonLogEmbed = new this.app.Embed()
            .setTitle('Perks Ended')
            .setColor(16734296)
            .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/708499928586125372/1200px-Patreon_logomark.png')
            .setDescription(msg)
            this.app.messager.messageLogs(patreonLogEmbed);
        }
        catch(err){
            console.error(err);
        }
    }

    async lostTier2(userId, msg = undefined){
        try{
            await this.app.query(`DELETE FROM patrons WHERE userId = ? AND tier = ?`, [userId, 2]);
            await this.app.cd.clearCD(userId, 'patron2');
            await this.removePatronItems(userId);

            const patreonLogEmbed = new this.app.Embed()
            .setTitle('Perks Ended')
            .setColor(16734296)
            .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/708499928586125372/1200px-Patreon_logomark.png')
            .setDescription(msg)
            this.app.messager.messageLogs(patreonLogEmbed);
        }
        catch(err){
            console.error(err);
        }
    }

    async lostTier3(userId, msg = undefined){
        try{
            await this.app.query(`DELETE FROM patrons WHERE userId = ? AND tier = ?`, [userId, 3]);
            await this.app.cd.clearCD(userId, 'patron3');
            await this.removePatronItems(userId);

            const patreonLogEmbed = new this.app.Embed()
            .setTitle('Perks Ended')
            .setColor(16734296)
            .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/708499928586125372/1200px-Patreon_logomark.png')
            .setDescription(msg)
            this.app.messager.messageLogs(patreonLogEmbed);
        }
        catch(err){
            console.error(err);
        }
    }

    async lostTier4(userId, msg = undefined){
        try{
            await this.app.query(`DELETE FROM patrons WHERE userId = ? AND tier = ?`, [userId, 4]);
            await this.app.cd.clearCD(userId, 'patron4');
            await this.removePatronItems(userId);

            const patreonLogEmbed = new this.app.Embed()
            .setTitle('Perks Ended')
            .setColor(16734296)
            .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/708499928586125372/1200px-Patreon_logomark.png')
            .setDescription(msg)
            this.app.messager.messageLogs(patreonLogEmbed);
        }
        catch(err){
            console.error(err);
        }
    }

    
    async addPatronItems(userId){
        await this.app.itm.addItem(userId, 'patron', 1);
    }

    async removePatronItems(userId){
        await this.app.query(`DELETE FROM user_items WHERE userId = ? AND item = 'patron'`, [userId]);
        await this.app.query(`UPDATE scores SET banner = 'none' WHERE userId = ? AND banner = 'patron'`, [userId]);
    }

    async isPatron(user, minTier = 1){
        const patron1CD = await this.app.cd.getCD(user, 'patron1');
        const patron2CD = await this.app.cd.getCD(user, 'patron2');
        const patron3CD = await this.app.cd.getCD(user, 'patron3');
        const patron4CD = await this.app.cd.getCD(user, 'patron4');

        if(minTier === 1 && (patron1CD || patron2CD || patron3CD || patron4CD)) return true;
        else if(minTier === 2 && (patron2CD || patron3CD || patron4CD)) return true;
        else if(minTier === 3 && (patron3CD || patron4CD)) return true;
        else if(minTier === 4 && patron4CD) return true;

        return false;
    }

    async getPatrons(minTier){
        const patronRows  = await this.app.query('SELECT * FROM patrons WHERE tier >= ?', minTier);

        let patrons = {};

        for(let i = 0; i < patronRows.length; i++){
            try{
                let user = await this.app.common.fetchUser(patronRows[i].userId, { cacheIPC: false });
                
                patrons[user.username + '#' + user.discriminator] = {
                    avatar: this.app.common.getAvatar(user),
                    tier: patronsRows[i].tier
                };
            }
            catch(err){
            }
        }

        return patrons;
    }
}

module.exports = PatreonHandler;