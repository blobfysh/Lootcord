const Discord = require("discord.js");
const helpCmd = require('./json/_help_commands.json'); //opens help commands .json file
const seedrandom = require('seedrandom');
var rng = seedrandom();

class Methods {
    additem(sql, userId, item, amount){
        
    }
    removeitem(sql, userId, item, amount){

    }
    hasitems(sql, userId, item, amount){

    }
    commandhelp(message, command, prefix){
        try{
            for(var i = 0; i < Object.keys(helpCmd).length; i++){
                if(helpCmd[i].lookup.includes(command.toLowerCase())){
                    let cmdUsage = [];
                    let cmdExamples = [];
                    for(var i2 = 0; i2 < helpCmd[i].usage.length; i2++){
                        cmdUsage.push("`"+prefix+helpCmd[i].usage[i2])
                    }
                    for(var i3 = 0; i3 < helpCmd[i].example.length; i3++){
                        cmdExamples.push("`"+prefix+helpCmd[i].example[i3]+"`")
                    }
                    const helpInfo = new Discord.RichEmbed()
                    .setTitle(helpCmd[i].command+" Command Info 🔎")
                    .setColor(13215302)
                    if(helpCmd[i].example[0].length > 0){helpInfo.setDescription("Example: "+cmdExamples.join(", ") + "\n\n**" + helpCmd[i].description+"**")}else{helpInfo.setDescription("**"+helpCmd[i].description+"**")}
                    helpInfo.addField("Usage", cmdUsage.join("\n"))
                    if(helpCmd[i].options !== ""){helpInfo.addField("Options", helpCmd[i].options)}
                    if(helpCmd[i].cooldown !== ""){helpInfo.addField("Cooldown", helpCmd[i].cooldown)}
                    if(helpCmd[i].imageURL && helpCmd[i].imageURL !== ""){helpInfo.setImage(helpCmd[i].imageURL)}
                    message.channel.send(helpInfo);
                    return;
                }
                else if(Object.keys(helpCmd).length - 1 === i){
                    message.reply("❌ That command doesn't exist!");
                }
            }
        }
        catch(err){
            //continue to post help command
            console.log(err)
        }
    }

