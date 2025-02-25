import styles from './group.module.css'
import { memo, useEffect, useState, useContext, useMemo } from 'react'
import PropTypes from 'prop-types';
import { AuthContext } from '../../contexts'
import { X } from 'lucide-react';

const Group = memo(function Group ({groupID, setGroupID}) {
    const { user, token } = useContext(AuthContext)
    const [loading, setLoading] = useState(false)
    const [groups, setGroups] = useState({})
    const group = useMemo(() => {
        return groups[groupID];
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

    if(!group) {
        return <></>
    }
    return (
        <dialog open={groupID} className={styles.backdrop} id='backdrop' onClick={(e) => e.target.id === 'backdrop' && setGroupID(null)}>
            <section className={styles.group}>
                {loading ? 
                <>
                <p>Loading</p>  
                <button onClick={() => setGroupID(null)}>Close</button>
                </> :
                <>
                <div className={styles.top}>
                    <img src={group.picture_url || '/images/no-group-pic.png' } alt={`${group.group_name} group picture`}></img>
                    <h2>{group.group_name}</h2>
                    {(user && user.id == group.adminId) && 
                    <button className={styles.edit}>Edit group</button>
                    }
                </div>
                <ul className={styles.members}>
                    {group.participants.map((member) => {
                        return (
                            <li className={styles.member} key={member.id}>
                                <div className={styles.memberButton}>
                                    <button id={member.id} data-func="profile"><img src={member.picture_url || '/images/no-profile-pic.jpg'} alt={`${member.first_name} ${member.last_name} profile picture`}></img></button>
                                    <button id={member.id} data-func="profile">{member.first_name} {member.last_name}</button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
                <button className={styles.close} onClick={() => setGroupID(null)}><X size={30} color='white'/></button>
                </>
                }
            </section>
        </dialog>
    )
})



Group.propTypes = {
    groupID: PropTypes.number,
    setGroupID: PropTypes.func.isRequired,
}

export default Group;



