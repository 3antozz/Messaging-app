const db = require('../db/queries')
const jwt = require('jsonwebtoken');
const { format } = require('date-fns');

exports.isAuthenticated = (req, res, next) => {
    if (!req.headers.authorization) {
        const error = new Error('No auth header!')
        error.code = 400;
        return next(error);
    }
    const auth = req.headers.authorization.split(" ");
    const accessToken = auth[1];
    if(auth[0] !== "Bearer") {
        const error = new Error('No bearer!')
        error.code = 400;
        return next(error);
    }
    if(!accessToken) {
        const error = new Error('No token!')
        error.code = 400;
        return next(error);
    }
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY, async(err, decoded) => {
        if(err) {
            const error = new Error(err.message)
            error.code = 401;
            return next(error)
        }
        try {
            const user = await db.getUserForClient(decoded.username);
            req.user = user;
            return next();
        } catch(err) {
            return next(err)
        }
    })
}

exports.formatDate = (date) => {
    return format(new Date(date), 'PP, H:mm');
}

exports.formatDateWithoutTime = (date) => {
    return format(new Date(date), 'dd-MM-y');
}


exports.mergeFriends = (user) => {
    const mergedFriends = [
        ...user.friends.map(f => ({
            id: f.user2.id,
            first_name: f.user2.first_name,
            last_name: f.user2.last_name,
            picture_url: f.user2.picture_url,
            conversationId : f.conversationId
        })),
        ...user.friends2.map(f => ({
            id: f.user1.id,
            first_name: f.user1.first_name,
            last_name: f.user1.last_name,
            picture_url: f.user1.picture_url,
            conversationId : f.conversationId
        })),
    ];
    // eslint-disable-next-line no-unused-vars
    const {friends, friends2, ...rest} = user;
    return {...rest, friends: mergedFriends}
}