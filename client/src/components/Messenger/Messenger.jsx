import styles from './Messenger.module.css'
import Messages from '../messages/messages'
import Sidebar from '../sidebar/sidebar'
import { Link } from 'react-router'
import { AuthContext } from '../../contexts'
import { useContext, useState, useEffect } from 'react'
import Profile from '../profile/profile'



export default function Messenger () {
    const { user, logout, token } = useContext(AuthContext)
    const [conversationID, setConversationID] = useState(null)
    const [friends, setFriends] = useState([])
    const [conversations, setConversations] = useState([])
    const [profileID, setProfileID] = useState(null)
    useEffect(() => {
        if(user) {
            setFriends(user.friends)
            setConversations(user.conversations)
        }
    }, [user])
    const createConversation = async(userId) => {
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/conversations/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.current}`
                }
            })
            const response = await request.json();
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            console.log(response);
            setConversations((prev) => ([...prev, response.conversation]))
            setConversationID(response.conversation.id);
        } catch(err) {
            console.log(err)
        }
    } 
    const handleListClick = async(e) => {
        const button = e.target.closest('button')
        if (button && button.dataset.func === 'convo') {
            const id = +button.id;
            setConversationID(id)
        } else if (button && button.dataset.func === 'new-convo') {
            const userId = +button.id;
            const isExistant = conversations.findIndex(conversation => {
                return !conversation.isGroup && conversation.participants[0].id === userId
            })
            if(isExistant > -1) {
                setConversationID(conversations[isExistant].id)
            } else {
                createConversation(userId)
            }
        } else if (button && button.dataset.func === 'profile') {
            const id = +button.id;
            setProfileID(id)
        } else {
            return;
        }
    }
    return (
        <>
            <Profile userId={profileID} setProfileID={setProfileID} friends={friends} setFriends={setFriends} handleListClick={handleListClick} />
            <header className={styles.header}>
                {!user ?
                <Link to="/login">Login</Link> :
                <button onClick={logout}>Logout</button>
                }
            </header>
                <main>
                    <Sidebar setConversationID={setConversationID} setProfileID={setProfileID} friends={friends} conversations={conversations} setConversations={setConversations} handleListClick={handleListClick} />
                    <Messages conversationID={conversationID} setProfileID={setProfileID} />
                </main>
        </>
    )
}