import styles from './sidebar.module.css'
import PropTypes from 'prop-types';
import { AuthContext } from '../../contexts'
import { useContext, useState, useMemo, memo, useEffect } from 'react';
import { MessageSquare, UserPlus } from 'lucide-react';

const Sidebar = memo(function Sidebar ({setID, setProfileID}) {
    const { user, token, socket } = useContext(AuthContext)
    const [conversations, setConversations] = useState([])
    const [friends, setFriends] = useState([])
    const [view, setView] = useState('Messages')
    const [users, setUsers] = useState([])
    const [isFetched, setFetched] = useState(false)
    const [usersLoading, setUsersLoading] = useState(false)
    const [error, setError] = useState(false)
    const groups = useMemo(() => conversations.filter(group => group.isGroup), [conversations])
    const messages = useMemo(() => conversations.filter(conversation => conversation.lastMessageTime), [conversations])
    useEffect(() => {
        const fetchUsers = async() => {
            setUsersLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
                    headers: {
                        'Authorization': `Bearer ${token.current}`
                    }
                })
                const response = await request.json();
                console.log(response);
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                setUsers(response.users)
                setError(false)
                setFetched(true)
            } catch(err) {
                console.log(err)
                setError(true)
            } finally {
                setUsersLoading(false)
            }
        }
        if(!isFetched) {
            fetchUsers();
        }
    }, [token, isFetched])

    useEffect(() => {
        const connectToRooms = () => {
            const conversationsIds = conversations.map((conversation) => `${conversation.id}`)
            socket.current.emit('join rooms', conversationsIds)
        }
        if(user && conversations.length > 0) {
            connectToRooms();
        }
    }, [socket, user, conversations])

    useEffect(() => {
        if(user) {
            setConversations(user.conversations)
            setFriends(user.friends)
        }
    }, [user])
    // useEffect(() => {
    //     socket.current.on('chat message', (msg) => {
    //     });
    // }, [socket])
    if(!user) {
        return <h3>loading...</h3>
    }
    const handleViews = (e) => {
        if (e.target.tagName === 'BUTTON') {
            setView(e.target.textContent); 
        } else {
            return;
        }
    }
    const addFriend = async(id) => {
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/friends/add`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.current}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    friendId: id
                })
            })
            const response = await request.json();
            console.log(response);
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            setFetched(false)
        } catch(err) {
            console.log(err)
            setError(true)
        }
    }
    const handleListClick = async(e) => {
        const button = e.target.closest('button')
        if (button && button.dataset.func === 'convo') {
            const id = button.id;
            setID(id)
        } else if (button && button.dataset.func === 'profile') {
            const id = button.id;
            setProfileID(id)
        } else if (button && button.dataset.func === 'add-friend') {
            const id = button.id;
            addFriend(id);
        } else {
            return;
        }
    } 
    return (
        <>
        <aside className={styles.sidebar}>
            <section className={styles.you}>
                <button onClick={handleListClick} data-func='profile' id={user.id}>
                    {user.picture_url ? <img src={user.picture_url} alt={`${user.first_name} ${user.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                    <h3>{user.username}</h3>
                </button>
            </section>
            <nav onClick={handleViews}>
                <button className={view === 'Messages' ? `${styles.selected}` : ''}>Messages</button>
                <button className={view === 'Friends' ? `${styles.selected}` : ''}>Friends</button>
                <button className={view === 'Groups' ? `${styles.selected}` : ''}>Groups</button>
                <button className={view === 'Users' ? `${styles.selected}` : ''}>Users</button>
            </nav>
            <section className={styles.conversations}>
                <ul onClick={handleListClick}>
                    {view === 'Friends' ?
                    friends.map(friend => 
                        <li key={friend.id} className={styles.conversation}>
                            <div className={styles.friendButton}>
                                {friend.picture_url ? <button id={friend.id} data-func="profile"><img src={friend.picture_url} alt={`${friend.first_name} ${friend.last_name} profile picture`}></img></button> : <button id={friend.id} data-func="profile"><img data-func="profile" src='/images/no-profile-pic.jpg'></img></button>}
                                <button id={friend.id} data-func="profile">{friend.first_name} {friend.last_name}</button>
                            </div>
                            <div className={styles.buttons}>
                                <button id={friend.conversationId} data-func='convo'><MessageSquare size={24} color='white' /></button>
                            </div>
                        </li>
                    ) : view === 'Groups' ?
                    groups.map(group => 
                        <li key={group.id} className={styles.conversation}>
                            <button id={group.id}>
                                {group.picture_url ? <img src={group.picture_url} alt={`${group.name} group picture`}></img> : <img src='/images/no-group-pic.jpg'></img>}
                                <p>{group.name}</p>
                            </button>
                        </li>
                    ) : view === 'Messages' ? 
                    messages.map(conversation => {
                        return (
                        <li key={conversation.id} className={styles.conversation}>
                            <button id={conversation.id} data-func='convo' className={styles.messageButton}>
                                {conversation.participants[0].picture_url ? <img src={conversation.participants[0].picture_url} alt={`${conversation.participants[0].first_name} ${conversation.participants[1].last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                                <div className={styles.info}>
                                    <p>{conversation.participants[0].first_name} {conversation.participants[0].last_name}</p>
                                    <p>{conversation.messages[0].senderId === conversation.participants[0].id ? `${conversation.participants[0].first_name}: ` : 'You: '} {conversation.messages[0].content}</p>
                                </div>
                            </button>
                        </li>
                        )
                    })
                    : usersLoading ? <p>Loading</p> : error ? <p>An Error has occured, please try again later</p> :  
                    <ul>
                    {users.map((user) => {
                        return (
                        <li className={styles.conversation} key={user.id}>
                            <div className={styles.friendButton}>
                                {user.picture_url ? <button id={user.id} data-func="profile"><img src={user.picture_url} alt={`${user.first_name} ${user.last_name} profile picture`}></img></button> : <button id={user.id} data-func="profile"><img data-func="profile" src='/images/no-profile-pic.jpg'></img></button>}
                                <button id={user.id} data-func="profile">{user.first_name} {user.last_name}</button>
                            </div>
                            <div className={styles.buttons}>
                                <button id={user.id} data-func='convo'><MessageSquare size={24} color='white' /></button>
                                <button id={user.id} data-func='add-friend'><UserPlus size={24} color='white' /></button>
                            </div>
                        </li>
                        )
                    })} 
                    </ul>
                    }
                </ul>
            </section>
        </aside>
        </>
    )
})

Sidebar.propTypes = {
    setID: PropTypes.func.isRequired,
    setProfileID: PropTypes.func.isRequired,
}

export default Sidebar;