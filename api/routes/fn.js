const db = require('../db/queries')
const jwt = require('jsonwebtoken');

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
            console.log("this null?: " + accessToken);
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