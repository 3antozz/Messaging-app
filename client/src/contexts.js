import { createContext } from "react";
export const AuthContext = createContext({
    token: "",
    setToken: () => {},
    user: {},
    setUser: () => {},
    logout: () => {}
})

export const ConversationContext = createContext({
})