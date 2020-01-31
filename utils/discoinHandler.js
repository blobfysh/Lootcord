const config  = require('../json/_config.json');
const { query } = require('../mysql.js');
const Discord = require('discord.js');
const methods = require('../methods/methods');
const Discoin = require('./discoin');
const discoin = new Discoin(config.discoinToken);

exports.initDiscoin = (manager) => {
    if(config.debug) return;
    console.log('[DISCOIN] Discoin ready');

    setInterval(() => { 
        discoinHandler(manager); 
    }, 180000);
}

async function discoinHandler(manager){
    try{
        const unhandled = await discoin.getUnhandled();

        for(var i = 0; i < unhandled.data.length; i++){
            let transaction = unhandled.data[i];
            let payout = Math.round(transaction.payout);
            const userRow = (await query(`SELECT * FROM scores WHERE userId = ${transaction.user}`))[0];
            await discoin.handle(transaction.id);

            if(!userRow){
                //no account to give money...
                const embed = new Discord.RichEmbed()
                .setTitle('Conversion Failed')
                .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/662369574720765994/spaces2F-LQzahLixLnvmbDfQ1K02Favatar.png')
                .setDescription(`You're Discoin transaction failed because you have no Lootcord account to give the payout to. If you decide to make an account, message our moderators with the Discoin transaction ID and we will try to solve this issue. [Click this to see more details.](https://dash.discoin.zws.im/#/transactions/${transaction.id}/show)`)
                .setFooter(`Transaction ID: ${transaction.id}`)
                .setColor(13215302)

                messageUser(manager, transaction.user, {embed: embed});
            }
            else{
                methods.addmoney(transaction.user, payout);

                const embed = new Discord.RichEmbed()
                .setTitle('Conversion Successful')
                .setThumbnail('https://cdn.discordapp.com/attachments/497302646521069570/662369574720765994/spaces2F-LQzahLixLnvmbDfQ1K02Favatar.png')
                .setDescription(`You received ${methods.formatMoney(payout)} (${transaction.payout} rounded) through Discoin! [Click this to see more details.](https://dash.discoin.zws.im/#/transactions/${transaction.id}/show)`)
                .setColor(13215302)

                messageUser(manager, transaction.user, {embed: embed});
            }
        }

        console.log('[DISCOIN] Successfully handled ' + unhandled.data.length + ' transactions.');
    }
    catch(err){
        console.log('[DISCOIN] API error:');
        console.log(err);
    }
}

function messageUser(manager, userId, message){
    manager.broadcast({
        userId: userId,
        msgToSend: message
    });
}