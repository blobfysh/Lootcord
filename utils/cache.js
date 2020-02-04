const nodecache = require('node-cache');
const cache = new nodecache({
    stdTTL: 43200
});

class Cache {
    set(key, value){
        return cache.set(key, value);
    }

    get(key){
        return cache.get(key);
    }

    del(key){
        cache.del(key);
    }

    getTTL(key, formatDate = false){
        if(formatDate) return this.getShortDate(cache.getTtl(key));
        else return cache.getTtl(key);
    }

    flushAll(){
        cache.flushAll();
    }

    getStats(){
        return cache.getStats();
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

module.exports = new Cache();