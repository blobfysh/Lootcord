
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
    }

    async gainedTier1(userId){
        const patreonLogEmbed = new this.app.Embed()
        .setTitle('New Patron!')
        .addField('User', '```fix\n' + userId + '```', true)
        .addField('Tier', '```\nTier 1 (Loot Goblin)```', true)
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
        .addField('Tier', '```\nTier 2 (Loot Lord)```', true)
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
}

module.exports = PatreonHandler;