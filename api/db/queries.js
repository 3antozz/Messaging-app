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
                            date: true  
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
                create: {
                    participants: {
                        connect: [
                            { id: userId },
                            { id: friendId }
                        ]
                    }
                }
            }
        }
    })
}


exports.removeFriend = async(userId, friendId) => {
    return await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            friends: {
                disconnect: {
                    id: friendId
                }
            }
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

// exports.addMessage = async(convoId, content, senderId) => {
//     return await prisma.conversation.update({
//         where: {
//             id: convoId
//         },
//         data: {
//             messages: {
//                 create: {
//                     content,
//                     senderId
//                 }
//             },
//             lastMessageTime: new Date()
//         }
//     })
// }

// exports.addMessage = async(convoId, content, senderId) => {
//     return await prisma.message.create({
//         data: {
//             conversationId: convoId,
//             content,
//             senderId
//         },
//         include: {
//             sender: {
//                 omit: {
//                     password: true,
//                     bio: true,
//                     username: true
//                 }
//             }
//         }
//     })
// }

exports.addMessage = async(convoId, content, senderId, date) => {
    const result = await prisma.$transaction([
        prisma.message.create({
            data: {
                conversationId: convoId,
                content,
                senderId
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