const MILLISECONDS_MONTH = 2592000 * 1000;

exports.handle = async function({ data }){
    const donateEmbed = new this.Embed()
    .setTitle('Ko-fi Donation')
    .setThumbnail('https://pbs.twimg.com/profile_images/1207570720034701314/dTLz6VR2_400x400.jpg')
    .setColor('#29ABE0')

    try{
        data = JSON.parse(data);
        let user = data.message.split(/ +/).map(val => val.match(/^<?@?!?[0-9]{17,18}>?$/)).filter(val => val);
    
        if(!user.length){
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('❌ No user in message.')

            return this.messager.messageLogs(donateEmbed);
        }
    
        user = user[0][0];
        const months = Math.floor(parseInt(data.amount) / 3);
        const userObj = await this.common.fetchUser(user, { cacheIPC: true });

        if(!months){
            donateEmbed.addField('User', '```fix\n' + user + '```', true)
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('❌ 0 months.')

            return this.messager.messageLogs(donateEmbed);
        }
        else if(!userObj){
            donateEmbed.addField('User', '```fix\n' + user + '```', true)
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('❌ No user found.')

            return this.messager.messageLogs(donateEmbed);
        }

        const account = await this.player.getRow(user);
        if(!account){
            await this.player.createAccount(user);
        }
    
        // give reward
        const patronCD = await this.cd.getCD(user, 'patron');
    
        const patronEmbed = new this.Embed()
        .setTitle('😲 a donator!')
        .setFooter('💙 blobfysh')
        .setColor('#29ABE0')
    
        if(patronCD){
            const patronRemaining = await this.cache.getTTL(`patron|${user}`);
    
            patronEmbed.setDescription(`Thank you for helping me create Lootcord!!\n\nYour premium perks were extended for \`${months} months\`!`);
    
            await this.query(`DELETE FROM cooldown WHERE userId = '${user}' AND type = 'patron'`);
            await this.cd.setCD(user, 'patron', (MILLISECONDS_MONTH * months) + (patronRemaining * 1000), { patron: true });
        }
        else{
            this.itm.addItem(user, 'kofi_king', 1);
            this.ipc.broadcast('addPatronRole', { guildId: this.config.supportGuildID, userId: user });
            patronEmbed.setDescription(`Thank you for helping me create Lootcord!!\n\nYour account has been given premium perks for \`${months} months\`!`);
            await this.cd.setCD(user, 'patron', MILLISECONDS_MONTH * months, { patron: true });
        }
    
        try{
            this.common.messageUser(user, patronEmbed, { throwErr: true });

            donateEmbed.addField('User', '```fix\n' + userObj.username + '#' + userObj.discriminator + '\nID: ' + user + '```', true)
            donateEmbed.addField('Months', '```\n' + months + '```', true)
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('✅ Success')

            this.messager.messageLogs(donateEmbed);
        }
        catch(err){
            donateEmbed.addField('User', '```fix\n' + userObj.username + '#' + userObj.discriminator + '\nID: ' + user + '```', true)
            donateEmbed.addField('Months', '```\n' + months + '```', true)
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('❌ Failed to send message to user.')

            this.messager.messageLogs(donateEmbed);
        }
    }
    catch(err){
        console.warn(err);
    }
}