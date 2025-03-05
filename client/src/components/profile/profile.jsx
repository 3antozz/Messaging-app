import styles from './profile.module.css'
import { memo, useEffect, useState, useContext, useMemo } from 'react'
import PropTypes from 'prop-types';
import { AuthContext } from '../../contexts'
import { X, LoaderCircle } from 'lucide-react';
import Popup from "../popup/popup"

const Profile = memo(function Profile ({userId, setProfileID, friends, setFriends, handleListClick, setOnlineFriends, users}) {
    const { user, setUser, token, socket, socketOn } = useContext(AuthContext)
    const [loading, setLoading] = useState(false)
    const [profiles, setProfiles] = useState({})
    const [edit, setEdit] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [image, setImage] = useState(null);
    const [refreshProfileID, setRefreshProfile] = useState(null);
    const [profileError, setProfileError] = useState(null);
    const [profileSuccess, setProfileSuccess] = useState(false)
    const [friendAdded, setFriendAdded] = useState(false)
    const [friendRemoved, setFriendRemoved] = useState(false)
    const [friendshipLoading, setFriendshipLoading] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false)
    const profile = useMemo(() => profiles[userId], [profiles, userId])

    useEffect(() => {
        if(edit) {
            setFirstName(profile?.first_name);
            setLastName(profile?.last_name);
            setBio(profile?.bio);
        }
    }, [edit, profile])
    useEffect(() => {
        if(refreshProfileID) {
            setProfiles(prev => {
                // eslint-disable-next-line no-unused-vars
                const { [refreshProfileID]: removedGroup, ...rest } = prev;
                return rest;
            })
            setRefreshProfile(null)
        }
    }, [refreshProfileID])

    useEffect(() => {
        const refreshProfile = (user) => {
            setRefreshProfile(user.id)
        }
        if(socketOn){
            socket.current.on('edit user', refreshProfile)
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('edit user', refreshProfile);
            }
        };
    }, [socket, socketOn, profile])
    const addFriend = async() => {
        setFriendshipLoading(true);
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
            setFriends(prev => ([response.friend, ...prev]))
            setProfiles(prev => ({...prev, [profile.id]: {...prev[profile.id], isFriend: true} }))
            setOnlineFriends(false)
            setFriendAdded(true)
        } catch(err) {
            console.log(err)
            setFriendAdded('error')
        } finally {
            setTimeout(() => setFriendAdded(false), 3500)
            setFriendshipLoading(false)
        }
    }
    const editProfile = async(e) => {
        e.preventDefault();
        if((!firstName || !lastName) && !image) {
            return setProfileError(['First or Last name must not be empty']);
        }
        if(image) {
            setEditingProfile(true)
            try {
                const form = new FormData();
                form.append('image', image)
                form.append('first_name', firstName)
                form.append('last_name', lastName)
                if(bio) {
                    form.append('bio', bio)
                }
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/upload`, {
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
                console.log(response);
                setUser(prev => ({...prev, ...response.user}))
                setProfileSuccess(true)
                setTimeout(() => setProfileSuccess(false), 3500)
                setProfileError(null)
                setEdit(false)
                setImage(null)
                setFirstName('');
                setLastName('');
                setBio('');
            } catch (err) {
                console.log(err)
                if(err.errors) {
                    setProfileError(err.errors)
                } else {
                    setProfileError([err.message])
                }
            } finally {
                setEditingProfile(false)
            }
        }
        if((firstName && lastName) && !image) {
            setEditingProfile(true)
            try {
                const request = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token.current}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        bio: bio
                    })
                })
                const response = await request.json();
                if(!request.ok) {
                    const error = new Error(response.message || 'Invalid Request')
                    error.errors = response.errors;
                    throw error
                }
                console.log(response);
                setUser(prev => ({...prev, ...response.user}))
                setProfileSuccess(true)
                setTimeout(() => setProfileSuccess(false), 3500)
                setProfileError(null)
                setEdit(false)
                setImage(null)
                setFirstName('');
                setLastName('');
                setBio('');
            } catch (err) {
                console.log(err)
                if(err.errors) {
                    setProfileError(err.errors)
                } else {
                    setProfileError([err.message])
                }
            } finally {
                setEditingProfile(false)
            }
        }
    }
    const removeFriend = async() => {
        setFriendshipLoading(true);
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
            setOnlineFriends(false)
            setFriendRemoved(true)
        } catch(err) {
            console.log(err)
            setFriendRemoved('error')
        } finally {
            setTimeout(() => setFriendRemoved(false), 3500)
            setFriendshipLoading(false);
        }
    }
    const handleMessageButton = (e) => {
        setProfileID(null);
        handleListClick(e)
    }
    const handleImageInput = (e) => {
        const file = e.target.files[0];
        if(file) {
            setImage(e.target.files[0])
        }
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
    useEffect(() => {
        const addNewFriend = (userId) => {
            const index = users.findIndex((user) => user.id === userId)
            setFriends(prev => [users[index], ...prev])
            setOnlineFriends(false);
        }
        const removeFriend = (userId) => {
            console.log(userId);
            const index = friends.findIndex((user) => user.id === userId)
            setFriends(prev => prev.toSpliced(index, 1))
            setOnlineFriends(false);
        }
        if(socketOn){
            socket.current.on('new friend', addNewFriend)
            socket.current.on('remove friend', removeFriend)
        }
        const listener = socket.current;
        return () => {
            if(listener) {
                listener.off('new friend');
                listener.off('remove friend');
            }
        };
    }, [friends, setFriends, setOnlineFriends, socket, socketOn, users])

    return (
        <dialog open={userId} className={styles.backdrop} id='backdrop'>
            <Popup shouldRender={friendAdded} close={setFriendAdded} borderColor={friendAdded === 'error' ? 'red' : '#00d846'}>
                <p>{friendAdded === 'error' ? 'An error has Occured, please try again later' : 'Friend Added'}</p>
            </Popup>
            <Popup shouldRender={friendRemoved} close={setFriendRemoved} borderColor={friendRemoved === 'error' ? 'red' : '#00d846'}>
                <p>{friendRemoved === 'error' ? 'An error has Occured, please try again later' : 'Friend Removed'}</p>
            </Popup>
            <Popup shouldRender={profileSuccess} close={setProfileSuccess} borderColor='#00d846'>
                <p>Group Edited Successfully</p>
            </Popup>
            <section className={styles.profile}>
                {loading || !profile ?
                <>
                <section className={styles.conversationsLoading}>
                    <LoaderCircle  size={40} color='white' className={styles.loading}/>
                </section>
                <button className={styles.close} onClick={() => {
                    setEdit(false);
                    setProfileID(null)
                    }}><X size={38} color='white'/></button>
                </> :
                <>
                <div className={styles.top}>
                    <img src={profile.picture_url || '/images/no-profile-pic.jpg' } alt={`${profile.first_name} ${profile.last_name} profile picture`}></img>
                    {!edit ? 
                    <>
                    <h2>{profile.first_name} {profile.last_name}</h2>
                    {(user && user.id == userId && !edit) && 
                    <>
                    <p className={styles.username}>@{user.username}</p>
                    </>
                    }
                    </> :
                    <form onSubmit={editProfile} className={styles.profileForm}>
                        {profileError && 
                        <ul>
                            {profileError.map((error, index) => <li key={index}><p>✘ {error}</p></li>)}
                        </ul>
                        }
                        <label htmlFor="picture" hidden>Group picture</label>
                        <input type="file" id='picture' onChange={handleImageInput} />
                        <label htmlFor="first_name" hidden></label>
                        <input type="text" id='first_name' value={firstName} placeholder='First Name' onChange={(e) => setFirstName(e.target.value)} />
                        <label htmlFor="last_name" hidden></label>
                        <input type="text" id='last_name' value={lastName} placeholder='Last Name' onChange={(e) => setLastName(e.target.value)} />
                        <div>
                            <button className={styles.edit} disabled={editingProfile}>{editingProfile ? <LoaderCircle  size={28} color='white' className={styles.loading}/> : 'Submit'}</button>
                            <button type='button' className={styles.cancel} disabled={editingProfile} onClick={() => setEdit(false)}>Cancel</button>
                        </div>
                    </form>
                    }
                    {(user && user.id == userId && !edit) && 
                    <button className={styles.edit} onClick={() => setEdit(true)}>Edit Profile</button>
                    }
                </div>
                <h3>About Me</h3>
                <div className={styles.info}>
                    {!edit ? 
                    profile.bio ? <p className={styles.bio}>{profile.bio}</p> : <p className={styles.bio} style={{textAlign: 'center'}}>User has no bio</p> : 
                    <>
                    <label htmlFor="bio" hidden></label>
                    <textarea type="text" id='bio' value={bio || ''} placeholder='Bio' onChange={(e) => setBio(e.target.value)}></textarea>
                    </>
                    }
                    <p className={styles.date}>Join Date: {profile.joinDate}</p>
                </div>
                {(user && user.id !== +userId) &&
                <div className={styles.buttons}>
                    <button className={styles.messageBtn} data-func="new-convo" id={profile.id} onClick={handleMessageButton}>Message</button>
                    {profile.isFriend ? <button className={styles.removeFriend} disabled={friendshipLoading} onClick={removeFriend}>{friendshipLoading ? <LoaderCircle  size={28} color='white' className={styles.loading}/> : 'Remove Friend'}</button> : <button className={styles.addFriend} disabled={friendshipLoading} onClick={addFriend}>{friendshipLoading ? <LoaderCircle  size={28} color='white' className={styles.loading}/> : 'Add Friend'}</button>}
                </div>
                }
                <button className={styles.close} onClick={() => {
                    setEdit(false);
                    setProfileID(null)
                    }}><X size={38} color='white'/></button>
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
    setOnlineFriends: PropTypes.func.isRequired,
    users: PropTypes.array.isRequired,
}

export default Profile;



