import styles from './sidebar.module.css'
import PropTypes from 'prop-types';
import { AuthContext } from '../../contexts'
import { useContext, useState, useMemo, memo } from 'react'
const Sidebar = memo(function Sidebar ({setID}) {
    const { user } = useContext(AuthContext)
    const [view, setView] = useState('Friends')
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
        if (button) {
            const id = button.id;
            setID(id)
            console.log(id)
        } else {
            return;
        }
    } 
    return (
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
                            <button id={friend.conversationId}>
                                {friend.picture_url ? <img src={friend.picture_url} alt={`${friend.first_name} ${friend.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                                <p>{friend.first_name} {friend.last_name}</p>
                            </button>
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
                            <button id={conversation.id}>
                                {otherParticipant.picture_url ? <img src={otherParticipant.picture_url} alt={`${otherParticipant.first_name} ${conversation.participants[1].last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                                <div className={styles.info}>
                                    <p>{otherParticipant.first_name} {otherParticipant.last_name}</p>
                                    <p>{conversation.messages[0].senderId === otherParticipant.id ? `${otherParticipant.first_name}: ` : 'You: '} {conversation.messages[0].content}</p>
                                </div>
                            </button>
                        </li>
                        )
                    })
                    : null
                    
                    }
                </ul>
            </section>
        </aside>
    )
})

Sidebar.propTypes = {
    setID: PropTypes.func.isRequired
}

export default Sidebar;