module.exports.voteReward = function(sql, voter, config, Discord) {
    console.log(`User with ID ${voter.user} just voted!`);
    if(config.debug == "true") return;
    let itemReward = "";
    sql.get(`SELECT * FROM items i
            JOIN scores s
            ON i.userId = s.userId
            WHERE s.userId="${voter.user}"`).then(row => {
        let chance = Math.floor(Math.random() * 101) + row.luck; 
        if(chance <= 30){ //30%
            itemReward = "📦 You received **$2000**!";
            sql.run(`UPDATE scores SET money = ${row.money + 2000} WHERE userId = ${voter.user}`);
        }
        else if(chance <= 60){ //30%
            itemReward = "📦 You received **2x item_box**!";
            sql.run(`UPDATE items SET item_box = ${row.item_box + 2} WHERE userId = ${voter.user}`);
        }
        else{ //40%
            itemReward = "🍀 Your luck pays off!\nYou received an **ultra_box**!";
            sql.run(`UPDATE items SET ultra_box = ${row.ultra_box + 1} WHERE userId = ${voter.user}`);
        }
        voteCooldown.add(voter.user);
        sql.run(`UPDATE scores SET voteTime = ${(new Date()).getTime()} WHERE userId = ${voter.user}`);

        const voteEmbed = new Discord.RichEmbed()
        .setTitle("Thanks for voting!")
        .setDescription(itemReward)
        .setFooter("Vote every 12 hours for a reward")
        .setImage("https://cdn.discordapp.com/attachments/454163538886524928/543014649554272277/greypleLine.png")
        client.users.get(voter.user).send(voteEmbed);
        setTimeout(() => {
            voteCooldown.delete(voter.user);
            sql.run(`UPDATE scores SET voteTime = ${0} WHERE userId = ${voter.user}`);
        }, 43300 * 1000);
    }).catch(error => {
        console.log("Error messaging voter: "+ error);
    });
}