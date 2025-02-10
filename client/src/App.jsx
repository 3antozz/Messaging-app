import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { Routes, Route } from "react-router";
import AuthLayout from './components/auth/layout.jsx';
import Login from './components/auth/login/login.jsx';
import Messenger from './components/Messenger/Messenger.jsx';
import { AuthContext } from './contexts.js';

function App() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const timeoutRef = useRef(null);
  const fetchToken = useCallback(async function fetchToken () {
    console.log('called');
    try {
      const request = await fetch(`${import.meta.env.VITE_API_URL}/refresh`, {
        method: 'POST',
        credentials: 'include'
      })
      const response = await request.json();
      console.log(response);
      setToken(response.accessToken);
      if(response.accessToken) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(fetchToken,  1000 * 60 * 4);
      }
    } catch(err) {
      console.log(err)
    }
  }, [])
  useEffect(() => {
    let ignore = false;
    const fetchUser = async () => {
      try {
        const request = await fetch(`${import.meta.env.VITE_API_URL}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const response = await request.json();
        console.log(response);
        setUser(response.user);
      } catch(err) {
        console.log(err)
      }
    }
    if(!ignore) {
      if(!token) {
        fetchToken();
      }
      if(!user) {
        fetchUser();
      }
    }
    return () => ignore = true;
  }, [fetchToken, token, user])
  const logout = async() => {
    try {
      const request = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      const response = await request.json();
      if(response.done) {
        setToken(null)
        setUser(null)
      }
    } catch(err) {
      console.log(err)
    }
  }


  return (
    <AuthContext.Provider value={{token, setToken, user, setUser, timeoutRef, fetchToken, logout}}>
        <Routes>
            <Route path="/" element={<Messenger />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              {/* <Route path="register" element={<Register />} /> */}
            </Route>
        </Routes>
    </AuthContext.Provider>
  )
}

export default App
