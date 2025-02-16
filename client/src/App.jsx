import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { Routes, Route, useNavigate } from "react-router";
import AuthLayout from './components/auth/layout.jsx';
import Login from './components/auth/login/login.jsx';
import Register from './components/auth/register/register.jsx';
import Messenger from './components/Messenger/Messenger.jsx';
import { AuthContext } from './contexts.js';
import { io } from "socket.io-client";

function App() {
  const token = useRef(null)
  const [user, setUser] = useState(null)
  const timeoutRef = useRef(null);
  const [isFetched, setFetched] = useState(false)
  const [isAuthenticated, setAuthentication] = useState(false)
  const socket = useRef(null)
  const navigate = useNavigate();
  const logout = useCallback(async() => {
    try {
      const request = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      const response = await request.json();
      if(response.done) {
        token.current = null;
        setUser(null)
        setFetched(false)
        setAuthentication(false);
        navigate('/')
      }
    } catch(err) {
      console.log(err)
    }
  }, [navigate])
  const fetchToken = useCallback(async function fetchToken () {
    try {
      const request = await fetch(`${import.meta.env.VITE_API_URL}/refresh`, {
        method: 'POST',
        credentials: 'include'
      })
      const response = await request.json();
      console.log(response);
      if(response.message === 'jwt expired') {
        const error = new Error('Please login in')
        logout();
        throw error
      }
      if(!request.ok) {
        const error = new Error('Please login in')
        throw error
      }
      if(response.accessToken) {
        token.current = response.accessToken;
        setAuthentication(true);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(fetchToken,  1000 * 60 * 4);
      }
    } catch(err) {
      navigate('/login');
      console.log(err);
    }
  }, [logout, navigate])

  useEffect(() => {
      if(!token.current) {
        fetchToken();
    }
  }, [fetchToken])

  useEffect(() => {
    if(isAuthenticated) {
      socket.current = io(`${import.meta.env.VITE_API_URL}`)
      socket.current.on("connect", () => {
        console.log("Connected:", socket.current.id);
      });
    }
    return () => socket.current && socket.current.disconnect()
  }, [isAuthenticated])


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const request = await fetch(`${import.meta.env.VITE_API_URL}/users/user`, {
          headers: {
            'Authorization': `Bearer ${token.current}`
          }
        })
        const response = await request.json();
        console.log(response);
        setUser(response.user);
        setFetched(true)
      } catch(err) {
        console.log(err)
        setFetched(false)
      }
    }
    if(!isFetched && isAuthenticated) {
      if(!user) {
        fetchUser();
      }
    }
  }, [isFetched, user, isAuthenticated])


  return (
    <AuthContext.Provider value={{token, user, setUser, setAuthentication, socket, timeoutRef, fetchToken, logout}}>
        <Routes>
            <Route path="/" element={<Messenger />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
        </Routes>
    </AuthContext.Provider>
  )
}

export default App
