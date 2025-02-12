import styles from './messages.module.css'
import { AuthContext } from '../../contexts'
import { useContext, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
export default function Messages ({conversationID}) {
    const { user, token } = useContext(AuthContext)
    const [conversation, setConversation] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const [isFetched, setFetched] = useState(false)
    const scrollRef = useRef(null);
    let otherParticipant;
    if(user && conversation) {
        otherParticipant = conversation.participants.filter((participant) => participant.id !== user.id)[0];
    }

    useEffect(() => {
        const fetchConversation = async() => {
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/conversations/${conversationID}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                const response = await request.json();
                console.log(response);
                setConversation(response.conversation);
                setFetched(true)
            } catch(err) {
                console.log(err)
            }
        }
        if(conversationID && !isFetched) {
            fetchConversation();
        }
    }, [conversationID, isFetched, token])
    useEffect(() => {
        const container = scrollRef.current;
        if (container) {
            console.log('hello?')
            container.scrollTop = container.scrollHeight;
        }
    }, [isFetched])
    const handleMessageSend = async(e) => {
        e.preventDefault();
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/messages/${conversationID}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
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
    if (!conversation) {
        return <h1>Loading</h1>
    }
    return (
        <section className={styles.messenger}>
            <div className={styles.info}>
                {otherParticipant.picture_url ? <img src={otherParticipant.picture_url} alt={`${otherParticipant.first_name} ${otherParticipant.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                <h3>{otherParticipant.first_name} {otherParticipant.last_name}</h3>
            </div>
            <div className={styles.main} ref={scrollRef}>
                <ul>
                {conversation.messages.map(message => 
                <li key={message.id} className={styles.message}>
                    <div>
                        {message.sender.picture_url ? <img src={message.sender.picture_url} alt={`${message.sender.first_name} ${message.sender.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                        <div>
                            <p className={message.senderId === otherParticipant.id ? `${styles.messageContent} ${styles.otherMessage}` : `${styles.messageContent} ${styles.yourMessage}` }>{message.content}</p>
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
                    <input type="file" />
                    {/* <button>Send Image</button> */}
                </form>
            </div>
        </section>
    )
}

Messages.propTypes = {
    conversationID: PropTypes.number.isRequired
}