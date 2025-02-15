import styles from './messages.module.css'
import { AuthContext } from '../../contexts'
import { useContext, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
export default function Messages ({conversationID, setProfileID}) {
    const { user, token, socket } = useContext(AuthContext)
    const [conversation, setConversation] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const [isFetched, setFetched] = useState(false)
    const scrollRef = useRef(null);
    useEffect(() => {
        const fetchConversation = async() => {
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/conversations/${conversationID}`, {
                    headers: {
                        'Authorization': `Bearer ${token.current}`
                    }
                })
                const response = await request.json();
                console.log(response);
                setConversation(response.conversation);
            } catch(err) {
                console.log(err)
            }
        }
        if(conversationID) {
            fetchConversation();
        }
    }, [conversationID, token])
    useEffect(() => {
        const container = scrollRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [isFetched])
    const handleMessageSend = async(e) => {
        e.preventDefault();
        if(!messageInput) {
            return;
        }
        try {
            socket.current.emit('chat message', messageInput);
            const request = await fetch(`${import.meta.env.VITE_API_URL}/messages/${conversationID}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.current}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: messageInput
                })
            })
            const response = await request.json();
            setFetched(false)
            setMessageInput('');
            console.log(response);
          } catch(err) {
            console.log(err)
          }
    }
    if (!conversation || !user) {
        return <h1>Loading</h1>
    }
    return (
        <section className={styles.messenger}>
            <div className={styles.info}>
                {conversation.participants[0].picture_url ? <button onClick={() => setProfileID(conversation.participants[0].id)}><img src={conversation.participants[0].picture_url} alt={`${conversation.participants[0].first_name} ${conversation.participants[0].last_name} profile picture`}></img></button> : <button><img onClick={() => setProfileID(conversation.participants[0].id)} src='/images/no-profile-pic.jpg'></img></button>}
                <button onClick={() => setProfileID(conversation.participants[0].id)}>{conversation.participants[0].first_name} {conversation.participants[0].last_name}</button>
            </div>
            <div className={styles.main} ref={scrollRef}>
                <ul>
                {conversation.messages.map(message => 
                <li key={message.id} className={styles.message}>
                    <div>
                        {message.sender.picture_url ? <img src={message.sender.picture_url} alt={`${message.sender.first_name} ${message.sender.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                        <div>
                            <p className={message.senderId === conversation.participants[0].id ? `${styles.messageContent} ${styles.otherMessage}` : `${styles.messageContent} ${styles.yourMessage}` }>{message.content}</p>
                            <p className={styles.messageDate}>{message.date}</p>
                        </div>
                    </div>
                    {/* <div>
                        <div className={styles.messageInfo}>
                            <p className={styles.messageDate}>{message.date}</p>
                        </div>
                        <p>{message.content}</p>
                    </div> */}
                </li>)}
                </ul>
            </div>
            <div>
                <form className={styles.messageDiv} onSubmit={handleMessageSend}>
                    <label htmlFor="message" hidden></label>
                    <textarea name="message" id="message" onChange={(e) => setMessageInput(e.target.value)} placeholder='Send a message...' value={messageInput}></textarea>
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