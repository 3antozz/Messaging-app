import styles from './group.module.css'
import { memo, useEffect, useState, useContext, useMemo } from 'react'
import PropTypes from 'prop-types';
import Popup from "../popup/popup"
import { AuthContext } from '../../contexts'
import { X, UserX, LoaderCircle } from 'lucide-react';

const Group = memo(function Group ({groupID, setGroupID, conversations, setConversations}) {
    const { user, token, socket, socketOn } = useContext(AuthContext)
    const [loading, setLoading] = useState(true)
    const [edit, setEdit] = useState(false);
    const [groups, setGroups] = useState({});
    const [groupName, setGroupName] = useState('');
    const [image, setImage] = useState(null);
    const [refreshGroupID, setRefreshGroup] = useState(null)
    const [loadingError, setLoadingError] = useState(false)
    const [groupError, setGroupError] = useState(null);
    const [groupSuccess, setGroupSuccess] = useState(false)
    const [memberRemoved, setMemberRemoved] = useState(false)
    const [removingMember, setRemovingMember] = useState(0)
    const [editing, setEditng] = useState(false)
    const group = useMemo(() => {
        const group = groups[groupID];
        setGroupName(group?.group_name);
        return group;
    },  [groups, groupID])
    useEffect(() => {
        const fetchGroup = async() => {
            setLoading(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupID}`, {
                    headers: {
                        'Authorization': `Bearer ${token.current}`
                    }
                })
                if(!request.ok) {
                    const error = new Error('An error has occured, please try again later')
                    throw error;
                }
                const response = await request.json();
                setGroups((prev) => ({...prev, [response.group.id]: response.group}))
                setLoadingError(false)
            // eslint-disable-next-line no-unused-vars
            } catch (err) {
                setLoadingError(true);
            } finally {
                setLoading(false)
            }
        }
        if(groupID) {
            const group = groups[groupID];
            if(!group) {
                fetchGroup();
            }
        }
    }, [groups, groupID, token])

    useEffect(() => {
        if(refreshGroupID) {
            setGroups(prev => {
                // eslint-disable-next-line no-unused-vars
                const { [refreshGroupID]: removedGroup, ...rest } = prev;
                return rest;
            })
            setRefreshGroup(null)
        }
    }, [refreshGroupID, setRefreshGroup])

    useEffect(() => {
        if(socketOn){
            socket.current.on('new member', (groupId) => {
                setRefreshGroup(groupId)
            })
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('new member');
            }
        };
    }, [setRefreshGroup, socket, socketOn])

    const handleMemberRemoval = (e) => {
        const button = e.target.closest('button')
        if (button && button.dataset.func === 'remove-member') {
            const userId = +button.id;
            removeMember(userId)
        }
    }

    const removeMember = async(userId) => {
        setRemovingMember(userId)
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupID}/remove-member/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.current}`,
                },
            })
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            const index = conversations.findIndex((conv) => conv.id === groupID)
            setConversations(prev => {
                const convos = prev.slice();
                const memberIndex = convos[index].participants.findIndex((membr) => membr.id === userId)
                convos[index].participants.splice(memberIndex, 1);
                return convos
            })
            setMemberRemoved(true)
        // eslint-disable-next-line no-unused-vars
        } catch(err) {
            setMemberRemoved('error')
        } finally {
            setRemovingMember(0)
            setTimeout(() => setMemberRemoved(false), 3500)
        }
    }
    

    const editGroup = async(e) => {
        e.preventDefault();
        if(!groupName && !image) {
            return setGroupError(['Group name must not be empty']);
        }
        if(image) {
            setEditng(true)
            try {
                const form = new FormData();
                form.append('image', image)
                if(groupName) {
                    form.append('name', groupName)
                }
                const request = await fetch(`${import.meta.env.VITE_API_URL}/groups/upload/${groupID}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token.current}`,
                    },
                    body: form
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
                setEdit(false)
                setImage(null)
                setGroupName('');
            } catch (err) {
                if(err.errors) {
                    setGroupError(err.errors)
                } else {
                    setGroupError([err.message])
                }
            } finally {
                setEditng(false)
            }
        }
        if(groupName && !image) {
            setEditng(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/groups/edit/${groupID}`, {
                    method: 'PUT',
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
                setEdit(false)
                setImage(null)
                setGroupName('');
            } catch (err) {
                if(err.errors) {
                    setGroupError(err.errors)
                } else {
                    setGroupError([err.message])
                }
            } finally {
                setEditng(false)
            }
        }
    }
    const handleImageInput = (e) => {
        const file = e.target.files[0];
        if(file) {
            setImage(e.target.files[0])
        }
    }
    return (
        <dialog open={groupID} className={styles.backdrop} id='backdrop'>
            <Popup shouldRender={memberRemoved} close={setMemberRemoved} borderColor={memberRemoved === 'error' ? 'red' : '#00d846'}>
                <p>{memberRemoved === 'error' ? 'An error has Occured, please try again later' : 'Member Removed'}</p>
            </Popup>
            <Popup shouldRender={groupSuccess} close={setGroupSuccess} borderColor='#00d846'>
                <p>Group Edited Successfully</p>
            </Popup>
            <section className={styles.group}>
                {loading ? 
                <>
                <section className={styles.conversationsLoading}>
                    <LoaderCircle  size={40} color='white' className={styles.loading}/>
                </section>
                <button className={styles.close} onClick={() => setGroupID(null)}><X size={38} color='white'/></button>
                </> : loadingError || !group ? 
                <section className={styles.conversationsLoading}>
                    <p style={{fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center'}}>An Error has Occured, please try again later</p>
                    <button className={styles.close} onClick={() => setGroupID(null)}><X size={38} color='white'/></button>
                </section> :
                <>
                <div className={styles.top}>
                    {!edit ? 
                    <>
                    <img src={group.picture_url || '/images/no-group-pic.png' } alt={`${group.group_name} group picture`}></img>
                    <h2>{group.group_name}</h2>
                    {(user && user.id == group.adminId) && 
                    <button className={styles.edit} onClick={() => setEdit(true)}>Edit group</button>
                    }
                    </> :
                    <form onSubmit={editGroup} className={styles.groupForm}>
                        <img src={group.picture_url || '/images/no-group-pic.png' } alt={`${group.group_name} group picture`}></img>
                        {groupError && 
                        <ul>
                            {groupError.map((error, index) => <li key={index}><p>✘ {error}</p></li>)}
                        </ul>
                        }
                        <label htmlFor="picture" hidden>Group picture</label>
                        <input type="file" id='picture' onChange={handleImageInput} />
                        <label htmlFor="name" hidden>Group name</label>
                        <input type="text" id='name' value={groupName} required minLength={3} maxLength={20} placeholder='Group name' onChange={(e) => setGroupName(e.target.value)} />
                        <div>
                            <button className={styles.confirm} disabled={editing}>{editing ? <LoaderCircle  size={28} color='white' className={styles.loading}/> : 'Submit'}</button>
                            <button type='button' className={styles.cancel} disabled={editing} onClick={() => setEdit(false)}>Cancel</button>
                        </div>
                    </form>
                    }
                </div>
                <h3>Members</h3>
                <ul className={styles.members} onClick={handleMemberRemoval}>
                    {group.participants.map((member) => {
                        return (
                            <li className={styles.member} key={member.id}>
                                <div className={styles.memberButton}>
                                    <button id={member.id} data-func="profile"><img src={member.picture_url || '/images/no-profile-pic.jpg'} alt={`${member.first_name} ${member.last_name} profile picture`}></img></button>
                                    <button id={member.id} data-func="profile">{member.first_name} {member.last_name}</button>
                                    {(user && user.id == group.adminId) && 
                                    <button className={styles.edit} disabled={removingMember} id={member.id} data-func="remove-member">{removingMember !== member.id ? <UserX /> : <LoaderCircle  size={28} color='white' className={styles.loading}/>}</button>
                                    }
                                </div>
                            </li>
                        )
                    })}
                </ul>
                <button className={styles.close} onClick={() => {
                    setEdit(false);
                    setGroupID(null)}}><X size={38} color='white'/></button>
                </>
                }
            </section>
        </dialog>
    )
})



Group.propTypes = {
    groupID: PropTypes.number,
    setGroupID: PropTypes.func.isRequired,
    conversations: PropTypes.array.isRequired,
    setConversations: PropTypes.func.isRequired,
}

export default Group;



