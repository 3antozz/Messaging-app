import styles from './sidebar.module.css'
import { AuthContext, ConversationContext } from '../../contexts'
import { useContext, useState, useMemo } from 'react'
export default function Sidebar () {
    const { user } = useContext(AuthContext)
    const { setConversation } = useContext(ConversationContext)
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
            console.log(id);
            // try {
            //     const request = await fetch(`${import.meta.env.VITE_API_URL}/refresh`, {
            //       method: 'POST',
            //       credentials: 'include'
            //     })
            //     const response = await request.json();
            //     console.log(response);
            //     setToken(response.accessToken);
            //     if(response.accessToken) {
            //       clearTimeout(timeoutRef.current);
            //       timeoutRef.current = setTimeout(fetchToken,  1000 * 60 * 4);
            //     }
            //   } catch(err) {
            //     console.log(err)
            //   }
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
                                <p>{otherParticipant.first_name} {otherParticipant.last_name}</p>
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
}