exports.run = function(msg){
    this.sets.disabledCommands.add(msg.cmd);
}