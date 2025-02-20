import styles from './Messenger.module.css'
import Messages from '../messages/messages'
import Sidebar from '../sidebar/sidebar'
import { Link } from 'react-router'
import { AuthContext } from '../../contexts'
import { useContext, useState, useEffect } from 'react'
import Profile from '../profile/profile'



export default function Messenger () {
    const { user, logout } = useContext(AuthContext)
    const [conversationID, setConversationID] = useState(null)
    const [friends, setFriends] = useState([])
    const [profileID, setProfileID] = useState(null)
    useEffect(() => {
        if(user) {
            setFriends(user.friends)
        }
    }, [user])
    return (
        <>
            <Profile userId={profileID} setProfileID={setProfileID} friends={friends} setFriends={setFriends} />
            <header className={styles.header}>
                {!user ?
                <Link to="/login">Login</Link> :
                <button onClick={logout}>Logout</button>
                }
            </header>
                <main>
                    <Sidebar setID={setConversationID} setProfileID={setProfileID} friends={friends} />
                    <Messages conversationID={conversationID} setProfileID={setProfileID} />
                </main>
        </>
    )
}