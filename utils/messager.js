exports.messageUser = (manager, userId, message) => {
    manager.broadcast({
        userId: userId,
        msgToSend: message
    });
}