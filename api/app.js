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
const groupsRouter = require('./routes/groups')
const { createServer } = require('node:http');
const { Server } = require('socket.io');
require('./db/populate');
require('dotenv');


const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", process.env.FRONTEND_URL],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    },
    
});


const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL
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
app.set('io', io)

const onlineUsers = new Set();


io.on('connection', (socket) => {
    onlineUsers.add(+socket.handshake.query.userId);
    socket.broadcast.emit('user connected', +socket.handshake.query.userId)
    socket.on('chat message', async(msgData) => {
        try {
            const message = await messagesController.postMessageSocket(+msgData.convoId, msgData.message, +msgData.senderId, msgData.date, msgData.url)
            if (message) {
                io.to(`convo${msgData.convoId}`).emit('chat message', message);
            }
        } catch(err) {
            console.log(err);
            io.to(`convo${msgData.convoId}`).emit('error', { message: "Failed to send message" });
        }
    });
    socket.on('join rooms', (conversationIds) => {
        socket.join([`user${socket.handshake.query.userId}`, ...conversationIds]);
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
        onlineUsers.delete(+socket.handshake.query.userId);
        socket.broadcast.emit('user disconnected', +socket.handshake.query.userId)
    });
});


app.use('/', authRouter);
app.use('/friends', friendsRouter)
app.use('/conversations', convosRouter)
app.use('/messages', messagesRouter)
app.use('/users', usersRouter)
app.use('/groups', groupsRouter)


app.use((req, res, next) => {
    const error = new Error('404 Not Found')
    error.code = 404;
    next(error)
})



// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
    console.error("Global error handler caught:", error);
    if (Array.isArray(error)) {
        return res.status((typeof(error.code) !== 'string' && error.code) || 500).json({
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
    return res.status((typeof(error.code) !== 'string' && error.code) || 500).json({
        message: error.message || 'Internal Server Error',
        code: error.code || 500
    });
})





server.listen(port, () => console.log('Server Listening on port 3000'));
