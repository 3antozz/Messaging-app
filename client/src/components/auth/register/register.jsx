import styles from "./register.module.css"
import { useState } from "react"
import { useNavigate } from "react-router"
import { useContext } from 'react'
import { AuthContext } from "../../../contexts"
export default function Login () {
    const navigate = useNavigate();
    const { setToken, timeoutRef, fetchToken } = useContext(AuthContext)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
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
            setToken(response.accessToken)
            timeoutRef.current = setTimeout(fetchToken, 1000 * 60 * 4);
            console.log(response)
            navigate('/')
        } catch(err) {
            console.log(err)
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <div className={styles.input}>
                <label htmlFor="username">Username</label>
                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
                <label htmlFor="username">Password</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button>Login</button>
        </form>
    )
}