
class Common {
    constructor(icons){
        this.icons = icons;
    }

    formatNumber(number, noEmoji = false){
        if(noEmoji){
            return "$" + (parseInt(number)).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
        }
        else{
            return this.icons.money + " " + (parseInt(number)).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$&,');
        }
    }
    
    calculateXP(playerXP, playerLVL){
        let currLvlXP = 0;

        for(let i = 1; i <= playerLVL; i++){
            if(i == playerLVL){
                break;
            }
            currLvlXP += Math.floor(50*(i**1.7));
        }

        return {
            current: playerXP - currLvlXP,
            needed: Math.floor(50 * (playerLVL ** 1.7))
        }
    }
}

module.exports = Common;