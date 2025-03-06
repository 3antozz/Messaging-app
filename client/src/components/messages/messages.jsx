import styles from './messages.module.css'
import { AuthContext } from '../../contexts'
import { useContext, useEffect, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useInView } from 'react-intersection-observer';
import { SendHorizontal, LoaderCircle, Image, X, UserPlus } from 'lucide-react';


const Message = ({message, index, conversation, user, root}) => {
    const {ref, inView} = useInView({
        triggerOnce: false,
        root: root || document.getElementById('scrl'),
        rootMargin: "150px 150px 4000px 150px",
    })
    const [messagesReady, setMessagesReady] = useState(false);
    let isUserMessage;
    let shouldShowPictureGroup;
    if(user) {
        isUserMessage = message.senderId === user.id;
        shouldShowPictureGroup = index === conversation.messages.length-1 || conversation.messages[index+1].senderId !== message.senderId && conversation.messages[index+1].senderId !== user.id;
    } else {
        isUserMessage = false
        shouldShowPictureGroup = index === conversation.messages.length-1 || conversation.messages[index+1].senderId !== message.senderId;
    }
    const shouldShowPicture = index === conversation.messages.length-1 || conversation.messages[index+1].senderId !== message.senderId;
    const shouldShowSenderName = (index === 0 || conversation.messages[index-1].senderId !== message.senderId) && !isUserMessage && conversation.isGroup
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
    <li className={styles.message} ref={ref} style={{marginBottom: (shouldShowPictureGroup && conversation.isGroup) ? '2rem' : null }}>
        {inView || !messagesReady ? 
        <div className={!isUserMessage ? null : `${styles.yourDiv}`}>
            {shouldShowPicture ? 
            !isUserMessage && (<button><img loading='lazy' src={message.sender.picture_url || '/images/no-profile-pic.jpg'} alt={`${message.sender.first_name} ${message.sender.last_name} profile picture`} data-func='profile' id={message.sender.id}></img></button>) : <div className={styles.void}></div>}
            <div style={{marginBottom: shouldShowPicture ? '0.5rem' : null }} className={styles.msgDiv}>
                { shouldShowSenderName && <p className={styles.sender}>{message.sender.first_name}</p>}
                {message.picture_url && <img loading='lazy' style={{backgroundColor: '#ffffff00'}} src={message.picture_url} data-func='img' className={!isUserMessage ? `${styles.messageImage} ${styles.otherMessage}` : `${styles.messageImage} ${styles.yourMessage}`}/>}
                { message.content && <p className={!isUserMessage ? `${styles.messageContent} ${styles.otherMessage}` : `${styles.messageContent} ${styles.yourMessage}`}>{message.content}</p>}
                <p className={styles.messageDate}>{message.date}</p>
            </div>
        </div> : <div  style={{ height: message.picture_url ? "100px" : '40px' }} className={`${styles.messageContent} ${styles.yourDiv}`}></div>}
    </li>
    )
}

Message.propTypes = {
    message: PropTypes.object.isRequired,
    conversation: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    root: PropTypes.element
}

