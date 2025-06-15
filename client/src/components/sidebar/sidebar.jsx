import styles from './sidebar.module.css'
import PropTypes from 'prop-types';
import Popup from "../popup/popup"
import { AuthContext } from '../../contexts'
import { Link } from 'react-router';
import { useContext, useState, useMemo, memo, useEffect } from 'react';
import { Mail, LoaderCircle, Circle, MessageCircleMore, Handshake, Users, UserRoundSearch, LogOut, LogIn, Search } from 'lucide-react';

const Sidebar = memo(function Sidebar ({friends, conversations, groups, setFriends, setConversations, handleListClick, onlineFriends, setOnlineFriends, setConversationID, conversationID, users, usersLoading, error, connectedRooms, setConnectedToRooms, loadingConversation}) {
    const { user, token, socket, socketOn, logout } = useContext(AuthContext)
    const [view, setView] = useState('Groups')
    const [groupCreation, setGroupCreation] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [search, setSearch] = useState('')
    const [groupError, setGroupError] = useState(null);
    const [groupSuccess, setGroupSuccess] = useState(false)
    const [messagesNotification, setMessagesNotification] = useState(false);
    const [groupsNotification, setGroupsNotification] = useState(false);
    const [creatingGroup, setCreatingGroup] = useState(false)
    const messages = useMemo(() => conversations.filter(conversation => {
        if(!conversation.isGroup && conversation.notification) {
            setMessagesNotification(true)
        }
        if(conversation.isGroup && conversation.notification) {
            setGroupsNotification(true)
        }
        return conversation.messages.length > 0 && !conversation.isGroup
    }), [conversations])
    const sortedFriends = useMemo(() => friends.toSorted((friend1, friend2) => {
        if(friend1.isOnline && !friend2.isOnline) {
            return -1
        } else if (!friend1.isOnline && friend2.isOnline) {
            return 1
        } else {
            return 0
        }
    }), [friends])
    useEffect(() => {
        if(groups.length > 0 && !conversationID ) {
            setConversationID(groups[0].id)
        }
    }, [conversationID, groups, setConversationID])
    const filteredArray = useMemo(() => {
        const query = search.toLowerCase();
        if(view === 'Messages') {
            if(query) {
                const filtered = messages.filter((message) => `${message.participants[0].first_name} ${message.participants[0].last_name}`.toLowerCase().includes(query))
                return filtered
            } else {
                return messages
            }
        } else if(view === 'Friends') {
            if(query) {
                const filtered = sortedFriends.filter((friend) => `${friend.first_name} ${friend.last_name}`.toLowerCase().includes(query))
                return filtered
            } else {
                return sortedFriends
            }
        } else if(view === 'Groups') {
            if(query) {
                const filtered = groups.filter((group) => group.group_name.toLowerCase().includes(query))
                return filtered
            } else {
                return groups
            }
        } else if(view === 'Users') {
            if(query) {
                const filtered = users.filter((user) => `${user.first_name} ${user.last_name}`.toLowerCase().includes(query))
                return filtered
            } else {
                return users
            }
        } else return [];
    }, [groups, messages, search, sortedFriends, users, view])
    useEffect(() => {
        const displayOnlineFriend = (friendId, bool) => {
            const isFriend = friends.findIndex((friend) => friend.id === friendId)
            if (isFriend > -1) {
                setFriends((prev) => {
                    const friends = prev.slice();
                    friends[isFriend].isOnline = bool;
                    return friends;
                })
            } else return;
        }
        if(socketOn && friends.length > 0){
            socket.current.on('user connected', (friendId) => displayOnlineFriend(friendId, true))
            socket.current.on('user disconnected', (friendId) => displayOnlineFriend(friendId, false))
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('user connected');
                listener.off('user disconnected');
            }
        };
    }, [friends, setFriends, socket, socketOn])

    useEffect(() => {
        const removeGroup = (groupId) => {
            const index = conversations.findIndex(conversation => conversation.id === groupId);
            setConversations((prev) => prev.toSpliced(index, 1));
            setConnectedToRooms(false)
            setConversationID(groups[1].id)
        }
        if(socketOn){
            socket.current.on('removed group', removeGroup)
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('removed group');
            }
        };
    }, [conversations, groups, setConnectedToRooms, setConversationID, setConversations, socket, socketOn])

    useEffect(() => {
        const addNewGroup = (conversation) => {
            setConversations((prev) => ([conversation, ...prev]))
            setConnectedToRooms(false)
        }
        if(socketOn){
            socket.current.on('new group', addNewGroup)
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('new group');
            }
        };
    }, [setConnectedToRooms, setConversations, socket, socketOn])

    useEffect(() => {
        const addNewConversation = (convo) => {
            const conversation = JSON.parse(convo);
            const conver = {...conversation, participants: [conversation.participants[1]]}
            setConversations((prev) => ([conver, ...prev]))
            setConnectedToRooms(false)
        }
        if(socketOn){
            socket.current.on('new convo', addNewConversation)
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('new convo', addNewConversation);
            }
        };
    }, [setConnectedToRooms, setConversations, socket, socketOn])

    useEffect(() => {
        const displayOnlineFriends = (userIds) => {
            const onlineSet = new Set(userIds);
            const updatedFriends = friends.map(friend => ({
                ...friend,
                isOnline: onlineSet.has(friend.id)
            }));
            setFriends(updatedFriends)
            setOnlineFriends(true)
        }
        if(socketOn && friends.length > 0 ) {
            const friendIds = friends.map((friend) => friend.id)
            socket.current.emit('online friends', friendIds)
        }
        if(socketOn && friends.length > 0 && !onlineFriends){
            socket.current.on('online friends', displayOnlineFriends)
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('online friends');
            }
        };
    }, [friends, onlineFriends, setFriends, setOnlineFriends, socket, socketOn])

    useEffect(() => {
        const connectToRooms = () => {
            const conversationsIds = conversations.map((conversation) => `convo${conversation.id}`)
            socket.current.emit('join rooms', conversationsIds)
            setConnectedToRooms(true)
        }
        if(socketOn && conversations.length > 0 && !connectedRooms) {
            connectToRooms();
        }
    }, [socket, socketOn, conversations, connectedRooms, setConnectedToRooms])
    useEffect(() => {
        const updateLastMessage = (msg) => {
            setConversations(prev => {
                const index = prev.findIndex(conversation => msg.conversationId === conversation.id);
                const copy = prev.slice();
                const convo = {...copy[index], messages: [msg], notification: conversationID === copy[index].id ? false : true}
                copy.splice(index, 1)
                copy.unshift(convo);
                return copy
            })
        }
        if(socketOn) {
            socket.current.on('chat message', updateLastMessage);
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('chat message', updateLastMessage);
            }
        };
    }, [socket, conversations, setConversations, socketOn, conversationID])
    const handleViews = (e) => {
        if (e.target.closest('button')) {
            setView(e.target.closest('button').textContent);
            setSearch('')
            if(e.target.closest('button').textContent === 'Messages') {
                setMessagesNotification(false)
            } else if(e.target.closest('button').textContent === 'Groups') {
                setGroupsNotification(false)
            }
        } else {
            return;
        }
    }
    const createGroup = async(e) => {
        e.preventDefault();
        if(!groupName) {
            return setGroupError(['Group name must not be empty']);
        }
        try {
            setCreatingGroup(true)
            const request = await fetch(`${import.meta.env.VITE_API_URL}/groups`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.current}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({name: groupName})
            })
            const response = await request.json();
            if(!request.ok) {
                const error = new Error(response.message || 'Invalid Request')
                error.errors = response.errors;
                throw error
            }
            setGroupSuccess(true)
            setTimeout(() => setGroupSuccess(false), 3500)
            setGroupError(null)
            setConversations((prev) => ([{...response.group, participants: []}, ...prev]))
            setGroupName('');
            setGroupCreation(false)
            setConnectedToRooms(false);
        } catch(err) {
            if(err.errors) {
                setGroupError(err.errors)
            } else {
                setGroupError([err.message])
            }
        } finally {
            setCreatingGroup(false)
        }
    }
    if(!user) {
        return (
            <>
            <aside className={styles.navButtons}>
                <section className={styles.you}>
                        <Link aria-label='login' to='/login'>
                            <img width={96} height={96} src='/images/no-profile-pic.jpg' alt='no profile picture'></img>
                            <h3>Guest</h3>
                        </Link>
                </section>
                <nav>
                        <button aria-label='messages' disabled><MessageCircleMore size={30}/><p>Messages</p></button>
                        <button aria-label='groups' disabled><Users size={30} /><p>Groups</p></button>
                        <button aria-label='friends' disabled><Handshake size={30} /><p>Friends</p></button>
                        <button aria-label='users' disabled><UserRoundSearch size={30} /><p>Users</p></button>
                        <Link aria-label='login' to="/login"><LogIn size={30}/><p>Login</p></Link>
                </nav>
            </aside>
            <aside className={styles.sidebar}>
            <h2 className={styles.view}>{view}</h2>
            <div className={styles.searchDiv}>
                <label htmlFor="search" hidden></label>
                <input type="text" id='search' disabled className={styles.search} value={search} placeholder='Login to search' />
                <Search  className={styles.searchIcon}/>
            </div>
            {filteredArray.length > 0 ?
            <section className={styles.conversations}>
                <ul>
                {filteredArray.map(group => 
                <li key={group.id} className={styles.conversation}>
                    <button aria-label='open convo' id={group.id} data-func='convo' disabled className={styles.messageButton}>
                        <img src={group.picture_url || '/images/no-group-pic.png'} alt={`${group.name} group picture`}></img>
                        <div className={styles.info}>
                            <p>{group.group_name}</p>
                            {group.messages[0] ?
                            <p>{group.messages[0].sender.first_name}: {group.messages[0].content || 'Sent an image'}</p> :
                            <p>No messages yet</p>
                            }
                        </div>
                    </button>
                </li>
                    )}
                </ul>
            </section> :
            <section className={styles.conversationsLoading}>
                <LoaderCircle  size={40} color='white' className={styles.loading}/>
            </section>
            }
        </aside>
            </>
        )
    }
    return (
        <>
        <Popup shouldRender={groupSuccess} close={setGroupSuccess} borderColor='#00d846'>
            <p>Group Created Successfully</p>
        </Popup>
        <aside className={styles.navButtons}>
            <section className={styles.you}>
                <button aria-label='open my profile' onClick={handleListClick} data-func='profile' id={user.id}>
                    <img width={96} height={96} src={user.picture_url || '/images/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture`}></img>
                    <h3>{user.first_name}</h3>
                </button>
            </section>
            <nav onClick={handleViews}>
                <button aria-label='messages' className={view === 'Messages' ? `${styles.selected}` : ''}><MessageCircleMore size={30}/><p>Messages</p>{messagesNotification && <Circle className={styles.notification2} strokeWidth={0} size={17} fill='#d61414'/>}</button>
                <button aria-label='groups' className={view === 'Groups' ? `${styles.selected}` : ''}><Users size={30} /><p>Groups</p>{groupsNotification && <Circle className={styles.notification2} strokeWidth={0} size={17} fill='#d61414'/>}</button>
                <button aria-label='friends' className={view === 'Friends' ? `${styles.selected}` : ''}><Handshake size={30} /><p>Friends</p></button>
                <button aria-label='users' className={view === 'Users' ? `${styles.selected}` : ''}><UserRoundSearch size={30} /><p>Users</p></button>
                {!user ?
                <Link aria-label='login' to="/login"><p>Login</p></Link> :
                <button aria-label='logout' onClick={logout}><LogOut size={30} /><p>Logout</p></button>
                }
            </nav>
        </aside>
        <aside className={styles.sidebar}>
            <h2 className={styles.view}>{view}</h2>
            {!groupCreation &&
            <div className={styles.searchDiv}>
            <label htmlFor="search" hidden></label>
            <input type="text" id='search' className={styles.search} value={search} placeholder='Search for a user or group' onChange={(e) => setSearch(e.target.value)} />
            <Search className={styles.searchIcon}/>
            </div>
            }
            <section className={styles.conversations}>
                {(view === 'Groups' && !groupCreation) &&
                    <button onClick={() => setGroupCreation(true)} className={styles.createGroup}>Create Group</button>
                }
                {(view === 'Groups' && groupCreation) &&
                <form onSubmit={createGroup} className={styles.createForm}>
                    {groupError && 
                    <ul>
                        {groupError.map((error, index) => <li key={index}><p>✘ {error}</p></li>)}
                    </ul>
                    }
                    <label htmlFor="group" hidden>Group name: </label>
                    <input type="text" id='group' placeholder='Group Name' value={groupName} required minLength={2} maxLength={20} onChange={(e) => setGroupName(e.target.value)}/>
                    <div className={styles.formButtons}>
                        <button disabled={creatingGroup} >{creatingGroup ? <LoaderCircle  size={28} color='white' className={styles.loading}/> : 'Create'}</button>
                        <button disabled={creatingGroup} type='button' className={styles.close} onClick={() => {
                            setGroupCreation(false)
                            setGroupName('');
                            }}>Cancel</button>
                    </div>
                </form>
                }
                <ul onClick={handleListClick}>
                    {view === 'Friends' ?
                    filteredArray.map(friend => 
                        <li key={friend.id} className={`${styles.conversation} ${styles.shadow}`}>
                            <div className={styles.friendButton}>
                                <div>
                                    <button aria-label={`open ${friend.first_name} ${friend.last_name} profile`} id={friend.id} data-func="profile"><img src={friend.picture_url || '/images/no-profile-pic.jpg'} alt={`${friend.first_name} ${friend.last_name} profile picture`}></img></button>
                                    <Circle className={styles.circle} strokeWidth={0} size={17} fill={friend.isOnline ? '#0bd80b' : 'grey'}/>
                                </div>
                                <button id={friend.id} data-func="profile">{friend.first_name} {friend.last_name}</button>
                            </div>
                            <div className={styles.buttons}>
                                <button aria-label={`open conversations with ${friend.first_name} ${friend.last_name}`} id={friend.id} disabled={loadingConversation} data-func='new-convo'>{loadingConversation !== friend.id ? <Mail size={24} color={loadingConversation ? '#ffffff00' : 'white'} /> :  <LoaderCircle  size={28} color='white' className={styles.loading}/>}</button>
                            </div>
                        </li>
                    ) : view === 'Groups' ?
                    filteredArray.map(group => 
                        <li key={group.id} className={styles.conversation}>
                            <button aria-label={`open group ${group.name} conversation`} id={group.id} data-func='convo' className={styles.messageButton}>
                                <img src={group.picture_url || '/images/no-group-pic.png'} alt={`${group.name} group picture`}></img>
                                <div className={styles.info}>
                                    <p>{group.group_name}</p>
                                    {group.messages[0] ?
                                    <p>{group.messages[0].senderId !== user.id ? `${group.messages[0].sender.first_name}: ` : 'You: '} {group.messages[0].content || 'Sent an image'}</p> :
                                    <p>No messages yet</p>
                                    }
                                </div>
                                {group.notification &&
                                <Circle className={styles.notification} strokeWidth={0} size={17} fill='#d61414'/>
                                }
                            </button>
                        </li>
                    ) : view === 'Messages' ? 
                    filteredArray.map(conversation => {
                        return (
                        <li key={conversation.id} className={styles.conversation}>
                            <button  aria-label={`open conversation with ${conversation.participants[0].first_name} ${conversation.participants[0].last_name}`} id={conversation.id} data-func='convo' className={styles.messageButton}>
                                <img src={conversation.participants[0].picture_url || '/images/no-profile-pic.jpg'} alt={`${conversation.participants[0].first_name} ${conversation.participants[0].last_name} profile picture`}></img>
                                <div className={styles.info}>
                                    <p>{conversation.participants[0].first_name} {conversation.participants[0].last_name}</p>
                                    <p>{conversation.messages[0].senderId !== user.id ? `${conversation.messages[0].sender.first_name}: ` : 'You: '} {conversation.messages[0].content || 'Sent an image'}</p>
                                </div>
                                {conversation.notification &&
                                <Circle className={styles.notification} strokeWidth={0} size={17} fill='#d61414'/>
                                }
                            </button>
                        </li>
                        )
                    })
                    : usersLoading ? <p>Loading</p> : error ? <p style={{fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center'}}>An Error has occured, please try again later</p> :  
                    <>
                    {filteredArray.map((user) => {
                        return (
                        <li className={`${styles.conversation} ${styles.shadow}`} key={user.id}>
                            <div className={styles.friendButton}>
                                <button aria-label={`open ${user.first_name} ${user.last_name} profile`}  id={user.id} data-func="profile"><img src={user.picture_url || '/images/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture`}></img></button>
                                <button id={user.id} data-func="profile">{user.first_name} {user.last_name}</button>
                            </div>
                            <div className={styles.buttons}>
                                <button aria-label={`open ${user.first_name} ${user.last_name} profile`} id={user.id} disabled={loadingConversation} data-func='new-convo'>{loadingConversation !== user.id ? <Mail size={24} color={loadingConversation ? '#ffffff00' : 'white'} /> :  <LoaderCircle  size={28} color='white' className={styles.loading}/>}</button>
                            </div>
                        </li>
                        )
                    })} 
                    </>
                    }
                </ul>
            </section>
        </aside>
        </>
    )
})

Sidebar.propTypes = {
    friends: PropTypes.array.isRequired,
    conversations: PropTypes.array.isRequired,
    groups: PropTypes.array.isRequired,
    setConversations: PropTypes.func.isRequired,
    handleListClick: PropTypes.func.isRequired,
    setFriends: PropTypes.func.isRequired,
    onlineFriends: PropTypes.bool.isRequired,
    setOnlineFriends: PropTypes.func.isRequired,
    connectedRooms: PropTypes.bool.isRequired,
    setConnectedToRooms: PropTypes.func.isRequired,
    setConversationID: PropTypes.func.isRequired,
    conversationID: PropTypes.number.isRequired,
    users: PropTypes.array.isRequired,
    usersLoading: PropTypes.bool.isRequired,
    error: PropTypes.bool.isRequired,
    loadingConversation: PropTypes.number.isRequired,
}

export default Sidebar;


