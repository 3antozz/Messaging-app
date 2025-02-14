import styles from './Messenger.module.css'
import Messages from '../messages/messages'
import Sidebar from '../sidebar/sidebar'
import { Link } from 'react-router'
import { AuthContext } from '../../contexts'
import { useContext, useState } from 'react'
import Profile from '../profile/profile'



export default function Messenger () {
    const { user, logout } = useContext(AuthContext)
    const [conversationID, setConversationID] = useState(null)
    const [profileID, setProfileID] = useState(null)
    return (
        <>
            <Profile userId={profileID} setProfileID={setProfileID} />
            <header className={styles.header}>
                {!user ?
                <Link to="/login">Login</Link> :
                <button onClick={logout}>Logout</button>
                }
            </header>
                <main>
                    <Sidebar setID={setConversationID} setProfileID={setProfileID} />
                    <Messages conversationID={conversationID} setProfileID={setProfileID} />
                </main>
        </>
    )
}