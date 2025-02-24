const prisma = require('./client');



exports.createUser = async(username, first_name, last_name, password) => {
    return await prisma.user.create({
        data: {
            username,
            first_name,
            last_name,
            password,
            conversations: {
                connect: {
                    identifier: "public_group"
                }
            }
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

exports.getUserForClient = async(username) => {
    return await prisma.user.findUnique({
        where: {
            username
        },
        omit: {
            password: true,
        },
        include: {
            friends: {
                omit: {
                    user1Id: true,
                    user2Id: true
                },
                include: {
                    user2: {
                        omit: {
                            username: true,
                            password: true,
                            bio: true,
                            joinDate: true,
                        }
                    },
                }
            },
            friends2: {
                omit: {
                    user1Id: true,
                    user2Id: true
                },
                include: {
                    user1: {
                        omit: {
                            username: true,
                            password: true,
                            bio: true,
                            joinDate: true,
                        }
                    }
                }
            },
            conversations: {
                include: {
                    participants: {
                        where: {
                            NOT: {
                                username
                            }
                        },
                        omit: {
                            password: true,
                            bio: true,
                            username: true
                        }
                    },
                    messages: {
                        select: {
                            senderId: true,
                            content: true,
                            date: true,
                            sender: {
                                select: {
                                    first_name: true
                                }
                            }  
                        },
                        orderBy: {
                            date: 'desc'
                        },
                        take: 1
                    }
                },
                orderBy: {
                    lastMessageTime: 'desc'
                }
            }
        }
    })
}

exports.addFriend = async(userId, friendId) => {
    const existingConversation = await prisma.conversation.findFirst({
        where: {
            participants: {
                every: {
                    OR: [
                        {id: userId},
                        {id: friendId}
                    ]
                }
            }
        },
        select: {
            id: true
        }
    })
    return await prisma.friendship.create({
        data: {
            user1: {
                connect: {
                    id: userId
                }
            },
            user2: {
                connect: {
                    id: friendId
                }
            },
            conversation: {
                connectOrCreate: {
                    where: {
                        id: existingConversation && existingConversation.id || -1
                    },
                    create: {
                        participants: {
                            connect: [
                                {id: userId},
                                {id: friendId}
                            ]
                        }
                    }
                }
            }
        },
        select: {
            user2: {
                omit: {
                    password: true,
                    bio: true,
                    username: true,
                }
            },
            conversationId: true,
        }
    })
}

exports.createConversation = async(user1, user2) => {
    return await prisma.conversation.create({
        data: {
            participants: {
                connect: [
                    {id: user1},
                    {id: user2}
                ]
            }
        },
        include: {
            participants: {
                where: {
                    NOT: {
                        id: user1
                    }
                },
                omit: {
                    password: true,
                    bio: true,
                    username: true
                }
            },
            messages: {
                select: {
                    senderId: true,
                    content: true,
                    date: true  
                },
                orderBy: {
                    date: 'desc'
                },
                take: 1
            }
        },
    })
}


exports.removeFriend = async(userId, friendId) => {
    return await prisma.friendship.deleteMany({
        where: {
            OR: [
                { user1Id: userId, user2Id: friendId },
                { user1Id: friendId, user2Id: userId }
            ]
        }
    })
}

exports.getConversation = async(userId, id) => {
    return await prisma.conversation.findUniqueOrThrow({
        where:{
            id
        },
        include:{
            participants: {
                where: {
                    NOT: {
                        id: userId
                    }
                },
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


exports.addMessage = async(convoId, content, senderId, date, url) => {
    const result = await prisma.$transaction([
        prisma.message.create({
            data: {
                conversationId: convoId,
                content: content || null,
                senderId,
                picture_url: url
            },
            include: {
                sender: {
                    omit: {
                        password: true,
                        bio: true,
                        username: true
                    }
                }
            }
        }),
        prisma.conversation.update({
            where: { id: convoId },
            data: { lastMessageTime: date }
          })
    ])
    return result[0]
}

exports.getAllUsers = async(userId) => {
    return await prisma.user.findMany({
        where: {
            NOT: {
                id: userId
            }
        },
        omit: {
            username: true,
            password: true,
            bio: true,
            joinDate: true,
        },
        orderBy: [
            {first_name: 'asc'},
            {last_name: 'asc'}
        ]
    })
}

exports.getUserProfile = async(userId) => {
    return await prisma.user.findUniqueOrThrow({
        where: {
            id: userId
        },
        omit: {
            password: true,
            username: true,
        },
    })
}