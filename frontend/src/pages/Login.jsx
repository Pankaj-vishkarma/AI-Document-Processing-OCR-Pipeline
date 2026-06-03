import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";

const featureItems = [
  "Smart OCR",
  "AI classification",
  "Multi-page PDF support",
  "Table detection",
  "Live extraction previews",
];

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleChange = useCallback((event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await axiosInstance.post("/auth/login", formData);
      login(response.data.token);
      toast.success("Login successful");
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-xl border border-slate-200 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden flex-col gap-10 bg-slate-950 p-10 text-slate-50 lg:flex">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
              Document AI Dashboard
            </span>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">
                A polished document experience,
                <span className="text-sky-400"> built to match the dashboard.</span>
              </h2>
              <p className="max-w-lg text-sm text-slate-300 leading-7">
                Sign in to access document previews, preprocessing controls, export workflows, and review tools with consistent responsive design.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {featureItems.map((feature) => (
              <div key={feature} className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-5 py-4">
                <p className="text-sm text-slate-200">{feature}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-800/70 bg-slate-900/80 px-6 py-5">
            <p className="text-sm uppercase tracking-[0.25em] text-sky-200">Trusted by teams</p>
            <p className="mt-4 text-3xl font-semibold text-white">Secure. Fast. Responsive.</p>
          </div>
        </div>

        <div className="w-full p-8 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
                Welcome back
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                Sign in to your account
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Continue to the document processing workspace with the same polished dashboard experience.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Email address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <label htmlFor="password">Password</label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 pr-12 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-3xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link className="font-semibold text-sky-600 hover:text-sky-700" to="/register">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
