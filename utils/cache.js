const nodecache = require('node-cache');
// could rewrite with redis in future

class Cache {
    constructor(){
        this.cache = new nodecache({
            stdTTL: 3600
        });
    }
    set(key, value, ttl = 3600){
        return this.cache.set(key, value, ttl);
    }

    get(key){
        return this.cache.get(key);
    }

    del(key){
        return this.cache.del(key);
    }

    getTTL(key, formatDate = false){
        if(formatDate) return this.getShortDate(cache.getTtl(key));
        else return this.cache.getTtl(key);
    }

    flushAll(){
        this.cache.flushAll();
    }

    getStats(){
        return this.cache.getStats();
    }

    getShortDate(date){
        var convertedTime = new Date(date).toLocaleString('en-US', {
            timeZone: 'America/New_York'
        });
        convertedTime = new Date(convertedTime);
        
        var d = convertedTime;
        var month = d.getMonth() + 1;
        var day = d.getDate();
        var year = d.getFullYear();
        var time = d.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}).replace(' ', '');
        
        return month + '/' + day + '/' + year.toString().slice(2) + ' ' + time + ' EST';
    }
}

const cacheObj = {
    prefixes: new Cache(),
    lb: new Cache(),
    hourly: new Cache(),
    vote: new Cache(),
    deactivate: new Cache(),
    activate: new Cache(),
    trivia: new Cache(),
    scramble: new Cache(),
    jackpot: new Cache(),
    blackjack: new Cache(),
    slots: new Cache(),
    roulette: new Cache(),
    coinflip: new Cache(),
    xp_potion: new Cache(),
    airdrop: new Cache(),
    event: new Cache(),
    heal: new Cache(),
    peck: new Cache(),
    shield: new Cache(),
    attack: new Cache(),
    raid: new Cache(),
    raided: new Cache(),
    getTypes: function(){
        return Object.keys(cacheObj).sort();
    }
}

Object.defineProperty(cacheObj, 'getTypes', { enumerable: false });

module.exports = cacheObj