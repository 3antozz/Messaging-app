import styles from './messages.module.css'
import { AuthContext } from '../../contexts'
import { useContext, useEffect, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
export default function Messages ({conversationID, setProfileID}) {
    const { user, token, socket } = useContext(AuthContext)
    const [messageInput, setMessageInput] = useState("");
    const [conversations, setConversations] = useState({})
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const conversation = useMemo(() => {
        return conversations[conversationID];
    },  [conversationID, conversations])
    const otherUser = useMemo(() => conversation && conversation.participants[0], [conversation])
    useEffect(() => {
        const fetchConversation = async() => {
            console.log('fetched!');
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
        const container = scrollRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
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
    if (!conversation || !user) {
        return <h1>Loading</h1>
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
                <li key={message.id} className={styles.message}>
                    <div className={message.senderId === otherUser.id ? null : `${styles.yourDiv}` }>
                        {(index === conversation.messages.length-1 || conversation.messages[index+1].senderId !== message.senderId) ? 
                        message.senderId === otherUser.id && (message.sender.picture_url ? <img src={message.sender.picture_url} alt={`${message.sender.first_name} ${message.sender.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>) : <div className={styles.void}></div>}
                        <div>
                            <p className={message.senderId === otherUser.id ? `${styles.messageContent} ${styles.otherMessage}` : `${styles.messageContent} ${styles.yourMessage}`}>{message.content}</p>
                            <p className={styles.messageDate}>{message.date}</p>
                        </div>
                    </div>
                </li>)}
                </ul>
            </div>
            <div>
                <form className={styles.messageDiv} onSubmit={handleMessageSend}>
                    <label htmlFor="message" hidden></label>
                    <textarea name="message" id="message" onChange={(e) => setMessageInput(e.target.value)} placeholder='Send a message...' value={messageInput} ref={inputRef}></textarea>
                    <button>Send Message</button>
                </form>
                <form className={styles.uploadDiv}>
                    <label htmlFor="image" hidden></label>
                    <input type="file" id='image' />
                    {/* <button>Send Image</button> */}
                </form>
            </div>
        </section>
    )
}

Messages.propTypes = {
    conversationID: PropTypes.number.isRequired,
    setProfileID: PropTypes.func.isRequired,
}