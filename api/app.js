const express = require('express')
const path = require('node:path')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const authRouter = require('./routes/auth')
const friendsRouter = require('./routes/friends')
const convosRouter = require('./routes/conversations')
const messagesRouter = require('./routes/messages')


const app = express();


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



app.use('/', authRouter);
app.use('/friends', friendsRouter)
app.use('/conversations', convosRouter)
app.use('/messages', messagesRouter)

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





app.listen(3000, () => console.log('Server Listening on port 3000'));
