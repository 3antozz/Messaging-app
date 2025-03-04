import styles from './group.module.css'
import { memo, useEffect, useState, useContext, useMemo } from 'react'
import PropTypes from 'prop-types';
import { AuthContext } from '../../contexts'
import { X, UserX, LoaderCircle } from 'lucide-react';

const Group = memo(function Group ({groupID, setGroupID, handleListClick, removingMember}) {
    const { user, token, socket, socketOn } = useContext(AuthContext)
    const [loading, setLoading] = useState(false)
    const [edit, setEdit] = useState(false);
    const [groups, setGroups] = useState({});
    const [groupName, setGroupName] = useState('');
    const [image, setImage] = useState(null);
    const [refreshGroupID, setRefreshGroup] = useState(null)
    const group = useMemo(() => {
        const group = groups[groupID];
        setGroupName(group?.group_name);
        return group;
    },  [groups, groupID])
    useEffect(() => {
        const fetchGroup = async() => {
            setLoading(true)
            console.log('group fetched!');
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/groups/${groupID}`, {
                    headers: {
                        'Authorization': `Bearer ${token.current}`
                    }
                })
                const response = await request.json();
                console.log(response);
                setGroups((prev) => ({...prev, [response.group.id]: response.group}))
            } catch(err) {
                console.log(err)
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
    

    const editGroup = async(e) => {
        e.preventDefault();
        if(!groupName && !image) {
            return;
        }
        if(image) {
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
                    const error = new Error(response.message)
                    throw error;
                }
                console.log(response);
                setEdit(false)
                setImage(null)
                setGroupName('');
            } catch (error) {
                console.log(error)
            }
        }
        if(groupName && !image) {
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
                    const error = new Error(response.message)
                    throw error;
                }
                console.log(response);
                setEdit(false)
                setImage(null)
                setGroupName('');
            } catch (error) {
                console.log(error)
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
            <section className={styles.group}>
                {loading || !group ? 
                <>
                <section className={styles.conversationsLoading}>
                    <LoaderCircle  size={40} color='white' className={styles.loading}/>
                </section>
                <button className={styles.close} onClick={() => setGroupID(null)}><X size={30} color='white'/></button>
                </> :
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
                        <label htmlFor="picture" hidden>Group picture</label>
                        <input type="file" id='picture' onChange={handleImageInput} />
                        <label htmlFor="name" hidden>Group name</label>
                        <input type="text" id='name' value={groupName} placeholder='Group name' onChange={(e) => setGroupName(e.target.value)} />
                        <div>
                            <button className={styles.confirm}>Submit</button>
                            <button type='button' className={styles.cancel} onClick={() => setEdit(false)}>Cancel</button>
                        </div>
                    </form>
                    }
                </div>
                <h3>Members</h3>
                <ul className={styles.members} onClick={handleListClick}>
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
                    setGroupID(null)}}><X size={30} color='white'/></button>
                </>
                }
            </section>
        </dialog>
    )
})



Group.propTypes = {
    groupID: PropTypes.number,
    setGroupID: PropTypes.func.isRequired,
    handleListClick: PropTypes.func.isRequired,
    removingMember: PropTypes.number.isRequired
}

export default Group;



