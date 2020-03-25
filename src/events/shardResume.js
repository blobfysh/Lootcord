exports.run = function(id){
    console.error('Shard ' + id + ' resumed');
    this.cache.incr('shards_resumed');
}