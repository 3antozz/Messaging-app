const prisma = require('./client');



exports.createUser = async(username, first_name, last_name, password) => {
    return await prisma.user.create({
        data: {
            username,
            first_name,
            last_name,
            password
        }
    })
}

exports.getUser = async(username) => {
    return await prisma.user.findUnique({
        where: {
            username
        }
    })
}