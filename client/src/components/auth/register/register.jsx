import styles from "./register.module.css"
import { useState } from "react"
import Popup from "../../popup/popup"
import { Link } from "react-router"
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
            setTimeout(() => {
                if(!success) {
                    setSuccess(false)
                }
            }, 10000)
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
        <form onSubmit={handleSubmit}>
            <Popup shouldRender={success} close={setSuccess}>
                <p>Signup Successfull! You can login in from <Link to='/login'>Here</Link></p>
            </Popup>
            <p>You don&apos;t have an account? <Link to='/login'>Register here</Link></p>
            {errors && 
            <ul>
                {errors.map((error, index) => <li key={index}><p>{error}</p></li>)}
            </ul>
            }
            <div className={styles.input}>
                <label htmlFor="first_name">First Name</label>
                <input type="text" id="first_name" value={firstName} onChange={(e) => setFirstname(e.target.value)} />
            </div>
            <div className={styles.input}>
                <label htmlFor="last_name">Last Name</label>
                <input type="text" id="last_name" value={lastName} onChange={(e) => setLastname(e.target.value)} />
            </div>
            <div className={styles.input}>
                <label htmlFor="username">Username</label>
                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
                <label htmlFor="password">Password</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
                <label htmlFor="confirm_password">Confirm Password</label>
                <input type="password" id="confirm_password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button disabled={success ? true : loading ? true : false}>{loading ? 'Loading' : 'Sign Up'}</button>
        </form>
    )
}