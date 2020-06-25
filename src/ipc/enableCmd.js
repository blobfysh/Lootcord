exports.run = function(msg){
    this.sets.disabledCommands.delete(msg.cmd);
}