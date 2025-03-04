import styles from './sidebar.module.css'
import PropTypes from 'prop-types';
import { AuthContext } from '../../contexts'
import { Link } from 'react-router';
import { useContext, useState, useMemo, memo, useEffect } from 'react';
import { MessageSquare, LoaderCircle, Circle, MessageCircleMore, Handshake, Users, UserRoundSearch, LogOut, LogIn, Search } from 'lucide-react';

const Sidebar = memo(function Sidebar ({friends, conversations, groups, setFriends, setConversations, handleListClick, onlineFriends, setOnlineFriends, setConversationID, conversationID, users, usersLoading, error, connectedRooms, setConnectedToRooms, loadingConversation}) {
    const { user, token, socket, socketOn, logout } = useContext(AuthContext)
    const [view, setView] = useState('Groups')
    const [groupCreation, setGroupCreation] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [search, setSearch] = useState('')
    const messages = useMemo(() => conversations.filter(conversation => conversation.messages.length > 0 && !conversation.isGroup), [conversations])
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
            console.log(conversation);
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
            console.log(conversation);
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
                const convo = {...copy[index], messages: [msg]}
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
    }, [socket, conversations, setConversations, socketOn])
    const handleViews = (e) => {
        if (e.target.tagName === 'BUTTON') {
            setView(e.target.textContent);
            setSearch('')
        } else {
            return;
        }
    }
    const createGroup = async(e) => {
        e.preventDefault();
        if(!groupName) {
            return;
        }
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/groups`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.current}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({name: groupName})
            })
            const response = await request.json();
            console.log(response);
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            setConversations((prev) => ([{...response.group, participants: []}, ...prev]))
            setGroupName('');
            setGroupCreation(false)
            setConnectedToRooms(false);
        } catch(err) {
            console.log(err)
        }
    }
    if(!user) {
        return (
            <>
            <aside>
                <section className={styles.you}>
                        <button disabled>
                            <img src='/images/no-profile-pic.jpg'></img>
                            <h3>Guest</h3>
                        </button>
                </section>
                <nav>
                        <button disabled><MessageCircleMore size={30}/>Messages</button>
                        <button disabled><Users size={30} />Groups</button>
                        <button disabled><Handshake size={30} />Friends</button>
                        <button disabled><UserRoundSearch size={30} />Users</button>
                        <Link to="/login"><LogIn size={30}/>Login</Link>
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
                    <button id={group.id} data-func='convo' disabled className={styles.messageButton}>
                        <img src={group.picture_url || '/images/no-group-pic.png'} alt={`${group.name} group picture`}></img>
                        <div className={styles.info}>
                            <p>{group.group_name}</p>
                            {group.messages[0] ?
                            <p>{group.messages[0].sender.first_name} {group.messages[0].content || 'Sent an image'}</p> :
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
        <aside>
            <section className={styles.you}>
                <button onClick={handleListClick} data-func='profile' id={user.id}>
                    <img src={user.picture_url || '/images/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture`}></img>
                    <h3>{user.first_name}</h3>
                </button>
            </section>
            <nav onClick={handleViews}>
                <button className={view === 'Messages' ? `${styles.selected}` : ''}><MessageCircleMore size={30}/>Messages</button>
                <button className={view === 'Groups' ? `${styles.selected}` : ''}><Users size={30} />Groups</button>
                <button className={view === 'Friends' ? `${styles.selected}` : ''}><Handshake size={30} />Friends</button>
                <button className={view === 'Users' ? `${styles.selected}` : ''}><UserRoundSearch size={30} />Users</button>
                {!user ?
                <Link to="/login">Login</Link> :
                <button onClick={logout}><LogOut size={30} /> Logout</button>
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
                <form onSubmit={createGroup}>
                    <label htmlFor="group" hidden>Group name: </label>
                    <input type="text" id='group' placeholder='Group Name' value={groupName} onChange={(e) => setGroupName(e.target.value)}/>
                    <div className={styles.formButtons}>
                        <button>Create</button>
                        <button type='button' className={styles.close} onClick={() => {
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
                                    <button id={friend.id} data-func="profile"><img src={friend.picture_url || '/images/no-profile-pic.jpg'} alt={`${friend.first_name} ${friend.last_name} profile picture`}></img></button>
                                    <Circle className={styles.circle} strokeWidth={0} size={17} fill={friend.isOnline ? '#0bd80b' : 'grey'}/>
                                </div>
                                <button id={friend.id} data-func="profile">{friend.first_name} {friend.last_name}</button>
                            </div>
                            <div className={styles.buttons}>
                                <button id={friend.id} disabled={loadingConversation} data-func='new-convo'>{loadingConversation !== friend.id ? <MessageSquare size={24} color='white' /> :  <LoaderCircle  size={28} color='white' className={styles.loading}/>}</button>
                            </div>
                        </li>
                    ) : view === 'Groups' ?
                    filteredArray.map(group => 
                        <li key={group.id} className={styles.conversation}>
                            <button id={group.id} data-func='convo' className={styles.messageButton}>
                                <img src={group.picture_url || '/images/no-group-pic.png'} alt={`${group.name} group picture`}></img>
                                <div className={styles.info}>
                                    <p>{group.group_name}</p>
                                    {group.messages[0] ?
                                    <p>{group.messages[0].senderId !== user.id ? `${group.messages[0].sender.first_name}: ` : 'You: '} {group.messages[0].content || 'Sent an image'}</p> :
                                    <p>No messages yet</p>
                                    }
                                </div>
                            </button>
                        </li>
                    ) : view === 'Messages' ? 
                    filteredArray.map(conversation => {
                        return (
                        <li key={conversation.id} className={styles.conversation}>
                            <button id={conversation.id} data-func='convo' className={styles.messageButton}>
                                <img src={conversation.participants[0].picture_url || '/images/no-profile-pic.jpg'} alt={`${conversation.participants[0].first_name} ${conversation.participants[0].last_name} profile picture`}></img>
                                <div className={styles.info}>
                                    <p>{conversation.participants[0].first_name} {conversation.participants[0].last_name}</p>
                                    <p>{conversation.messages[0].senderId !== user.id ? `${conversation.messages[0].sender.first_name}: ` : 'You: '} {conversation.messages[0].content || 'Sent an image'}</p>
                                </div>
                            </button>
                        </li>
                        )
                    })
                    : usersLoading ? <p>Loading</p> : error ? <p>An Error has occured, please try again later</p> :  
                    <>
                    {filteredArray.map((user) => {
                        return (
                        <li className={`${styles.conversation} ${styles.shadow}`} key={user.id}>
                            <div className={styles.friendButton}>
                                <button id={user.id} data-func="profile"><img src={user.picture_url || '/images/no-profile-pic.jpg'} alt={`${user.first_name} ${user.last_name} profile picture`}></img></button>
                                <button id={user.id} data-func="profile">{user.first_name} {user.last_name}</button>
                            </div>
                            <div className={styles.buttons}>
                                <button id={user.id} disabled={loadingConversation} data-func='new-convo'>{loadingConversation !== user.id ? <MessageSquare size={24} color='white' /> :  <LoaderCircle  size={28} color='white' className={styles.loading}/>}</button>
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


