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
                    },
                    messages: {
                        select: {
                            content: true,
                            date: true  
                        },
                        orderBy: {
                            date: 'desc'
                        },
                        take: 1
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

exports.getConversation = async(id) => {
    return await prisma.conversation.findUniqueOrThrow({
        where:{
            id
        },
        include:{
            participants: {
                omit: {
                    password: true,
                    bio: true,
                    username: true
                }
            },
            messages: {
                include: {
                    sender: {
                        omit: {
                            password: true,
                            bio: true,
                            username: true
                        }
                    }
                },
                orderBy: {
                    date: "asc"
                }
            }
        }
    })
}

exports.addMessage = async(convoId, content, senderId) => {
    return await prisma.conversation.update({
        where: {
            id: convoId
        },
        data: {
            messages: {
                create: {
                    content,
                    senderId
                }
            },
            lastMessageTime: new Date()
        }
    })
}