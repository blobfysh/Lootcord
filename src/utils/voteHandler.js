exports.handle = async function({ vote }){
    const voteCD = await this.cd.getCD(vote.user, 'vote');

    if(voteCD){
        console.log('[VOTE] Received a vote but ignored it due to user having already voted in past 12 hours: ' + vote.user)
        return;
    }

    let account = await this.player.getRow(vote.user);
    if(!account) {    
        await this.player.createAccount(vote.user);

        account = await this.player.getRow(vote.user);
    }

    let itemReward;
    if((account.voteCounter + 1) % 6 == 0){
        itemReward = "✨ You received a **supply_signal** for voting 6 days in a row! 😃";
        await this.itm.addItem(vote.user, 'supply_signal', 1);
    }
    else{
        itemReward = "📦 You received an **ultra_box**!";
        await this.itm.addItem(vote.user, 'ultra_box', 1);
    }

    await this.cd.setCD(vote.user, 'vote', 43200 * 1000);
    await this.query(`UPDATE scores SET voteCounter = voteCounter + 1 WHERE userId = ${vote.user}`);

    try{
        this.common.messageUser(vote.user, {
            content: '**Thanks for voting!**\n' + itemReward,
            embed: getCounterEmbed(this, account.voteCounter + 1).embed
        });
    }
    catch(err){
    }
}

function getCounterEmbed(app, counterVal){
    var rewardString = '';
    var counterDayVal = counterVal % 6 == 0 ? 6 : counterVal % 6;
    
    for(var i = 0; i < 5; i++){
        // Iterate 5 times
        if(counterDayVal >= i + 1){
            rewardString += '☑ Day ' + (i + 1) + ': `ultra_box`\n';
        }
        else{
            rewardString += '❌ Day ' + (i + 1) + ': `ultra_box`\n';
        }
    }
    
    if(counterVal % 6 == 0){
        rewardString += '✨ Day 6: `supply_signal`';
    }
    else{
        rewardString += '❌ Day 6: `supply_signal`';
    }

    const embed = new app.Embed()
    .setTitle('Voting rewards!')
    .setDescription(rewardString)
    .setFooter('Vote 6 days in a row to receive a supply_signal!')
    .setColor(9043800)

    return embed;
}