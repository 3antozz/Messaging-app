const db = require('../db/queries');
const fn = require('../routes/fn');

exports.createConversation = async(req, res) => {
    const user1 = +req.user.id;
    const user2 = +req.params.userId;
    const conversation = await db.createConversation(user1, user2)
    const io = req.app.get('io');
    io.to(`user${user2}`).emit('new convo', JSON.stringify(JSON.parse(JSON.stringify(conversation))))
    res.json({conversation})
}

exports.getPublicConversation = async(req, res) => {
    const convo = await db.getPublicConversation();
    const formattedMessages = convo.messages.map((message) => ({ ...message, date: fn.formatDate(message.date)}))
    const conversation = { ...convo, messages: formattedMessages}
    res.json({conversation})
}

exports.getConversation = async(req, res) => {
    const convoId = +req.params.convoId;
    const convo = await db.getConversation(req.user.id, convoId);
    const formattedMessages = convo.messages.map((message) => ({ ...message, date: fn.formatDate(message.date)}))
    const newConvo = { ...convo, messages: formattedMessages}
    return res.json({conversation: newConvo});
}