import styles from './profile.module.css'
import { memo, useEffect, useState, useContext, useMemo } from 'react'
import PropTypes from 'prop-types';
import { AuthContext } from '../../contexts'
import { X } from 'lucide-react';

const Profile = memo(function Profile ({userId, setProfileID, friends, setFriends, handleListClick}) {
    const { user, token } = useContext(AuthContext)
    const [loading, setLoading] = useState(false)
    const [profiles, setProfiles] = useState({})
    const profile = useMemo(() => {
        return profiles[userId];
    },  [profiles, userId])
    const addFriend = async() => {
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/friends/add`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.current}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    friendId: profile.id
                })
            })
            const response = await request.json();
            console.log(response);
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            setFriends(prev => ([...prev, response.friend]))
            setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], isFriend: true} }))
        } catch(err) {
            console.log(err)
        }
    }
    const removeFriend = async() => {
        try {
            const request = await fetch(`${import.meta.env.VITE_API_URL}/friends/remove`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.current}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    friendId: profile.id
                })
            })
            const response = await request.json();
            console.log(response);
            if(!request.ok) {
                const error = new Error('An error has occured, please try again later')
                throw error;
            }
            setFriends(prev => {
                const array = prev.slice();
                const index = array.findIndex(friend => friend.id === profile.id);
                array.splice(index, 1);
                return array;
            })
            setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], isFriend: false} }))
        } catch(err) {
            console.log(err)
        }
    }
    const handleMessageButton = (e) => {
        setProfileID(null);
        handleListClick(e)
    }
    useEffect(() => {
        const fetchProfile = async() => {
            console.log('profile fetched!')
            try {
                setLoading(true)
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`)
                const response = await request.json();
                console.log(response);
                const isFriend = friends.findIndex((friend) => friend.id === response.profile.id)
                if (isFriend > -1) {
                    response.profile = {...response.profile, isFriend: true}
                }
                setProfiles((prev) => ({...prev, [response.profile.id]: response.profile}))
            } catch(err) {
                console.log(err)
            } finally {
                setLoading(false)
            }
        }
        if(userId) {
            const profile = profiles[userId];
            if(!profile) {
                fetchProfile();
            }
        }
    }, [friends, profiles, userId])

    if(!profile) {
        return <></>
    }
    return (
        <dialog open={userId} className={styles.backdrop}>
            <section className={styles.profile}>
                {loading ? 
                <>
                <p>Loading</p>  
                <button onClick={() => setProfileID(null)}>Close</button>
                </> :
                <>
                <div className={styles.top}>
                    {profile.picture_url ? <img src={profile.picture_url} alt={`${profile.first_name} ${profile.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                    <h2>{profile.first_name} {profile.last_name}</h2>
                    {(user && user.id == userId) && 
                    <button className={styles.edit}>Edit Profile</button>
                    }
                </div>
                <h3>About Me</h3>
                <div className={styles.info}>
                    <p className={styles.bio}>{profile.bio ? `${profile.bio}` : 'User has no bio'}</p>
                    <p className={styles.date}>Join Date: {profile.joinDate}</p>
                </div>
                {(user && user.id !== +userId) &&
                <div className={styles.buttons}>
                    <button className={styles.messageBtn} data-func="new-convo" id={profile.id} onClick={handleMessageButton}>Message</button>
                    {profile.isFriend ? <button className={styles.removeFriend} onClick={removeFriend}>Remove Friend</button> : <button className={styles.addFriend} onClick={addFriend}>Add friend</button>}
                </div>
                }
                <button className={styles.close} onClick={() => setProfileID(null)}><X size={30} color='white'/></button>
                </>
                }
            </section>
        </dialog>
    )
})



Profile.propTypes = {
    userId: PropTypes.number,
    setProfileID: PropTypes.func.isRequired,
    friends: PropTypes.array.isRequired,
    setFriends: PropTypes.func.isRequired,
    handleListClick: PropTypes.func.isRequired,
}

export default Profile;



