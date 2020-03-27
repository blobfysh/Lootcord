
module.exports = {
    name: 'trivia',
    aliases: [''],
    description: 'Answer a random question for a reward!',
    long: 'Answer a random trivia question for a reward! Rewards range from `item_box`\'s to `ultra_box`\'s.',
    args: {},
    examples: ["trivia"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const triviaCD = await app.cd.getCD(message.author.id, 'trivia');

        if(triviaCD){
            return message.reply(`You need to wait \`${triviaCD}\` before using this command again`);
        }

        await app.cd.setCD(message.author.id, 'trivia', app.config.cooldowns.trivia * 1000);
        
        let chance = Math.floor(Math.random() * Object.keys(app.trivia_questions).length); //returns value 0 between LENGTH OF JSON FILE

        let questionInfo = app.trivia_questions[chance].question;
        let questionA = app.trivia_questions[chance].a;
        let questionB = app.trivia_questions[chance].b;
        let questionC = app.trivia_questions[chance].c;
        let questionD = app.trivia_questions[chance].d;

        const embedTrivia = new app.Embed()
        .setAuthor('Category - ' + app.trivia_questions[chance].category)
        .setTitle(questionInfo)
        .setColor(16777215)
        .setDescription(`🇦: ${questionA}\n🇧: ${questionB}\n🇨: ${questionC}\n🇩: ${questionD}`)
        .setFooter('You have 15 seconds to answer.')

        const botMessage = await message.channel.createMessage(embedTrivia);

        try{
            const collected = await app.react.getFirstReaction(message.author.id, botMessage, 15000, ['🇦', '🇧', '🇨', '🇩']);

            if(collected === '🇦' && app.trivia_questions[chance].correct_answer == "a"){
                
                triviaReward();
            }
            else if(collected === '🇧' && app.trivia_questions[chance].correct_answer == "b"){
                
                triviaReward();
            }
            else if(collected === '🇨' && app.trivia_questions[chance].correct_answer == "c"){
                
                triviaReward();
            }
            else if(collected === '🇩' && app.trivia_questions[chance].correct_answer == "d"){
                
                triviaReward();
            }
            else{
                const embedWrong = new app.Embed() 
                .setTitle('INCORRECT')
                .setColor(13632027)
                .addField("Reward", "`shame`")
                botMessage.edit(embedWrong);
            }

            async function triviaReward(){
                let chanceR = Math.floor(Math.random() * 10); //returns 0-9 (10% chance)
                
                let rewardItem = "";
                const hasenough = await app.itm.hasSpace(message.author.id, 2);
                if (chanceR <= 0 && hasenough){
                    rewardItem = app.itemdata['ultra_box'].icon + "`ultra_box`";
                    await app.itm.addItem(message.author.id, 'ultra_box', 1);
                }
                else if (chanceR >= 5 && hasenough){
                    rewardItem = "2x " + app.itemdata['item_box'].icon + "`item_box`";
                    await app.itm.addItem(message.author.id, 'item_box', 2);
                }
                else{//40% chance
                    rewardItem = "`$1,000`";
                    await app.player.addMoney(message.author.id, 1000);
                }
                const embedReward = new app.Embed()
                .setTitle(`${(app.trivia_questions[chance][app.trivia_questions[chance].correct_answer]).toUpperCase()} IS CORRECT`)
                .setColor(720640)
                .addField("Reward", rewardItem)
                botMessage.edit(embedReward);
            }
        }
        catch(err){
            embedTrivia.setFooter('You ran out of time!');
            botMessage.edit(embedTrivia);
        }
    },
}