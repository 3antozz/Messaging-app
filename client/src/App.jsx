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
  const [socketOn, setSocket] = useState(false)
  const navigate = useNavigate();
  const logout = useCallback(async() => {
    console.log('logout called!')
    try {
      const request = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      const response = await request.json();
      console.log(response);
    } catch(err) {
      console.log(err)
    } finally {
      token.current = null;
      setUser(null)
      setFetched(false)
      setAuthentication(false);
      navigate('/login')
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
      console.log('refresh error');
      setAuthentication(prev => {
        if(prev) {
          logout();
        }
        return false;
      })
      console.log(err);
    }
  }, [logout])

  useEffect(() => {
      if(!token.current) {
        fetchToken();
    }
  }, [fetchToken])

  useEffect(() => {
    if(user && isAuthenticated) {
      socket.current = io(`${import.meta.env.VITE_API_URL}`, {
        query: {
          userId: user.id
        }
      });
      socket.current.on("connect", () => {
        console.log("Connected:", socket.current.id);
      });
      setSocket(true)
    }
    return () => socket.current && socket.current.disconnect()
  }, [isAuthenticated, user])


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
  }, [isFetched, user, isAuthenticated, token])


  return (
    <AuthContext.Provider value={{token, user, setUser, setAuthentication, socketOn, socket, timeoutRef, fetchToken, logout}}>
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
