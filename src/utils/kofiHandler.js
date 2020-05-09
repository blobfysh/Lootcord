
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
        const coffees = Math.floor(parseInt(data.amount) / 3);
        const userObj = await this.common.fetchUser(user, { cacheIPC: true });

        if(!coffees){
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
            // dont create a new account to prevent issues with users putting in other peoples ID's to spam them
            donateEmbed.addField('User', '```fix\n' + user + '```', true)
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('❌ No Lootcord account found.')

            return this.messager.messageLogs(donateEmbed);
        }
    
        // give reward
        this.itm.addItem(user, 'kofi_king', 1);
        this.itm.addItem(user, 'ultra_box', coffees);

        const patronEmbed = new this.Embed()
        .setTitle('😲 a donator!')
        .setFooter('💙 blobfysh')
        .setColor('#29ABE0')
        .setDescription(`Thank you for helping me create Lootcord!!`)
        .addField('Items Received', `${coffees}x ${this.itemdata['ultra_box'].icon}\`ultra_box\`\n1x ${this.itemdata['kofi_king'].icon}\`kofi_king\``)
    
        try{
            await this.common.messageUser(user, patronEmbed, { throwErr: true });

            donateEmbed.addField('User', '```fix\n' + userObj.username + '#' + userObj.discriminator + '\nID: ' + user + '```', true)
            donateEmbed.addField('Coffees', '```\n' + coffees + '```', true)
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('✅ Success')

            this.messager.messageLogs(donateEmbed);
        }
        catch(err){
            donateEmbed.addField('User', '```fix\n' + userObj.username + '#' + userObj.discriminator + '\nID: ' + user + '```', true)
            donateEmbed.addField('Coffees', '```\n' + coffees + '```', true)
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('❌ Failed to send message to user.')

            this.messager.messageLogs(donateEmbed);
        }
    }
    catch(err){
        console.warn(err);
    }
}