
class PatreonHandler {
    constructor(app){
        this.app = app;
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
        const patronRows  = await this.app.query('SELECT * FROM patrons WHERE tier >= ?', [minTier]);

        let patrons = {};

        for(let i = 0; i < patronRows.length; i++){
            try{
                let user = await this.app.common.fetchUser(patronRows[i].userId, { cacheIPC: false });
                
                patrons[user.username + '#' + user.discriminator] = {
                    avatar: this.app.common.getAvatar(user),
                    tier: patronRows[i].tier
                };
            }
            catch(err){
            }
        }

        return patrons;
    }

    async removePatrons(supportGuild){
        const members = supportGuild.members;
        const patronRows = (await this.app.query('SELECT * FROM patrons'));

        const tier1 = members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier1Patreon)).map(member => member.id);
        const tier2 = members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier2Patreon)).map(member => member.id);
        const tier3 = members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier3Patreon)).map(member => member.id);
        const tier4 = members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier4Patreon)).map(member => member.id);

        for(let i = 0; i < patronRows.length; i++){
            if(patronRows[i].tier === 1 && !tier1.includes(patronRows[i].userId)){
                this.lostTier1(patronRows[i].userId, '`' + patronRows[i].userId + '`\'s tier 1 donator perks expried.');
            }
            else if(patronRows[i].tier === 2 && !tier2.includes(patronRows[i].userId)){
                this.lostTier2(patronRows[i].userId, '`' + patronRows[i].userId + '`\'s tier 2 donator perks expried.');
            }
            else if(patronRows[i].tier === 3 && !tier3.includes(patronRows[i].userId)){
                this.lostTier3(patronRows[i].userId, '`' + patronRows[i].userId + '`\'s tier 3 donator perks expried.');
            }
            else if(patronRows[i].tier === 4 && !tier4.includes(patronRows[i].userId)){
                this.lostTier4(patronRows[i].userId, '`' + patronRows[i].userId + '`\'s tier 4 donator perks expried.');
            }
        }
    }

    async refreshPatrons(supportGuild){
        const members = supportGuild.members;
        const patronRows = (await this.app.query('SELECT * FROM patrons'));

        const tier1 = members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier1Patreon)).map(member => member.id);
        const tier2 = members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier2Patreon)).map(member => member.id);
        const tier3 = members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier3Patreon)).map(member => member.id);
        const tier4 = members.filter(member => member.roles.includes(this.app.config.donatorRoles.tier4Patreon)).map(member => member.id);

        for(let i = 0; i < tier1.length; i++){
            const patronage = patronRows.filter(patron => patron.userId === tier1[i]);
            
            if(patronage.length && patronage[0].tier !== 1){
                switch(patronage[0].tier){
                    case 1: await this.lostTier1(tier1[i], '`' + tier1[i] + '` patron switched tiers'); break;
                    case 2: await this.lostTier2(tier1[i], '`' + tier1[i] + '` patron switched tiers'); break;
                    case 3: await this.lostTier3(tier1[i], '`' + tier1[i] + '` patron switched tiers'); break;
                    case 4: await this.lostTier4(tier1[i], '`' + tier1[i] + '` patron switched tiers');
                }

                this.gainedTier1(tier1[i]);
            }
            else if(!patronage.length){
                this.gainedTier1(tier1[i]);
            }
        }

        for(let i = 0; i < tier2.length; i++){
            const patronage = patronRows.filter(patron => patron.userId === tier2[i]);
            
            if(patronage.length && patronage[0].tier !== 2){
                switch(patronage[0].tier){
                    case 1: await this.lostTier1(tier2[i], '`' + tier2[i] + '` patron switched tiers'); break;
                    case 2: await this.lostTier2(tier2[i], '`' + tier2[i] + '` patron switched tiers'); break;
                    case 3: await this.lostTier3(tier2[i], '`' + tier2[i] + '` patron switched tiers'); break;
                    case 4: await this.lostTier4(tier2[i], '`' + tier2[i] + '` patron switched tiers');
                }

                this.gainedTier2(tier2[i]);
            }
            else if(!patronage.length){
                this.gainedTier2(tier2[i]);
            }
        }

        for(let i = 0; i < tier3.length; i++){
            const patronage = patronRows.filter(patron => patron.userId === tier3[i]);
            
            if(patronage.length && patronage[0].tier !== 3){
                switch(patronage[0].tier){
                    case 1: await this.lostTier1(tier3[i], '`' + tier3[i] + '` patron switched tiers'); break;
                    case 2: await this.lostTier2(tier3[i], '`' + tier3[i] + '` patron switched tiers'); break;
                    case 3: await this.lostTier3(tier3[i], '`' + tier3[i] + '` patron switched tiers'); break;
                    case 4: await this.lostTier4(tier3[i], '`' + tier3[i] + '` patron switched tiers');
                }

                this.gainedTier3(tier3[i]);
            }
            else if(!patronage.length){
                this.gainedTier3(tier3[i]);
            }
        }

        for(let i = 0; i < tier4.length; i++){
            const patronage = patronRows.filter(patron => patron.userId === tier4[i]);
            
            if(patronage.length && patronage[0].tier !== 4){
                switch(patronage[0].tier){
                    case 1: await this.lostTier1(tier4[i], '`' + tier4[i] + '` patron switched tiers'); break;
                    case 2: await this.lostTier2(tier4[i], '`' + tier4[i] + '` patron switched tiers'); break;
                    case 3: await this.lostTier3(tier4[i], '`' + tier4[i] + '` patron switched tiers'); break;
                    case 4: await this.lostTier4(tier4[i], '`' + tier4[i] + '` patron switched tiers');
                }

                this.gainedTier4(tier4[i]);
            }
            else if(!patronage.length){
                this.gainedTier4(tier4[i]);
            }
        }
    }
}

module.exports = PatreonHandler;