import styles from './sidebar.module.css'
import PropTypes from 'prop-types';
import { AuthContext } from '../../contexts'
import { useContext, useState, useMemo, memo, useEffect } from 'react';
import { MessageSquare, UserPlus } from 'lucide-react';

const Sidebar = memo(function Sidebar ({setID}) {
    const { user, token } = useContext(AuthContext)
    const [view, setView] = useState('Friends')
    const [users, setUsers] = useState([])
    const [isFetched, setFetched] = useState(false)
    const [usersLoading, setUsersLoading] = useState(false)
    const [error, setError] = useState(false)
    const friends = useMemo(() => {
        if(user) {
            const array = [];
            user.conversations.forEach((conversation) => {
                if(!conversation.isGroup) {
                    conversation.participants.forEach((participant) => {
                        if(participant.id != user.id) {
                            array.push({conversationId: conversation.id ,...participant})
                        }
                    })
                }
            })
            return array;
        }
    }, [user])
    const groups = useMemo(() => user && user.conversations.filter(group => group.isGroup), [user])
    const conversations = useMemo(() => user && user.conversations.filter(conversation => conversation.lastMessageTime), [user])
    useEffect(() => {
        const fetchUsers = async() => {
            setUsersLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
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
    const handleListClick = async(e) => {
        const button = e.target.closest('button')
        if (button && button.dataset.func === 'convo') {
            const id = button.id;
            setID(id)
            console.log(id)
        } else {
            return;
        }
    } 
    return (
        <>
        <aside className={styles.sidebar}>
            <section className={styles.you}>
                <button>
                    {user.picture_url ? <img src={user.picture_url} alt={`${user.first_name} ${user.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                    <h3>{user.username}</h3>
                </button>
            </section>
            <nav onClick={handleViews}>
                <button>Messages</button>
                <button>Friends</button>
                <button>Groups</button>
                <button>Users</button>
            </nav>
            <section className={styles.conversations}>
                <ul onClick={handleListClick}>
                    {view === 'Friends' ?
                    friends.map(friend => 
                        <li key={friend.id} className={styles.conversation}>
                            {friend.picture_url ? <img src={friend.picture_url} alt={`${friend.first_name} ${friend.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                            <p>{friend.first_name} {friend.last_name}</p>
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
                    conversations.map(conversation => {
                        const otherParticipant = conversation.participants.filter((participant) => participant.id !== user.id)[0];
                        return (
                        <li key={conversation.id} className={styles.conversation}>
                            <button id={conversation.id} data-func='convo'>
                                {otherParticipant.picture_url ? <img src={otherParticipant.picture_url} alt={`${otherParticipant.first_name} ${conversation.participants[1].last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                                <div className={styles.info}>
                                    <p>{otherParticipant.first_name} {otherParticipant.last_name}</p>
                                    <p>{conversation.messages[0].senderId === otherParticipant.id ? `${otherParticipant.first_name}: ` : 'You: '} {conversation.messages[0].content}</p>
                                </div>
                            </button>
                        </li>
                        )
                    })
                    : usersLoading ? <p>Loading</p> : error ? <p>An Error has occured, please try again later</p> :  
                    <ul>
                    {users.map((user) => {
                        return (
                        <li className={styles.user} key={user.id}>
                            <button>
                                {user.picture_url ? <img src={user.picture_url} alt={`${user.first_name} ${user.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                                <p>{user.first_name} {user.last_name}</p>
                            </button>
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
    setID: PropTypes.func.isRequired
}

export default Sidebar;