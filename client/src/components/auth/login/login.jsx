import styles from "./login.module.css"
import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { useContext } from 'react'
import { AuthContext } from "../../../contexts"
import Popup from "../../popup/popup"
export default function Login () {
    const navigate = useNavigate();
    const { token, timeoutRef, fetchToken, setAuthentication } = useContext(AuthContext)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState(null);
    const [success, setSuccess] = useState(false)
    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            setLoading(true)
            const request = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            })
            const response = await request.json();
            if(!request.ok) {
                const error = new Error('Invalid Request')
                error.errors = response.errors;
                throw error
            }
            setSuccess(true)
            setTimeout(() => {
                if(!success) {
                    setSuccess(false)
                }
            }, 2500)
            setErrors(null)
            token.current = response.accessToken;
            setAuthentication(true)
            timeoutRef.current = setTimeout(fetchToken, 1000 * 60 * 4);
            console.log(response)
            setTimeout(() => {
                navigate('/')
                setLoading(false)
            }, 3000)
        } catch(err) {
            console.log(err)
            setErrors(err.errors)
        } 
    }
    return (
        <form onSubmit={handleSubmit}>
            <Popup shouldRender={success} close={setSuccess}>
                <p>Login successful!</p>
            </Popup>
            <p>You don&apos;t have an account? <Link to='/register'>Register here</Link></p>
            {errors && 
            <ul>
                {errors.map((error, index) => <li key={index}><p>{error}</p></li>)}
            </ul>
            }
            <div className={styles.input}>
                <label htmlFor="username">Username</label>
                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
                <label htmlFor="password">Password</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button disabled={success ? true : loading ? true : false}>{loading ? 'Loading' : 'Login'}</button>
        </form>
    )
}