const express = require('express')
const path = require('node:path')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const authRouter = require('./routes/auth')
const friendsRouter = require('./routes/friends')
const convosRouter = require('./routes/conversations')
const messagesRouter = require('./routes/messages')
const usersRouter = require('./routes/users')
const messagesController = require('./controllers/messagesController')
const fn = require('./routes/fn')
const { createServer } = require('node:http');
const { Server } = require('socket.io');
require('./db/populate');
require('dotenv');


const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    },
    
});


const allowedOrigins = [
    'http://localhost:5173'
];
const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors((corsOptions)))
app.set('trust proxy', 1)
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

const onlineUsers = new Set();


io.on('connection', (socket) => {
    console.log('a user connected');
    onlineUsers.add(+socket.handshake.query.userId);
    socket.broadcast.emit('user connected', +socket.handshake.query.userId)
    socket.on('chat message', async(msgData) => {
        try {
            const message = await messagesController.postMessageSocket(+msgData.convoId, msgData.message, +msgData.senderId, msgData.date, msgData.url)
            if (message) {
                const formattedMessage = {...message, date: fn.formatDate(message.date)}
                io.to(`${msgData.convoId}`).emit('chat message', formattedMessage);
            }
        } catch(err) {
            console.log(err);
            io.to(msgData.convoId).emit('error', { message: "Failed to send message" });
        }
    });
    socket.on('join rooms', (conversationIds) => {
        socket.join(conversationIds);
    })
    socket.on('online friends', (friendIds) => {
        const onlineIds = [];
        friendIds.forEach(id => {
            if(onlineUsers.has(id)){
                onlineIds.push(id)
            }
            return;
        });
        socket.emit('online friends', onlineIds)
    })
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        onlineUsers.delete(+socket.handshake.query.userId);
        socket.broadcast.emit('user disconnected', +socket.handshake.query.userId)
    });
});


app.use('/', authRouter);
app.use('/friends', friendsRouter)
app.use('/conversations', convosRouter)
app.use('/messages', messagesRouter)
app.use('/users', usersRouter)


app.use((req, res, next) => {
    const error = new Error('404 Not Found')
    error.code = 404;
    next(error)
})



// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
    console.log(error);
    if (Array.isArray(error)) {
        return res.status(error.code || 500).json({
            errors: error,
            code: error.code || 500
        });
    }
    if (error.code === 'P2025') {
        return res.status(400).json({
            message: "Resource Not Found",
            code: 400
        });
    }
    if (error.code === 'P2002') {
        return res.status(400).json({
            errors: ['Username already taken'],
            code: 400
        });
    }
    res.status(error.code || 500).json({
        message: error.message || 'Internal Server Error',
        code: error.code || 500
    });
})





server.listen(3000, () => console.log('Server Listening on port 3000'));
