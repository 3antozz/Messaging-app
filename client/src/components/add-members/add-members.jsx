import styles from './add-members.module.css'
import { memo, useState } from 'react'
import PropTypes from 'prop-types';
import { X, UserPlus } from 'lucide-react';

const Members = memo(function Members ({addMembers, setMembers, friends, users, handleListClick, group}) {
    const [searchValue, setSearchValue] = useState('');
    let filteredUsers = friends;
    if(searchValue) {
        filteredUsers = users.filter((user) => `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchValue.toLowerCase()));
    }
    if(!group) {
        return <></>
    }
    return (
        <dialog open={addMembers} className={styles.backdrop} id='backdrop' onClick={(e) => e.target.id === 'backdrop' && setMembers(false)}>
            <section className={styles.addUsers}>
                <>
                <div>
                    <label htmlFor="user" hidden>Search for a user</label>
                    <input type="text" id='user' value={searchValue} placeholder='Search a user' onChange={(e) => setSearchValue(e.target.value)} />
                </div>
                {!searchValue && <h3>Friends</h3>}
                <ul className={styles.members} onClick={handleListClick}>
                    {filteredUsers.map((member) => {
                        return (
                            <li className={styles.member} key={member.id}>
                                <div className={styles.memberButton}>
                                    <button id={member.id} data-func="profile"><img src={member.picture_url || '/images/no-profile-pic.jpg'} alt={`${member.first_name} ${member.last_name} profile picture`}></img></button>
                                    <button id={member.id} data-func="profile">{member.first_name} {member.last_name}</button>
                                    <button id={member.id} data-func="add-group"><UserPlus /></button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
                <button className={styles.close} onClick={() => setMembers(false)}><X size={30} color='white'/></button>
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
    handleListClick: PropTypes.func.isRequired,
}

export default Members;



