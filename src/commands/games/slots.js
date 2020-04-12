
module.exports = {
    name: 'slots',
    aliases: ['slot'],
    description: 'Put some money in the slot machine!',
    long: 'Play a game of slots.\n\n<:UnboxCommon:526248905676029968><:UnboxCommon:526248905676029968> - **0.8x** multiplier\n<:UnboxRare:526248948579434496><:UnboxRare:526248948579434496> - **1.5x** multiplier\n<:UnboxEpic:526248961892155402><:UnboxEpic:526248961892155402> - **3x** multiplier\n<:UnboxLegendary:526248970914234368><:UnboxLegendary:526248970914234368> - **5x** multiplier\n<:UnboxCommon:526248905676029968><:UnboxCommon:526248905676029968><:UnboxCommon:526248905676029968> - **2x** multiplier\n<:UnboxRare:526248948579434496><:UnboxRare:526248948579434496><:UnboxRare:526248948579434496> - **3x** multiplier\n<:UnboxEpic:526248961892155402><:UnboxEpic:526248961892155402><:UnboxEpic:526248961892155402> - **6x** multiplier\n<:UnboxLegendary:526248970914234368><:UnboxLegendary:526248970914234368><:UnboxLegendary:526248970914234368> - **10x** multiplier',
    args: {"amount": "Amount of money to gamble."},
    examples: ["slots 1000"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        const slotsCD = await app.cd.getCD(message.author.id, 'slots');
        let gambleAmount = app.parse.numbers(message.args)[0];
        
        if(slotsCD){
            return message.reply(`You need to wait  \`${slotsCD}\`  before using this command again`);
        }

        if(!gambleAmount || gambleAmount < 100){
            return message.reply(`Please specify an amount of atleast ${app.common.formatNumber(100)} to gamble!`);
        }

        if(gambleAmount > row.money){
            return message.reply(`You don't have that much money! You currently have ${app.common.formatNumber(row.money)}`);
        }
        
        if(gambleAmount > 1000000){
            return message.reply(`You cannot gamble more than ${app.common.formatNumber(1000000)}`);
        }
        
        await app.player.removeMoney(message.author.id, gambleAmount);
        let mainRowGif = app.icons.slots_midrow_gif;
        let topRowGif = app.icons.slots_botrow_gif;
        let botRowGif = app.icons.slots_toprow_gif;
        let slotEmotes = [app.icons.slots_common_icon, app.icons.slots_rare_icon, app.icons.slots_epic_icon, app.icons.slots_legendary_icon];
        let col = {
            '1': [],
            '2': [],
            '3': []
        }
        let slotFinal = [];
        
        let winnings = 0;
        let rewardMltp = 0.00; //used to check if user wins, also multiplies the amount user entered

        for(var i = 1; i <= 3; i++){
            let chance = Math.floor(Math.random() * 200);
            if(chance <= 100){
                //unbox common
                col[i].push(slotEmotes[3],slotEmotes[0],slotEmotes[1]);
                slotFinal.push("common");
            }
            else if(chance <= 150){
                //unbox rare
                col[i].push(slotEmotes[0],slotEmotes[1],slotEmotes[2]);
                slotFinal.push("rare");
            }
            else if(chance <= 180){
                col[i].push(slotEmotes[1],slotEmotes[2],slotEmotes[3]);
                slotFinal.push("epic");
            }
            else{
                //legend
                col[i].push(slotEmotes[2],slotEmotes[3],slotEmotes[0]);
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
        await app.player.addMoney(message.author.id, winnings);

        if(winnings >= 2000000){
            await app.itm.addBadge(message.author.id, 'gambler');
        }

        let template = "⬛"+topRowGif+topRowGif+topRowGif+"⬛\n▶"+mainRowGif+mainRowGif+mainRowGif+"◀\n⬛"+botRowGif+botRowGif+botRowGif+"⬛";
        
        const slotEmbed = new app.Embed()
        .setAuthor(message.member.effectiveName, message.author.avatarURL)
        .setTitle("Slot Machine")
        .setDescription(template)

        const botMsg = await message.channel.createMessage(slotEmbed);

        let slots1 = "⬛"+col['1'][0]+topRowGif+topRowGif+"⬛\n"+
                        "▶"+col['1'][1]+mainRowGif+mainRowGif+"◀\n"+
                        "⬛"+col['1'][2]+botRowGif+botRowGif+"⬛";
        let slots2 = "⬛"+col['1'][0]+col['2'][0]+topRowGif+"⬛\n"+
                        "▶"+col['1'][1]+col['2'][1]+mainRowGif+"◀\n"+
                        "⬛"+col['1'][2]+col['2'][2]+botRowGif+"⬛";
        let slots3 = "";
        if(rewardMltp !== 0.00){
            slots3 = "⬛"+col['1'][0]+col['2'][0]+col['3'][0]+"⬛\n"+
                        "▶"+col['1'][1]+col['2'][1]+col['3'][1]+`◀ You won **${app.common.formatNumber(winnings)}**! (${rewardMltp.toFixed(2)}x)\n`+
                        "⬛"+col['1'][2]+col['2'][2]+col['3'][2]+"⬛";
        }
        else{
            slots3 = "⬛"+col['1'][0]+col['2'][0]+col['3'][0]+"⬛\n"+
                        "▶"+col['1'][1]+col['2'][1]+col['3'][1]+`◀ You lost!\n`+
                        "⬛"+col['1'][2]+col['2'][2]+col['3'][2]+`⬛ Better luck next time.`;
        }

        slotEmbed.setDescription(slots1);

        setTimeout(() => {
            botMsg.edit(slotEmbed);

            slotEmbed.setDescription(slots2);
        }, 1000);

        setTimeout(() => {
            botMsg.edit(slotEmbed);

            slotEmbed.setDescription(slots3);
            slotEmbed.setColor(rewardMltp !== 0.00 ? 720640 : 13632027);
        }, 2000);

        setTimeout(() => {
            botMsg.edit(slotEmbed)
        }, 3400);

        await app.cd.setCD(message.author.id, 'slots', app.config.cooldowns.slots * 1000);
    },
}