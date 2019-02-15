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
}

module.exports = new Methods();