    //USE COMMAND
    randomItems(sql, fullItemList, killerId, victimId, amount){
        return sql.get(`SELECT * FROM items WHERE userId ="${victimId}"`).then(victimItems => {
            return sql.get(`SELECT * FROM items WHERE userId ="${killerId}"`).then(killerItems => { 
                if(amount <= 0){
                    return selected = "They had no items you could steal!";
                }
                let victimItemsList = [];

                for (var i = 0; i < fullItemList.length; i++) {
                    if(eval(`victimItems.` + fullItemList[i])){
                        if(fullItemList[i] !== "token"){
                            victimItemsList.push(fullItemList[i]);
                        }
                    }
                }
                const shuffled = victimItemsList.sort(() => 0.5 - Math.random()); //shuffles array of items
                var selected = shuffled.slice(0, amount); //picks random items
                
                for (var i = 0; i < selected.length; i++) {
                    //add items to killers inventory, take away from victims
                    sql.run(`UPDATE items SET ${selected[i]} = ${eval(`killerItems.` + selected[i]) + 1} WHERE userId = ${killerId}`);
                    sql.run(`UPDATE items SET ${selected[i]} = ${eval(`victimItems.` + selected[i]) - 1} WHERE userId = ${victimId}`);
                }
                return selected.join("\n");
            });
        });
    }
    addxp(message, sql, amount, userId){
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            sql.run(`UPDATE scores SET points = ${row.points + amount} WHERE userId = ${userId}`);
            message.reply("Successfully used `xp_potion` for **75XP**!");
        });
    }
    resetSkills(message, sql, userId){
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            sql.run(`UPDATE scores SET points = ${row.points + amount} WHERE userId = ${userId}`);
            message.reply("Successfully used `xp_potion` for **75XP**!");
        });
    }

    //GAMBLE SUBCOMMANDS
    roulette(message, sql, userId, amount){
        let multiplier = 1.2;
        let winnings = Math.floor(amount * multiplier);
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            let luck = row.luck >= 20 ? 10 : Math.floor(row.luck/2);
            let chance = Math.floor(Math.random() * 100) + luck; //return 1-100
            if(chance <= 20){
                let healthDeduct = 50;
                if(row.health <= 50){
                    healthDeduct = row.health - 1;
                    sql.run(`UPDATE scores SET health = ${1} WHERE userId = ${userId}`);
                }
                else{
                    sql.run(`UPDATE scores SET health = ${row.health - 50} WHERE userId = ${userId}`);
                }
                message.reply("***Click***").then(msg => {
                    setTimeout(() => {
                        msg.edit(message.author + ", 💥 The gun fires! You took *" + healthDeduct + "* damage and now have **" + (row.health - healthDeduct) + " health**. Oh, and you also lost $" + amount);
                    }, 1500);
                });
            }
            else{
                sql.run(`UPDATE scores SET money = ${row.money + winnings} WHERE userId = ${message.author.id}`);
                message.reply("***Click***").then(msg => {
                    setTimeout(() => {
                        msg.edit(message.author + ", You survived! Your winnings are: $" + winnings + " 💵");
                    }, 1500);
                });
            }
        });
    }
    slots(message, sql, userId, amount){
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
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
            console.log(luck);
            for(var i = 1; i <= 3; i++){
                let chance = Math.floor(rng() * 200) + luck;
                console.log("chance : "+ chance)
                if(chance <= 100){
                    //unbox common
                    eval("col"+i+".push(slotEmotes[3],slotEmotes[0],slotEmotes[1]);");
                    slotFinal.push("common");
                    console.log("col"+i+" is COMMON");
                }
                else if(chance <= 150){
                    //unbox rare
                    eval("col"+i+".push(slotEmotes[0],slotEmotes[1],slotEmotes[2]);");
                    slotFinal.push("rare");
                    console.log("col"+i+" is RARE");
                }
                else if(chance <= 180){
                    eval("col"+i+".push(slotEmotes[1],slotEmotes[2],slotEmotes[3]);");
                    slotFinal.push("epic");
                    console.log("col"+i+" is EPIC");
                }
                else{
                    //legend
                    eval("col"+i+".push(slotEmotes[2],slotEmotes[3],slotEmotes[0]);");
                    slotFinal.push("legend");
                    console.log("col"+i+" is legend");
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
                console.log("ALL 3 MATCH!")
            }
            else if(slotFinal[0] == slotFinal[1] || slotFinal[1] == slotFinal[2]){
                //2 of the same on left or right sides
                if(slotFinal[1] == "common"){
                    rewardMltp = 1.00;
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
            winnings = Math.floor(amount * rewardMltp);
            sql.run(`UPDATE scores SET money = ${row.money + winnings} WHERE userId = ${message.author.id}`);
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
                                "▶"+col1[1]+col2[1]+col3[1]+`◀ You won **$${winnings}**! (${rewardMltp.toFixed(2)}x)\n`+
                                "⬛"+col1[2]+col2[2]+col3[2]+"⬛";
                }
                else{
                    slots3 = "⬛"+col1[0]+col2[0]+col3[0]+"⬛\n"+
                                "▶"+col1[1]+col2[1]+col3[1]+`◀ You lost!\n`+
                                "⬛"+col1[2]+col2[2]+col3[2]+"⬛ Better luck next time.";
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
        });
    }
    coinflip(message, sql, userId, amount, coinSide){
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            if(coinSide !== "heads" && coinSide !== "tails") coinSide = "heads";
            let oppoSide = coinSide == "heads" ? "tails" : "heads";
            let luck = row.luck >= 20 ? 20 : row.luck;
            let chance = Math.floor(Math.random() * 100) + luck; //return 1-100
            if(chance > 50){
                sql.run(`UPDATE scores SET money = ${row.money + parseInt(amount)} WHERE userId = ${message.author.id}`);
                message.reply("The coin landed on `"+coinSide+"`\nYou just won $" + amount * 2 + "!");
            }
            else{
                message.reply("The coin landed on `"+oppoSide+"`<:peeposad:461045610372530177>\nYou just lost $" + amount + "!");
                sql.run(`UPDATE scores SET money = ${parseInt(row.money - amount)} WHERE userId = ${message.author.id}`);
            }
        });
    }
}

module.exports = new Methods();