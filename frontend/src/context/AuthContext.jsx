import { createContext, useContext, useEffect, useState } from "react";

import axiosInstance from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const token = localStorage.getItem("token");

        const loadUser = async () => {

            if (!token) {

                setLoading(false);
                return;
            }

            try {

                const response = await axiosInstance.get("/auth/me");

                setUser({
                    token,
                    profile: response.data.user,
                });

            } catch (error) {

                localStorage.removeItem("token");
                setUser(null);

            } finally {

                setLoading(false);
            }
        };

        loadUser();

    }, []);

    const login = async (token) => {

        localStorage.setItem("token", token);

        try {

            const response = await axiosInstance.get("/auth/me");

            setUser({
                token,
                profile: response.data.user,
            });

        } catch (error) {

            setUser({ token });
        }
    };

    const logout = () => {

        localStorage.removeItem("token");

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);