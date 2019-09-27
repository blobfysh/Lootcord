const Discord = require('discord.js');
const { query } = require('../mysql.js');
const methods = require('../methods/methods.js');

module.exports = {
    name: 'slots',
    aliases: ['slot'],
    description: 'Put some money in the slot machine!',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: true,
    modOnly: false,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        const row = (await query(`SELECT * FROM scores 
        INNER JOIN cooldowns
        ON scores.userId = cooldowns.userId
        WHERE scores.userId ="${message.author.id}"`))[0];
        var gambleAmount = args[0];

        if(message.client.sets.slotsCooldown.has(message.author.id)){
            message.reply(lang.general[10].replace('{0}', ((60 * 1000 - ((new Date()).getTime() - row.slotsTime)) / 1000).toFixed(0)));
            return;
        }

        else if(gambleAmount !== undefined && gambleAmount >= 100){
            gambleAmount = Math.floor(gambleAmount);

            if(gambleAmount > row.money){
                return message.reply(lang.buy[4]);
            }
            
            methods.removemoney(message.author.id, gambleAmount);
            let mainRowGif = "<a:_slots:547282654920179722>";
            let topRowGif = "<a:_slotsBOT:547787994258472980>";
            let botRowGif = "<a:_slotsTOP:547787986696142848>";
            let slotEmotes = ["<:UnboxCommon:526248905676029968>","<:UnboxRare:526248948579434496>","<:UnboxEpic:526248961892155402>","<:UnboxLegendary:526248970914234368>"];
            let col1 = [];
            let col2 = [];
            let col3 = [];
            let slotFinal = [];
            
            let winnings = 0;
            let rewardMltp = 0.00; //used to check if user wins, also multiplies the amount user entered
    
            let template = "⬛"+topRowGif+topRowGif+topRowGif+"⬛\n▶"+mainRowGif+mainRowGif+mainRowGif+"◀\n⬛"+botRowGif+botRowGif+botRowGif+"⬛";
            let slotEmbed = new Discord.RichEmbed()
            .setAuthor(message.member.displayName, message.author.avatarURL)
            .setTitle(" --**SLOT MACHINE**--")
            .setDescription(template)
            let luck = row.luck >= 30 ? 30 : Math.floor(row.luck);
            for(var i = 1; i <= 3; i++){
                let chance = Math.floor(Math.random() * 200) + luck;
                if(chance <= 100){
                    //unbox common
                    eval("col"+i+".push(slotEmotes[3],slotEmotes[0],slotEmotes[1]);");
                    slotFinal.push("common");
                }
                else if(chance <= 150){
                    //unbox rare
                    eval("col"+i+".push(slotEmotes[0],slotEmotes[1],slotEmotes[2]);");
                    slotFinal.push("rare");
                }
                else if(chance <= 180){
                    eval("col"+i+".push(slotEmotes[1],slotEmotes[2],slotEmotes[3]);");
                    slotFinal.push("epic");
                }
                else{
                    //legend
                    eval("col"+i+".push(slotEmotes[2],slotEmotes[3],slotEmotes[0]);");
                    slotFinal.push("legend");
                }
            }
            if(slotFinal[0] == slotFinal[1] && slotFinal[1] == slotFinal[2]){
                //all 3 match
                if(slotFinal[0] == "common"){
                    //1x
                    rewardMltp = 2.00;
                }
                else if(slotFinal[0] == "rare"){
                    //3x
                    rewardMltp = 3.00;
                }
                else if(slotFinal[0] == "epic"){
                    //4x
                    rewardMltp = 6.00;
                }
                else if(slotFinal[0] =="legend"){
                    //10x
                    rewardMltp = 10.00;
                }
            }
            else if(slotFinal[0] == slotFinal[1] || slotFinal[1] == slotFinal[2]){
                //2 of the same on left or right sides
                if(slotFinal[1] == "common"){
                    rewardMltp = 0.80;
                }
                else if(slotFinal[1] == "rare"){
                    //1.5x
                    rewardMltp = 1.50;
                }
                else if(slotFinal[1] == "epic"){
                    //3x
                    rewardMltp = 3.00;
                }
                else if(slotFinal[1] =="legend"){
                    //4x
                    rewardMltp = 5.00;
                }
            }
            winnings = Math.floor(gambleAmount * rewardMltp);
            methods.addmoney(message.author.id, winnings);

            message.channel.send(slotEmbed).then(msg => {
                let slots1 = "⬛"+col1[0]+topRowGif+topRowGif+"⬛\n"+
                                "▶"+col1[1]+mainRowGif+mainRowGif+"◀\n"+
                                "⬛"+col1[2]+botRowGif+botRowGif+"⬛";
                let slots2 = "⬛"+col1[0]+col2[0]+topRowGif+"⬛\n"+
                                "▶"+col1[1]+col2[1]+mainRowGif+"◀\n"+
                                "⬛"+col1[2]+col2[2]+botRowGif+"⬛";
                let slots3 = "";
                if(rewardMltp !== 0.00){
                    slots3 = "⬛"+col1[0]+col2[0]+col3[0]+"⬛\n"+
                                "▶"+col1[1]+col2[1]+col3[1]+`◀ ${lang.gamble.slots[0].replace('{0}', winnings).replace('{1}', rewardMltp.toFixed(2))}\n`+
                                "⬛"+col1[2]+col2[2]+col3[2]+"⬛";
                }
                else{
                    slots3 = "⬛"+col1[0]+col2[0]+col3[0]+"⬛\n"+
                                "▶"+col1[1]+col2[1]+col3[1]+`◀ ${lang.gamble.slots[1]}\n`+
                                "⬛"+col1[2]+col2[2]+col3[2]+`⬛ ${lang.gamble.slots[2]}`;
                }
                slotEmbed.setDescription(slots1);
                //send messages
                setTimeout(() => {
                    msg.edit(slotEmbed).then(msg => {setTimeout(() => {
                        slotEmbed.setDescription(slots2);
                        msg.edit(slotEmbed).then(msg => {setTimeout(() => {
                                slotEmbed.setColor(rewardMltp !== 0.00 ? 720640 : 13632027)
                                slotEmbed.setDescription(slots3);
                                msg.edit(slotEmbed);
                            }, 1400);});
                    }, 1000);});
                }, 1000);
            });

            setTimeout(() => {
                message.client.shard.broadcastEval(`this.sets.slotsCooldown.delete('${message.author.id}')`);
                query(`UPDATE cooldowns SET slotsTime = ${0} WHERE userId = ${message.author.id}`);
            }, 60 * 1000);
            
            message.client.shard.broadcastEval(`this.sets.slotsCooldown.add('${message.author.id}')`);
            query(`UPDATE cooldowns SET slotsTime = ${(new Date()).getTime()} WHERE userId = ${message.author.id}`);
        }
        else{
            methods.commandhelp(message, "slots", prefix);
        }
    },
}