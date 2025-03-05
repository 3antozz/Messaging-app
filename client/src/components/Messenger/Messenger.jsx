import styles from './Messenger.module.css'
import Messages from '../messages/messages'
import Sidebar from '../sidebar/sidebar'
import { AuthContext } from '../../contexts'
import { useContext, useState, useEffect, useMemo } from 'react'
import Popup from '../popup/popup'
import Image from '../full-image/image'
import Profile from '../profile/profile'
import Group from '../group/group'
import Members from '../add-members/add-members'


export default function Messenger () {
    const { user, token, socket, socketOn } = useContext(AuthContext);
    const [conversationID, setConversationID] = useState(null);
    const [friends, setFriends] = useState([]);
    const [onlineFriends, setOnlineFriends] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [error, setError] = useState(false);
    const [isFetched, setFetched] = useState(false);
    const [profileID, setProfileID] = useState(null);
    const [groupID, setGroupID] = useState(null);
    const [imageURL, setImageURL] = useState(null);
    const [addMembers, setMembers] = useState(false);
    const [connectedRooms, setConnectedToRooms] = useState(false);
    const [refreshConversationID, setRefreshConversation] = useState(null);
    const [loadingConversation, setLoadingConversation] = useState(0);
    const [conversationError, setConversationError] = useState(false);
    const groups = useMemo(() => conversations.filter(group => group.isGroup), [conversations])
    const group = useMemo(() => {
        const index = groups.findIndex((group) => group.id === conversationID)
        return groups[index];
    }, [groups, conversationID])
    useEffect(() => {
        let ignore = false;
        const fetchPublicGroup = async() => {
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/groups/public`)
                const response = await request.json();
                console.log(response);
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                if(!ignore) {
                    setConversations([response.group])
                }
            } catch(err) {
                console.log(err)
            }
        }
        if(user) {
            setFriends(user.friends)
            setConversations(user.conversations)
        } else {
            fetchPublicGroup();
        }
        return () => ignore = true
    }, [user])
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
        if(!isFetched && user) {
            fetchUsers();
        }
    }, [token, isFetched, user])
    useEffect(() => {
        const addNewUser = (user) => {
            setUsers((prev) => [...prev, user])
        }
        if(socketOn){
            socket.current.on('new user', addNewUser)
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('new user');
            }
        };
    }, [socket, socketOn])
    useEffect(() => {
        const updateGroup = (group) => {
            setConversations(prev => {
                const newConv = prev.slice();
                const index = newConv.findIndex(conv => conv.id === group.id)
                newConv[index] = {...newConv[index], picture_url: group.picture_url, group_name: group.group_name};
                return newConv
            })
        }
        if(socketOn) {
            socket.current.on('group update', updateGroup);
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('group update', updateGroup);
            }
        };
    }, [socket, conversations, setConversations, socketOn])
    const createConversation = async(userId) => {
        console.log('creating convo');
        setLoadingConversation(userId)
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/conversations/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.current}`
                }
            })
            const response = await request.json();
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            console.log(response);
            const conversation = {...response.conversation, participants: [response.conversation.participants[0]]}
            setConversations((prev) => ([...prev, conversation]))
            setConversationID(response.conversation.id);
            setConnectedToRooms(false)
        } catch(err) {
            console.log(err)
            setConversationError(err.message)
            setTimeout(() => setConversationError(false), 3500)
        } finally {
            setLoadingConversation(0)
        }
    } 
    const handleListClick = async(e) => {
        const button = e.target.closest('button')
        if (button && button.dataset.func === 'convo') {
            const id = +button.id;
            setConversationID(id)
        } else if (button && button.dataset.func === 'new-convo') {
            const userId = +button.id;
            const isExistant = conversations.findIndex(conversation => {
                return !conversation.isGroup && conversation.participants[0].id === userId
            })
            if(isExistant > -1) {
                setConversationID(conversations[isExistant].id)
            } else {
                createConversation(userId)
            }
        } else if (button && button.dataset.func === 'profile') {
            const id = +button.id;
            setProfileID(id)
        } else {
            return;
        }
    }
    return (
        <>
            <Popup shouldRender={conversationError} close={setConversationError} borderColor='red'>
                <p>An error has occured, please try again later</p>
            </Popup>
            <Members addMembers={addMembers} setMembers={setMembers} friends={friends} users={users} groups={groups} groupID={conversationID} group={group} setConversations={setConversations} />

            <Group groupID={groupID} setGroupID={setGroupID} conversations={conversations} setConversations={setConversations} />

            <Image imageURL={imageURL} setImageURL={setImageURL} />

            <Profile userId={profileID} setProfileID={setProfileID} friends={friends} setFriends={setFriends} handleListClick={handleListClick} setOnlineFriends={setOnlineFriends} users={users} />
            <main className={styles.main}>

                <Sidebar setConversationID={setConversationID} conversationID={conversationID} setProfileID={setProfileID} friends={friends} setFriends={setFriends} conversations={conversations} setConversations={setConversations}  groups={groups} handleListClick={handleListClick} onlineFriends={onlineFriends} setOnlineFriends={setOnlineFriends} users={users} usersLoading={usersLoading} error={error} connectedRooms={connectedRooms} setConnectedToRooms={setConnectedToRooms} loadingConversation={loadingConversation} />

                <Messages conversationID={conversationID} setProfileID={setProfileID} setImageURL={setImageURL} setGroupID={setGroupID} setMembers={setMembers} refreshConversationID={refreshConversationID} setRefreshConversation={setRefreshConversation} />
            </main>
        </>
    )
}