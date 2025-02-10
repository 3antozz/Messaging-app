import styles from './Messenger.module.css'
import Messages from '../messages/messages'
import Sidebar from '../sidebar/sidebar'
import { Link } from 'react-router'
import { AuthContext } from '../../contexts'
import { useContext } from 'react'



export default function Messenger () {
    const { user, logout } = useContext(AuthContext)
    return (
        <>
            <header className={styles.header}>
                {!user ?
                <Link to="/login">Login</Link> :
                <button onClick={logout}>Logout</button>
                }
            </header>
            <main>
                <Sidebar />
                <Messages />
            </main>
        </>
    )
}