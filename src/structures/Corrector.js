const levenshtein = require('js-levenshtein');

class Corrector {
    constructor(words, maxDistance = 2){
        this.words = words;
        this.maxDistance = maxDistance;
    }

    getWord(input){
        if(!input) return undefined;
        else if(this.words.includes(input)) return input;
        
        let compared = [];

        for(let word of this.words){
            compared.push({
                word,
                steps: levenshtein(input, word)
            });
        }

        compared.sort((a, b) => a.steps - b.steps);

        if(compared[0].steps <= this.maxDistance) return compared[0].word;

        return undefined;
    }
};

module.exports = Corrector;