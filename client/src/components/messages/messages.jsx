import styles from './messages.module.css'
import { AuthContext } from '../../contexts'
import { useContext, useEffect, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useInView } from 'react-intersection-observer';
import { SendHorizontal, LoaderCircle } from 'lucide-react';


const Message = ({message, index, conversation, otherUser, root}) => {
    const {ref, inView} = useInView({
        triggerOnce: false,
        root: root,
        rootMargin: "150px 150px 4000px 150px",
    })
    const [messagesReady, setMessagesReady] = useState(false);

    useEffect(() => {
        setMessagesReady(false);
        setTimeout(() => {
            setMessagesReady(true);
        }, 700); 
    }, [conversation]);
    if(!message || !conversation) {
        return <p>Loading</p>
    }
    return (
    <li className={styles.message} ref={ref}>
        {inView || !messagesReady ? 
        <div className={message.senderId === otherUser.id ? null : `${styles.yourDiv}` }>
            {(index === conversation.messages.length-1 || conversation.messages[index+1].senderId !== message.senderId) ? 
            message.senderId === otherUser.id && (message.sender.picture_url ? <img src={message.sender.picture_url} alt={`${message.sender.first_name} ${message.sender.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>) : <div className={styles.void}></div>}
            <div>
                <p className={message.senderId === otherUser.id ? `${styles.messageContent} ${styles.otherMessage}` : `${styles.messageContent} ${styles.yourMessage}`}>{message.content}</p>
                <p className={styles.messageDate}>{message.date}</p>
            </div>
        </div> : <div className={styles.messageContent}>Loading Message</div>}
    </li>
    )
}

Message.propTypes = {
    message: PropTypes.object.isRequired,
    conversation: PropTypes.object.isRequired,
    otherUser: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    root: PropTypes.element
}

export default function Messages ({conversationID, setProfileID}) {
    const { user, token, socket } = useContext(AuthContext)
    const [messageInput, setMessageInput] = useState("");
    const [conversations, setConversations] = useState({})
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const [loading, setLoading] = useState(false)
    const conversation = useMemo(() => {
        return conversations[conversationID];
    },  [conversationID, conversations])
    const otherUser = useMemo(() => conversation && conversation.participants[0], [conversation])
    useEffect(() => {
        const fetchConversation = async() => {
            setLoading(true)
            console.log('conversation fetched!');
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/conversations/${conversationID}`, {
                    headers: {
                        'Authorization': `Bearer ${token.current}`
                    }
                })
                const response = await request.json();
                console.log(response);
                setConversations((prev) => ({...prev, [response.conversation.id]: response.conversation}))
            } catch(err) {
                console.log(err)
            } finally {
                setLoading(false)
            }
        }
        if(conversationID) {
            const convo = conversations[conversationID];
            if(!convo) {
                fetchConversation();
            }
            setTimeout(() => {
                if(inputRef.current) {
                    inputRef.current.focus();
                }
                const container = scrollRef.current;
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
                setTimeout(() => {
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                }, 20)
            }, 10)
        }
    }, [conversationID, conversations, token])
    useEffect(() => {
        const handleIncomingMessage = (msg) => {
            if (conversations[msg.conversationId]) {
                setConversations((prev) => ({...prev, [msg.conversationId]: {
                    ...prev[msg.conversationId], messages: [
                        ...prev[msg.conversationId].messages,
                        msg
                    ]  
                }}))
            }
        }
        const listener = socket.current
        if(socket.current) {
            socket.current.on('chat message', handleIncomingMessage)
        }
        return () => {
            if(listener) {
                listener.off('chat message', handleIncomingMessage);
            }
        };
    }, [conversations, socket])
    const handleMessageSend = async(e) => {
        e.preventDefault();
        if(!messageInput) {
            return;
        }
        try {
            socket.current.emit('chat message', {senderId: user.id, convoId: conversationID, message: messageInput, date: new Date()});
            setMessageInput('');
        } catch (error) {
            console.log(error)
        }
    }

    if (!conversation || !user || !otherUser || loading) {
        return (
            <section className={styles.messenger}>
            <div className={styles.info}>
                <button><img src='/images/no-profile-pic.jpg'></img></button>
                <button></button>
            </div>
            <div className={`${styles.mainLoading} ${styles.main}`}>
                <LoaderCircle  size={40} color='white' className={styles.loading}/>
            </div>
            <div className={styles.forms}>
                <form className={styles.messageDiv}>
                    <input name="message" id="message" placeholder='Send a message...' disabled></input>
                    <button><SendHorizontal color='white' /></button>
                </form>
                {/* <form className={styles.uploadDiv}>
                    <label htmlFor="image" hidden></label>
                    <input type="file" id='image' />
                    <button>Send Image</button>
                </form> */}
            </div>
        </section>
        )
    }
    return (
        <section className={styles.messenger}>
            <div className={styles.info}>
                {otherUser.picture_url ? <button onClick={() => setProfileID(otherUser.id)}><img src={otherUser.picture_url} alt={`${otherUser.first_name} ${otherUser.last_name} profile picture`}></img></button> : <button><img onClick={() => setProfileID(otherUser.id)} src='/images/no-profile-pic.jpg'></img></button>}
                <button onClick={() => setProfileID(otherUser.id)}>{otherUser.first_name} {otherUser.last_name}</button>
            </div>
            <div className={styles.main} ref={scrollRef}>
                <ul>
                {conversation.messages.map((message, index) => 
                    <Message key={message.id} root={scrollRef.current} index={index} message={message} conversation={conversation} otherUser={otherUser} />
                )}
                </ul>         
            </div>
            <div className={styles.forms}>
                <form className={styles.messageDiv} onSubmit={handleMessageSend}>
                    <label htmlFor="message" hidden></label>
                    <input name="message" id="message" onChange={(e) => setMessageInput(e.target.value)} placeholder='Send a message...' value={messageInput} ref={inputRef}></input>
                    <button><SendHorizontal color='white' /></button>
                </form>
                {/* <form className={styles.uploadDiv}>
                    <label htmlFor="image" hidden></label>
                    <input type="file" id='image' />
                    <button>Send Image</button>
                </form> */}
            </div>
        </section>
    )
}

Messages.propTypes = {
    conversationID: PropTypes.number.isRequired,
    setProfileID: PropTypes.func.isRequired,
}