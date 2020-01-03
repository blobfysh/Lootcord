const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');
const general = require('../methods/general');
const config = require('../json/_config');
const Discoin = require('../utils/discoin');
const discoin = new Discoin(config.discoinToken);

module.exports = {
    name: 'convert',
    aliases: [''],
    description: 'Convert Lootcord Lootcoin to another bot\'s currency using Discoin.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        let convertAmnt = general.getNum(args[0]);
        let currency = args[1] || '';
        currency = currency.toUpperCase();

        if(!args[0]){
            return methods.commandhelp(message, 'convert', prefix);
        }
        else if(convertAmnt < 100){
            return message.reply('Please enter an amount of atleast $100');
        }
        else if(!(await methods.hasmoney(message.author.id, convertAmnt))){
            return message.reply("You don't have enough money for that conversion!");
        }

        try{
            const currencies = await discoin.getCurrencies();
            if(!currencies.includes(currency)){
                return message.reply('That isn\'t a currency available on Discoin. Check out the currencies here: https://dash.discoin.zws.im/#/currencies');
            }
            else if(currency == 'LCN'){
                return message.reply('You\'re trying to convert LCN to LCN? Pick a different currency to convert to.');
            }

            // valid currency and user has money

            const response = await discoin.request(message.author.id, convertAmnt, currency);
            await methods.removemoney(message.author.id, convertAmnt);
            
            const embed = new Discord.RichEmbed()
            .setTitle('Successfully Converted!')
            .setDescription(`${response.data.from.name} to ${response.data.to.name}`)
            .addField('📥 LCN', methods.formatMoney(convertAmnt), true)
            .addField(`📤 ${currency}`, response.data.payout.toFixed(2), true)
            .setFooter(`Transaction ID: ${response.data.id}`)
            .setColor(13215302)

            message.reply({embed: embed});
            
            message.client.shard.broadcastEval(`
                const channel = this.channels.get('${config.logChannel}');
        
                if(channel){
                    channel.send({embed: {
                            color: 13215302,
                            author: {
                                name: "Discoin Conversion"
                            },
                            title: "${message.author.username} : ${message.author.id}",
                            description: "${response.data.from.name} to ${response.data.to.name}",
                            thumbnail: {
                                url: "https://cdn.discordapp.com/attachments/497302646521069570/662369574720765994/spaces2F-LQzahLixLnvmbDfQ1K02Favatar.png"
                            },
                            fields: [
                                {
                                    name: "📥 LCN in:",
                                    value: "${"$" + convertAmnt}",
                                    inline: true
                                },
                                {
                                    name: "📤 ${currency} out:",
                                    value: "${response.data.payout.toFixed(2)}",
                                    inline: true
                                }
                            ],
                            footer: {
                                text: "Transaction ID: ${response.data.id}"
                            },
                        }
                    });
                    true;
                }
                else{
                    false;
                }
            `).then(console.log);
        }
        catch(err){
            return message.reply('Discoin API error, try again later or contact the moderators.');
        }
    },
}