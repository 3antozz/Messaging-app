const prisma = require('./client');

// User Queries ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
// 
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
        },
        omit: {
            password: true,
            bio: true,
            username: true
        },
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
                orderBy: [
                    {lastMessageTime: {
                        sort: 'desc',
                        nulls: 'last'
                    }},
                    {creationDate: 'desc'}
                ]
            }
        }
    })
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
exports.updateProfile = async(userId, first_name = null, last_name = null, bio = '', url = null) => {
    const data = {
        bio
    };
    if(first_name) data.first_name = first_name;
    if(last_name) data.last_name = last_name;
    if(url) data.picture_url = url
    return prisma.user.update({
        where: {
            id: userId
        },
        data: data,
        omit: {
            password: true,
            bio: true,
            username: true
        }
    })
}
exports.addUser = async(groupId, userId) => {
    return await prisma.conversation.update({
        where: {
            id: groupId
        },
        data: {
            participants: {
                connect: {
                    id: userId
                }
            }
        },
        include: {
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

exports.getUser = async(username) => {
    return await prisma.user.findUnique({
        where: {
            username
        }
    })
}

exports.removeUser = async(groupId, userId) => {
    return await prisma.conversation.update({
        where: {
            id: groupId
        },
        data: {
            participants: {
                disconnect: {
                    id: userId
                }
            }
        }
    })
}

// Group Queries ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
// 

exports.getPublicGroup = async () => {
    return await prisma.conversation.findUnique({
        where: {
            identifier: 'public_group'
        },
        include: {
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
        }
    })
}
exports.getGroup = async(userId, id) => {
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
                },
                orderBy: [
                    {first_name: 'asc'},
                    {last_name: 'asc'}
                ]
            },
            admin: {
                omit: {
                    password: true,
                    bio: true,
                    username: true 
                }
            }
        }
    })
}
exports.createGroup = async(adminId, name) => {
    return await prisma.conversation.create({
        data: {
            admin: {
                connect: {
                    id: adminId
                }
            },
            participants: {
                connect: {
                    id: adminId
                }
            },
            group_name: name,
            isGroup: true
        },
        include: {
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
        }
    })
}
exports.updateGroup = async(groupId, name = null, url = null) => {
    const data = {};
    if(name) data.group_name = name;
    if(url) data.picture_url = url
    return prisma.conversation.update({
        where: {
            id: groupId
        },
        data: data,
    })
}

// Conversation Queries ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
//

exports.getPublicConversation = async () => {
    return await prisma.conversation.findUniqueOrThrow({
        where:{
            identifier: 'public_group'
        },
        include:{
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
                omit: {
                    password: true,
                    bio: true,
                    username: true
                },
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

        },
    })
}

// Friend Queries ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
//

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
        },
        select: {
            user2: {
                omit: {
                    password: true,
                    bio: true,
                    username: true,
                }
            },
        }
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

// Message Queries ____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
//

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