export default function Messages ({conversationID, setProfileID, setImageURL, setGroupID, setMembers}) {
    const { user, token, socket, socketOn } = useContext(AuthContext)
    const [messageInput, setMessageInput] = useState("");
    const [image, setImage] = useState(null);
    const [conversations, setConversations] = useState({})
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const fileRef = useRef(null);
    const fileDivRef = useRef(null);
    const [loading, setLoading] = useState(false)
    const [uploadError, setUploadError] = useState(false)
    const [isUploading, setUploading] = useState(false)
    const conversation = useMemo(() => {
        return conversations[conversationID];
    },  [conversationID, conversations])
    const otherUser = useMemo(() => conversation && !conversation.isGroup && conversation.participants[0], [conversation])
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
        const fetchPublicGroup = async () => {
            setLoading(true)
            console.log('conversation fetched!');
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/conversations/public`)
                const response = await request.json();
                console.log(response);
                setConversations((prev) => ({...prev, [response.conversation.id]: response.conversation}))
            } catch(err) {
                console.log(err)
            } finally {
                setLoading(false)
            }
        }
        if(conversationID && user) {
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
        if(conversationID && !user) {
            const convo = conversations[conversationID];
            if(!convo) {
                fetchPublicGroup();
            }
        }
    }, [conversationID, conversations, token, user])

    useEffect(() => {
        const updateGroup = (group) => {
            setConversations(prev => ({...prev, [group.id]: {...prev[group.id], picture_url: group.picture_url, group_name: group.group_name}}))
        }
        if(socketOn) {
            socket.current.on('group update', updateGroup);
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('group update', updateGroup);
            }
        };
    }, [socket, socketOn])

    useEffect(() => {
        let id;
        if(conversationID && !loading) {
            const container = scrollRef.current;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
            id = setTimeout(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }, 300)
        }
        return () => clearTimeout(id)
    }, [conversationID, loading])
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
        const listener = socket.current;
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
        if(!messageInput && !image) {
            return;
        }
        if(image) {
            setUploading(true)
            try {
                const form = new FormData();
                form.append('image', image)
                const request = await fetch(`${import.meta.env.VITE_API_URL}/messages/upload/${conversationID}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token.current}`,
                    },
                    body: form
                })
                const response = await request.json();
                if(!request.ok) {
                    const error = new Error(response.message)
                    throw error;
                }
                console.log(response);
                socket.current.emit('chat message', {senderId: user.id, convoId: conversationID, message: messageInput, url: response.url, date: new Date()});
                setMessageInput('');
                setUploadError(false)
                setImage(null)
                if(fileDivRef.current) {
                    fileDivRef.current.style.display = 'none'
                }
            } catch (error) {
                console.log(error)
                setUploadError(error.message)
            } finally {
                setUploading(false)
            }
        }
        if(messageInput && !image) {
            try {
                socket.current.emit('chat message', {senderId: user.id, convoId: conversationID, message: messageInput, url: null, date: new Date()});
                setMessageInput('');
                setImage(null)
                if(fileDivRef.current) {
                    fileDivRef.current.style.display = 'none'
                }
            } catch (error) {
                console.log(error)
            }
        }
        const container = scrollRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
        setTimeout(() => {
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 300)
    }

    const handleImageClick = (e) => {
        const element = e.target;
        if(element.dataset.func === "img") {
            setImageURL(e.target.src)
        }
        if(element.dataset.func === "profile") {
            const id = +e.target.id;
            setProfileID(id)
        }
    }

    const cancelFile = () => {
        setImage(null);
        setUploadError(false);
        if(fileDivRef.current) {
            fileDivRef.current.style.display = 'none'
        }
    }

    const handleFileClick = (e) => {
        const file = e.target.files[0];
        if(file) {
            setImage(e.target.files[0])
            if(fileDivRef.current) {
                fileDivRef.current.style.display = 'flex'
            }
        } else {
            setImage(null)
            setUploadError(false)
            if(fileDivRef.current) {
                fileDivRef.current.style.display = 'none'
            }
        }
    }

    if (!conversation) {
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
                    <input name="message" id="message" placeholder='Login to send messages' disabled></input>
                    <button disabled><SendHorizontal color='white' size={30} /></button>
                    <button disabled><Image color='white' size={35} /></button>
                </form>
            </div>
        </section>
        )
    }
    if (conversation && !user) {
        return (
            <section className={styles.messenger}>
            <div className={styles.info}> 
                <button disabled><img src={conversation.picture_url || '/images/no-group-pic.png'} alt={`${conversation.group_name} group picture`}></img></button>
                <button disabled>{conversation.group_name}</button>
            </div>
            <div className={styles.main} ref={scrollRef} id='scrl'>
                <ul onClick={handleImageClick}>
                {conversation.messages.length === 0 ?
                <div className={styles.empty}>
                    <p>Start this conversation!</p>
                </div>
                :
                conversation.messages.map((message, index) => 
                    <Message key={message.id} root={scrollRef.current} index={index} message={message} conversation={conversation} user={user} />
                )}
                </ul>         
            </div>
            <div className={styles.forms}>
                <form className={styles.messageDiv}>
                    <input name="message" id="message" placeholder='Login to send messages' disabled></input>
                    <button disabled><SendHorizontal color='white' size={30} /></button>
                    <button disabled><Image color='white' size={35} /></button>
                </form>
            </div>
        </section>
        )
    }
    return (
        <section className={styles.messenger}>
            <div className={styles.info}>
                {!conversation.isGroup ?
                <button onClick={() => setProfileID(otherUser.id)}><img src={otherUser.picture_url || '/images/no-profile-pic.jpg'} alt={`${otherUser.first_name} ${otherUser.last_name} profile picture`}></img></button> : 
                <button onClick={() => setGroupID(conversation.id)}><img src={conversation.picture_url || '/images/no-group-pic.png'} alt={`${conversation.group_name} group picture`}></img></button>
                }
                {!conversation.isGroup ? 
                <button onClick={() => setProfileID(otherUser.id)}>{otherUser.first_name} {otherUser.last_name}</button> : 
                <>
                    <button onClick={() => setGroupID(conversation.id)}>{conversation.group_name}</button>
                    {!conversation.isPublic && <button onClick={() => setMembers(true)}><UserPlus size={28} /></button>}
                </>
                }
            </div>
            <div className={styles.main} ref={scrollRef} id='scrl'>
                <ul onClick={handleImageClick} style={{height: conversation.messages.length === 0 ? '100%' : null}}>
                {conversation.messages.length === 0 ?
                <div className={styles.empty}>
                    <p>Send a message to start this conversation</p>
                </div>
                :
                conversation.messages.map((message, index) => 
                    <Message key={message.id} root={scrollRef.current} index={index} message={message} conversation={conversation} user={user} />
                )}
                </ul>         
            </div>
            <div className={styles.forms}>
                <form onSubmit={handleMessageSend}>
                    <div className={styles.messageDiv}>
                        <label htmlFor="message" hidden></label>
                        <input name="message" id="message" onChange={(e) => setMessageInput(e.target.value)} placeholder='Send a message...' value={messageInput} ref={inputRef}></input>
                        <button><SendHorizontal size={30} color='white' /></button>
                        <label htmlFor="image" disabled={isUploading} className={styles.label}>{!isUploading ? <Image color='white' size={35} /> : <LoaderCircle  size={40} color='white' className={styles.loading}/>}</label>
                    </div>
                    <div className={styles.file} ref={fileDivRef}>
                        {uploadError ? <p className={styles.fileError}>{uploadError}</p> : <p>Max size: 5 MB</p>}
                        <div>
                            <input type="file" id='image' accept='image/*' ref={fileRef} onChange={handleFileClick} />
                            <button onClick={cancelFile}><X color='white' size={30} /></button>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    )
}

Messages.propTypes = {
    conversationID: PropTypes.number.isRequired,
    setProfileID: PropTypes.func.isRequired,
    setImageURL: PropTypes.func.isRequired,
    setGroupID: PropTypes.func.isRequired,
    setMembers: PropTypes.func.isRequired,
}