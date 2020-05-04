
module.exports = {
    name: 'trivia',
    aliases: [''],
    description: 'Answer a random question for a reward!',
    long: 'Answer a random trivia question for a reward! Rewards range from `item_box`\'s to `ultra_box`\'s.',
    args: {},
    examples: [],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const triviaCD = await app.cd.getCD(message.author.id, 'trivia');

        if(triviaCD){
            return message.reply(`You just played a game of trivia! Please wait \`${triviaCD}\` before playing another.`);
        }

        await app.cd.setCD(message.author.id, 'trivia', app.config.cooldowns.trivia * 1000);
        
        let chance = Math.floor(Math.random() * Object.keys(app.trivia_questions).length); //returns value 0 between LENGTH OF JSON FILE

        let questionInfo = app.trivia_questions[chance].question;
        let questionA = app.trivia_questions[chance].a;
        let questionB = app.trivia_questions[chance].b;
        let questionC = app.trivia_questions[chance].c;
        let questionD = app.trivia_questions[chance].d;
        
        let chanceR = Math.floor(Math.random() * 10); //returns 0-9 (10% chance)
        let reward = {};

        const hasenough = await app.itm.hasSpace(message.author.id, 2);
        if (chanceR <= 0 && hasenough){
            reward.display = app.itemdata['ultra_box'].icon + "`ultra_box`";
            reward.item = "ultra_box";
            reward.amount = 1;
        }
        else if (chanceR >= 5 && hasenough){
            reward.display = "2x " + app.itemdata['item_box'].icon + "`item_box`";
            reward.item = "item_box";
            reward.amount = 2;
        }
        else{
            reward.display = app.common.formatNumber(2500);
            reward.item = "money";
            reward.amount = 2500;
        }

        const embedTrivia = new app.Embed()
        .setAuthor('Category - ' + app.trivia_questions[chance].category)
        .setTitle(questionInfo)
        .setColor(16777215)
        .setDescription(`🇦 ${questionA}\n🇧 ${questionB}\n🇨 ${questionC}\n🇩 ${questionD}`)
        .addField("Reward", reward.display)
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
                .setTitle('Incorrect')
                .setColor(13632027)
                .addField("Reward", "`shame`")
                botMessage.edit(embedWrong);
            }

            async function triviaReward(){
                if(reward.item === 'money'){
                    await app.player.addMoney(message.author.id, reward.amount);
                }
                else{
                    await app.itm.addItem(message.author.id, reward.item, reward.amount);
                }

                const embedReward = new app.Embed()
                .setTitle(`${(app.trivia_questions[chance][app.trivia_questions[chance].correct_answer])} is correct!`)
                .setColor(720640)
                .addField("Reward", reward.display)
                botMessage.edit(embedReward);
            }
        }
        catch(err){
            embedTrivia.setFooter('You ran out of time!');
            botMessage.edit(embedTrivia);
        }
    },
}