import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { Routes, Route, useNavigate } from "react-router";
import AuthLayout from './components/auth/layout.jsx';
import Login from './components/auth/login.jsx';
import Register from './components/auth/register.jsx';
import Messenger from './components/Messenger/Messenger.jsx';
import ErrorPage from './components/error/Error.jsx'
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
    try {
      const request = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      if(!request.ok) {
        const error = new Error('An error has occured, please try again later')
        throw error;
      }
    // eslint-disable-next-line no-unused-vars
    } catch(err) {
      navigate('/login')
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
        timeoutRef.current = setTimeout(fetchToken,  1000 * 60 * 14); // 14 minutes
      }
    // eslint-disable-next-line no-unused-vars
    } catch(err) {
      setAuthentication(prev => {
        if(prev) {
          logout();
        }
        return false;
      })
    }
  }, [logout])

  useEffect(() => {
      if(!token.current) {
        fetchToken();
    }
  }, [fetchToken])

  useEffect(() => {
    if(user && isAuthenticated && !socketOn) {
      socket.current = io(`${import.meta.env.VITE_API_URL}`, {
        query: {
          userId: user.id
        }
      });
      setSocket(true)
    }
    return () => socket.current && socket.current.disconnect()
  }, [isAuthenticated, socketOn, user])


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const request = await fetch(`${import.meta.env.VITE_API_URL}/users/user`, {
          headers: {
            'Authorization': `Bearer ${token.current}`
          }
        })
        if(!request.ok) {
          const error = new Error('An error has occured, please try again later')
          throw error;
        }
        const response = await request.json();
        setUser(response.user);
        setFetched(true)
      // eslint-disable-next-line no-unused-vars
      } catch(err) {
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
            <Route path="*" element={<ErrorPage />} />
        </Routes>
    </AuthContext.Provider>
  )
}

export default App
