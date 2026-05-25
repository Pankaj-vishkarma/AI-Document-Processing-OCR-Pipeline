import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import axiosInstance from "../api/axios";

import { useAuth } from "../context/AuthContext";

import { useEffect } from "react";

const Login = () => {

    const navigate = useNavigate();

    const { login, user } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    useEffect(() => {

        if (user) {

            navigate("/");
        }

    }, [user, navigate]);

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);

            const response = await axiosInstance.post("/auth/login", formData);

            const token = response.data.token;

            login(token);

            toast.success("Login successful");

            navigate("/");

        } catch (error) {

            toast.error(
                error?.response?.data?.message || "Login failed"
            );

        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">

            <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-2xl">

                <div className="mb-8 text-center">

                    <h1 className="text-4xl font-bold mb-3">
                        AI Document Processing
                    </h1>

                    <p className="text-gray-400">
                        Login to continue
                    </p>

                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>

                        <label className="block mb-2 text-sm text-gray-300">
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            placeholder="Enter email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition"
                        />

                    </div>

                    <div>

                        <label className="block mb-2 text-sm text-gray-300">
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white transition"
                        />

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:opacity-90 transition"
                    >
                        {loading ? "Please wait..." : "Login"}
                    </button>

                </form>

                <p className="text-center text-gray-400 mt-6">

                    Don't have an account?{" "}

                    <Link
                        to="/register"
                        className="text-white font-medium"
                    >
                        Register
                    </Link>

                </p>

            </div>

        </div>
    );
};

export default Login;