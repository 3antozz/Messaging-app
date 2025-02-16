const db = require('../db/queries')
exports.postMessage = async(req, res) => {
    const convoId = +req.params.convoId;
    const { content } = req.body;
    const senderId = +req.user.id
    await db.addMessage(convoId, content, senderId);
    res.json({done: true})
}


exports.postMessageSocket = async (convoId, content, senderId, date) => {
    return await db.addMessage(convoId, content, senderId, new Date(date));
}