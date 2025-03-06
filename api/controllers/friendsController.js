const db = require('../db/queries');


exports.addFriend = async(req, res) => {
    const { friendId } = req.body;
    const { user2 } = await db.addFriend(req.user.id, +friendId);
    const friend = user2;
    const io = req.app.get('io');
    io.to(`user${friendId}`).emit('new friend', (req.user.id))
    return res.json({friend})
}

exports.removeFriend = async(req, res) => {
    const { friendId } = req.body;
    await db.removeFriend(req.user.id, +friendId);
    const io = req.app.get('io');
    io.to(`user${friendId}`).emit('remove friend', (req.user.id))
    return res.json({done: true})
}