import styles from './sidebar.module.css'
import { AuthContext } from '../../contexts'
import { useContext } from 'react'
export default function Sidebar () {
    const { user } = useContext(AuthContext)
    if(!user) {
        return <h3>loading...</h3>
    }
    return (
        <aside className={styles.sidebar}>
            <section className={styles.you}>
                <h3>{user.username}</h3>
            </section>
            <nav>
                <button>Friends</button>
                <button>Groups</button>
                <button>Users</button>
            </nav>
            <section className={styles.conversations}>
                <ul>
                    <li>
                        <h3>Person</h3>
                    </li>
                    <li>
                        <h3>Person</h3>
                    </li>
                    <li>
                        <h3>Person</h3>
                    </li>
                    <li>
                        <h3>Person</h3>
                    </li>
                </ul>
            </section>
        </aside>
    )
}