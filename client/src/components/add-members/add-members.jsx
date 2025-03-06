import styles from './add-members.module.css'
import { memo, useState, useContext } from 'react'
import PropTypes from 'prop-types';
import Popup from "../popup/popup"
import { AuthContext } from '../../contexts'
import { X, UserPlus, LoaderCircle, Search } from 'lucide-react';

const Members = memo(function Members ({addMembers, setMembers, friends, users, group, setConversations}) {
    const { token } = useContext(AuthContext)
    const [searchValue, setSearchValue] = useState('');
    const [addingMember, setAddingMember] = useState(0);
    const [memberAdded, setMemberAdded] = useState(false);
    let filteredUsers = friends;
    const addMember = async(userId) => {
        setAddingMember(userId)
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/groups/${group.id}/add-member/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.current}`,
                },
            })
            const response = await request.json();
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            setConversations((prev) => {
                const newConv = prev.slice();
                const index = newConv.findIndex(group => group.id === response.group.id)
                newConv[index] = response.group;
                return newConv
            })
            setMemberAdded(true);
        // eslint-disable-next-line no-unused-vars
        } catch(err) {
            setMemberAdded('error');
        } finally {
            setAddingMember(0);
            setTimeout(() => setMemberAdded(false), 3500)
        }
    }
    const handleMemberAdd = (e) => {
        const button = e.target.closest('button')
        if (button && button.dataset.func === 'add-member') {
            const userId = +button.id;
            const alreadyMember = group.participants.findIndex((member) => member.id === userId)
            if (alreadyMember > -1) {
                setAddingMember(0);
                setMemberAdded('member');
                setTimeout(() => setMemberAdded(false), 3500)
            } else {
                addMember(userId)
            }
        }
    }
    if(searchValue) {
        filteredUsers = users.filter((user) => `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchValue.toLowerCase()));
    }
    if(!group) {
        return <></>
    }
    return (
        <dialog open={addMembers} className={styles.backdrop} id='backdrop' onClick={(e) => e.target.id === 'backdrop' && setMembers(false)}>
            <Popup shouldRender={memberAdded} close={setMemberAdded} borderColor={memberAdded === 'error' ? 'red' : '#00d846'}>
                <p>{memberAdded === 'error' ? 'An error has Occured, please try again later' : memberAdded === 'member' ? 'Already a member' : 'Member Added'}</p>
            </Popup>
            <section className={styles.addUsers}>
                <h2>Add Members</h2>
                <>
                <div className={styles.searchDiv}>
                    <label htmlFor="user" hidden>Search for a user</label>
                    <input type="text" id='user' value={searchValue} placeholder='Search a user' onChange={(e) => setSearchValue(e.target.value)} />
                    <Search className={styles.searchIcon}/>
                </div>
                {!searchValue && <h3>Friends</h3>}
                <ul className={styles.members} onClick={handleMemberAdd}>
                    {filteredUsers.map((member) => {
                        return (
                            <li className={styles.member} key={member.id}>
                                <div className={styles.memberButton}>
                                    <button id={member.id} data-func="profile"><img src={member.picture_url || '/images/no-profile-pic.jpg'} alt={`${member.first_name} ${member.last_name} profile picture`}></img></button>
                                    <button id={member.id} data-func="profile">{member.first_name} {member.last_name}</button>
                                    <button id={member.id} disabled={addingMember} data-func="add-member">{addingMember !== member.id ? <UserPlus /> : <LoaderCircle  size={28} color='white' className={styles.loading}/>}</button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
                <button className={styles.close} onClick={() => setMembers(false)}><X size={38} color='white'/></button>
                </>
            </section>
        </dialog>
    )
})



Members.propTypes = {
    group: PropTypes.object.isRequired,
    addMembers: PropTypes.bool.isRequired,
    setMembers: PropTypes.func.isRequired,
    friends: PropTypes.array.isRequired,
    users: PropTypes.array.isRequired,
    setConversations: PropTypes.func.isRequired,
}

export default Members;



