import styles from './layout.module.css'
import { useState } from "react"
import Popup from "../popup/popup"
import { Link } from "react-router"
import { LoaderCircle } from 'lucide-react'
export default function Register () {
    const [firstName, setFirstname] = useState("")
    const [lastName, setLastname] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState(null);
    const [success, setSuccess] = useState(false)
    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            setLoading(true)
            const request = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    first_name: firstName,
                    last_name: lastName,
                    password,
                    confirm_password: confirmPassword
                })
            })
            const response = await request.json();
            if(!request.ok) {
                const error = new Error('Invalid Request')
                error.errors = response.errors;
                throw error
            }
            console.log(response)
            setSuccess(true)
            setErrors(null)
            setUsername("");
            setPassword("");
            setFirstname("")
            setLastname("")
            setConfirmPassword("")
        } catch(err) {
            console.log(err)
            setErrors(err.errors)
        } finally {
            setLoading(false)
        }
    }
    return (
        <>
        <Popup shouldRender={success} close={setSuccess} borderColor='#00d846'>
            <p>Registration Successful. <Link to='/login'>Login Here</Link></p>
        </Popup>
        <form onSubmit={handleSubmit} className={styles.register}>
            {errors && 
            <ul>
                {errors.map((error, index) => <li key={index}><p>✘ {error}</p></li>)}
            </ul>
            }
            <div className={styles.input}>
                <label htmlFor="first_name" hidden>First Name</label>
                <input type="text" id="first_name" placeholder="First Name" value={firstName} onChange={(e) => setFirstname(e.target.value)} />
            </div>
            <div className={styles.input}>
                <label htmlFor="last_name" hidden>Last Name</label>
                <input type="text" id="last_name" placeholder="Last Name" value={lastName} onChange={(e) => setLastname(e.target.value)} />
            </div>
            <div className={styles.input}>
                <label htmlFor="username" hidden>Username</label>
                <input type="text" id="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
                <label htmlFor="password" hidden>Password</label>
                <input type="password" id="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
                <label htmlFor="confirm_password" hidden>Confirm Password</label>
                <input type="password" id="confirm_password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button disabled={success ? true : loading ? true : false}>{loading ? <LoaderCircle size={40} color='white' className={styles.loading}/> : 'Sign Up'}</button>
            <div>
                <p>Already have an account? <Link to='/login'>Login here</Link></p>
            </div>
        </form>
        </>
    )
}