class Methods {
    additem(sql, userId, item, amount){
        
    }
    removeitem(sql, userId, item, amount){

    }
    hasitems(sql, userId, item, amount){

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

    //GAMBLE SUBCOMMANDS
    roulette(message, sql, userId, amount){
        let multiplier = 1.2;
        sql.get(`SELECT * FROM scores WHERE userId ="${userId}"`).then(row => {
            if(row.health < 25){
                return message.reply("⚠ You need atleast **25 HP** to use the `roulette` command, you currently have **" + row.health + "/" + row.maxHealth + "**.");
            }
            setTimeout(() => {
                gambleCooldown.delete(message.author.id);
                sql.run(`UPDATE scores SET gambleTime = ${0} WHERE userId = ${message.author.id}`);
            }, gambleCdSeconds * 1000);
            gambleCooldown.add(message.author.id);
            sql.run(`UPDATE scores SET gambleTime = ${(new Date()).getTime()} WHERE userId = ${userId}`);

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
                message.reply("***Click***").then(msg => {
                    let winnings = Math.floor(amount * multiplier);
                    setTimeout(() => {
                        msg.edit(message.author + ", You survived! Your winnings are: $" + winnings + " 💵");
                    }, 1500);
                });
            }
        });
    }
    slots(message, sql, userId, amount){
        let mainRowGif = "<a:_slots:547282654920179722>";
        let topRowGif = "<a:_slotsBOT:547787994258472980>";
        let botRowGif = "<a:_slotsTOP:547787986696142848>";
        let slotEmotes = ["<:UnboxCommon:526248905676029968>","<:UnboxRare:526248948579434496>","<:UnboxEpic:526248961892155402>","<:UnboxLegendary:526248970914234368>"];
        let row1 = [];
        let row2 = [];
        let row3 = [];

        let template = " -**SLOT MACHINE**-\n⬜"+topRowGif+topRowGif+topRowGif+"⬜\n▶"+mainRowGif+mainRowGif+mainRowGif+"◀\n⬜"+botRowGif+botRowGif+botRowGif+"⬜";
        //let luck = row.luck >= 20 ? 10 : Math.floor(row.luck/2);
        let chance = Math.floor(Math.random() * 100) //+ luck; //return 1-100
        
        message.channel.send(template).then(msg => {
            row1.push(slotEmotes[0],topRowGif,topRowGif);
            let newTemp = " -**SLOT MACHINE**-\n⬜<:UnboxRare:526248948579434496><a:_slotsBOT:547787994258472980><a:_slotsBOT:547787994258472980>⬜\n▶<:UnboxEpic:526248961892155402><a:_slots:547282654920179722><a:_slots:547282654920179722>◀\n⬜<:UnboxLegendary:526248970914234368><a:_slotsTOP:547787986696142848><a:_slotsTOP:547787986696142848>⬜";
            let newTemp2 = " -**SLOT MACHINE**-\n⬜<:UnboxRare:526248948579434496><:UnboxRare:526248948579434496><a:_slotsBOT:547787994258472980>⬜\n▶<:UnboxEpic:526248961892155402><:UnboxEpic:526248961892155402><a:_slots:547282654920179722>◀\n⬜<:UnboxLegendary:526248970914234368><:UnboxLegendary:526248970914234368><a:_slotsTOP:547787986696142848>⬜";
            let newTemp3 = " -**SLOT MACHINE**-\n⬜<:UnboxRare:526248948579434496><:UnboxRare:526248948579434496><:UnboxRare:526248948579434496>⬜\n▶<:UnboxEpic:526248961892155402><:UnboxEpic:526248961892155402><:UnboxEpic:526248961892155402>◀ YOU WON!\n⬜<:UnboxLegendary:526248970914234368><:UnboxLegendary:526248970914234368><:UnboxLegendary:526248970914234368>⬜";
            
            
            //send messages
            setTimeout(() => {
                msg.edit(newTemp).then(msg => {setTimeout(() => {
                    msg.edit(newTemp2).then(msg => {setTimeout(() => {
                            msg.edit(newTemp3)
                        }, 1200);});
                }, 1000);});
            }, 1000);
        });
    }
    wager(message, sql, userId, amount){
        let luck = row.luck >= 20 ? 20 : row.luck;
        let chance = Math.floor(Math.random() * 100) + luck; //return 1-100
        if(chance > 50){
            sql.run(`UPDATE scores SET money = ${row.money + parseInt(gambleAmount)} WHERE userId = ${message.author.id}`);
            message.reply("💰 You just won $" + gambleAmount * 2 + "!");
        }
        else{
            message.reply("<:peeposad:461045610372530177> You just lost $" + gambleAmount + "!");
            sql.run(`UPDATE scores SET money = ${parseInt(row.money - gambleAmount)} WHERE userId = ${message.author.id}`);
        }
    }
}

module.exports = new Methods();