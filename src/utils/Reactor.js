const ReactionHandler = require('eris-reactions');

class Reactor {
    constructor(icons){
        this.icons = icons;
    }

    /**
     * Sends message with question and reactions and waits for response
     * @param {*} userId ID of user to await reaction from
     * @param {string} botMessage Bot message to add reactions to
     * @param {number} time Time in milliseconds to wait
     * @returns {boolean} Whether or not they confirmed
     */
    async getConfirmation(userId, botMessage, time = 30000){
        try{
            await botMessage.addReaction(this.icons.confirm);
            await botMessage.addReaction(this.icons.cancel);
            const reaction = await ReactionHandler.collectReactions(botMessage, (reactorId) => reactorId === userId, {maxMatches: 1, time: time});
        
            if(reaction[0].emoji.name === this.icons.confirm) return true;
            else return false;
        }
        catch(err){
            throw new Error('Ran out of time.');
        }
    }
}

module.exports = Reactor;