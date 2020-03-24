const redis = require('redis');
const client = new redis.createClient();

exports.set = function(key, value, ttl = 3600){
    return new Promise((resolve, reject) => {
        client.set(key, value, (err, result) => {
            if(err) return reject(err);
            client.expire(key, ttl, (err, result) => {
                resolve(result);
            });
        });
    });
}

exports.setNoExpire = function(key, value){
    return new Promise((resolve, reject) => {
        client.set(key, value, (err, result) => {
            if(err) return reject(err);
            
            resolve(result);
        });
    });
}

exports.hmset = function(key, value){
    return new Promise((resolve, reject) => {
        client.hmset(key, value, (err, result) => {
            if(err) return reject(err);
            
            resolve(result);
        });
    });
}

exports.get = function(key){
    return new Promise((resolve, reject) => {
        client.get(key, (err, result) => {
            if(err) return reject(err);

            resolve(result);
        });
    });
}

exports.hmget = function(key){
    return new Promise((resolve, reject) => {
        client.hmget(key, (err, result) => {
            if(err) return reject(err);

            resolve(result);
        });
    });
}

exports.del = function(key){
    return new Promise((resolve, reject) => {
        client.del(key, (err, result) => {
            if(err) return reject(err);

            resolve(result);
        });
    });
}

exports.getTTL = function(key, options = {formatDate: false, getEPOCH: false}){
    return new Promise((resolve, reject) => {
        client.ttl(key, (err, result) => {
            if(err) return reject(err);

            if(result === -1) return resolve(-1);
            if(result < 0) return resolve(null);
            if(options.getEPOCH) return resolve(Date.now() + (result * 1000));
            if(options.formatDate) return resolve(exports.getShortDate(Date.now() + (result * 1000)));
            resolve(result);
        });
    });
}

exports.flushAll = function(){
    return new Promise((resolve, reject) => {
        client.flushdb((err, result) => {
            if(err) return reject(err);
            resolve(result);
        });
    });
}

exports.getStats = function(){
    return new Promise((resolve, reject) => {
        client.info((err, result) => {
            if(err) return reject(err);
            resolve(result);
        });
    });
}

exports.getShortDate = function(date){
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

client.on('connect', function(){
    console.log('[CACHE] Redis connected');
});

client.on('error', function(err){
    console.error('[CACHE]');
    console.error(err);
});