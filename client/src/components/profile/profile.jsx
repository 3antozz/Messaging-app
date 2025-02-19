import styles from './profile.module.css'
import { memo, useEffect, useState, useContext, useMemo } from 'react'
import PropTypes from 'prop-types';
import { AuthContext } from '../../contexts'
import { X } from 'lucide-react';

const Profile = memo(function Profile ({userId, setProfileID}) {
    const { user } = useContext(AuthContext)
    const [loading, setLoading] = useState(false)
    const [profiles, setProfiles] = useState({})
    const profile = useMemo(() => {
        return profiles[userId];
    },  [profiles, userId])
    useEffect(() => {
        const fetchProfile = async() => {
            console.log('profile fetched!')
            try {
                setLoading(true)
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`)
                const response = await request.json();
                console.log(response);
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
    }, [profiles, userId])

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
                {profile.picture_url ? <img src={profile.picture_url} alt={`${profile.first_name} ${profile.last_name} profile picture`}></img> : <img src='/images/no-profile-pic.jpg'></img>}
                <h2>{profile.first_name} {profile.last_name}</h2>
                <p>{profile.bio ? `${profile.bio}` : 'User has no bio'}</p>
                <p>Join Date: {profile.joinDate}</p>
                <button className={styles.close} onClick={() => setProfileID(null)}><X size={30} color='white'/></button>
                {(user && user.id == userId) && 
                <button className={styles.edit}>Edit Profile</button>
                }
                </>
                }
            </section>
        </dialog>
    )
})



Profile.propTypes = {
    userId: PropTypes.number,
    setProfileID: PropTypes.func.isRequired,
}

export default Profile;



