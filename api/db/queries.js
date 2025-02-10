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
        },
        omit: {
            id: true,
        }
    })
}

exports.getUserForClient = async(username) => {
    return await prisma.user.findUnique({
        where: {
            username
        },
        omit: {
            id: true,
            password: true,
        },
        include: {
            conversations: {
                include: {
                    participants: {
                        omit: {
                            password: true,
                            bio: true,
                            username: true
                        }
                    }
                }
            }
        }
    })
}


exports.addFriend = async(username, friendName) => {
    return await prisma.$transaction([
        prisma.user.update({
            where: {
                username
            },
            data: {
                friends: {
                    connect: {
                        username: friendName
                    }
                },
            },
        }),
        prisma.conversation.create({
            data: {
                participants: {
                    connect: [
                        {username},
                        {username: friendName}
                    ]
                }
            }
        })
    ])
}

exports.removeFriend = async(username, friendName) => {
    return await prisma.user.update({
        where: {
            username
        },
        data: {
            friends: {
                disconnect: {
                    username: friendName
                }
            }
        }
    })
}