const db = require('../db/queries');

exports.createConversation = async(req, res) => {
    const user1 = +req.user.id;
    const user2 = +req.params.userId;
    const conversation = await db.createConversation(user1, user2)
    const io = req.app.get('io');
    io.to(`user${user2}`).emit('new convo', JSON.stringify(JSON.parse(JSON.stringify(conversation))))
    res.json({conversation})
}

exports.getPublicConversation = async(req, res) => {
    const conversation = await db.getPublicConversation();
    res.json({conversation})
}

exports.getConversation = async(req, res) => {
    const convoId = +req.params.convoId;
    const conversation = await db.getConversation(req.user.id, convoId);
    return res.json({conversation});
}