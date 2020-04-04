exports.run = function(id){
    console.warn('Shard ' + id + ' resumed');
    this.cache.incr('shards_resumed');
}