import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";

const passwordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "transparent", pct: "0%" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#EF4444", pct: "25%" };
  if (score <= 2) return { score, label: "Fair", color: "#F59E0B", pct: "50%" };
  if (score <= 3) return { score, label: "Good", color: "#FBBF24", pct: "75%" };
  return { score, label: "Strong", color: "#10B981", pct: "100%" };
};

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/");
  }, [navigate]);

  const validateField = useCallback((name, value) => {
    let error = "";

    if (name === "username") {
      if (!value) error = "Username is required";
      else if (value.includes(" ")) error = "Username cannot contain spaces";
      else if (value.length < 3 || value.length > 30) error = "Username must be 3-30 characters";
      else if (!/[a-zA-Z]/.test(value)) error = "Username must contain at least one letter";
      else if (/^\d+$/.test(value)) error = "Username cannot be only numbers";
      else if (/^(.+)\1+$/.test(value)) error = "Username cannot be repetitive";
      else if (["qwerty", "asdf", "zxcvbn", "password", "admin", "123456", "111111", "root"].includes(value.toLowerCase())) error = "Username is too common";
    } else if (name === "email") {
      if (!value) error = "Email is required";
      else if (value.trim() !== value) error = "Email cannot have leading/trailing spaces";
      else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) error = "Please enter a valid email";
    } else if (name === "password") {
      if (!value) error = "Password is required";
      else if (value.includes(" ")) error = "Password cannot contain spaces";
      else if (value.length < 8 || value.length > 64) error = "Password must be 8-64 characters";
      else if (!/[A-Z]/.test(value)) error = "Password must have uppercase letter";
      else if (!/[a-z]/.test(value)) error = "Password must have lowercase letter";
      else if (!/\d/.test(value)) error = "Password must have at least one number";
      else if (!/[^A-Za-z0-9]/.test(value)) error = "Password must have special character";
    } else if (name === "confirmPassword") {
      if (value.trim() !== value) error = "Cannot have leading/trailing spaces";
      else if (value !== formData.password) error = "Passwords do not match";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  }, [formData.password]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    const nextValue = name === "username" || name === "email" ? value.trim() : value;

    if (name === "confirmPassword") {
      setConfirmPassword(nextValue);
      setConfirmPasswordError(nextValue === formData.password ? "" : "Passwords do not match");
    } else {
      setFormData((prev) => ({ ...prev, [name]: nextValue }));
      if (nextValue) {
        validateField(name, nextValue);
      }
    }
  }, [formData.password, validateField]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== confirmPassword || confirmPasswordError) {
      toast.error("Passwords do not match");
      return;
    }

    const validUsername = validateField("username", formData.username);
    const validEmail = validateField("email", formData.email);
    const validPassword = validateField("password", formData.password);

    if (!validUsername || !validEmail || !validPassword) {
      toast.error("Please fix validation errors");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post("/auth/register", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword,
      });
      toast.success("Registration successful");
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(formData.password);
  const isFormValid =
    formData.username &&
    formData.email &&
    formData.password &&
    confirmPassword &&
    !errors.username &&
    !errors.email &&
    !errors.password &&
    !confirmPasswordError &&
    formData.password === confirmPassword;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-xl border border-slate-200 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden flex-col gap-10 bg-slate-950 p-10 text-slate-50 lg:flex">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
              Join DocIntel
            </span>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">
                Start processing documents faster with AI.
              </h2>
              <p className="max-w-lg text-sm text-slate-300 leading-7">
                Create your account and enjoy the same dashboard styling across login, export, review, and preprocessing pages.
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
            <p className="text-sm uppercase tracking-[0.25em] text-sky-200">Get started</p>
            <p className="mt-4 text-3xl font-semibold text-white">Secure onboarding for teams.</p>
          </div>
        </div>

        <div className="w-full p-8 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
                Create account
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                Register for access
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Join the AI document processing platform with a consistent responsive dashboard UI.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Username</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="john_doe"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />
                {errors.username && <p className="text-sm text-rose-600">{errors.username}</p>}
              </div>

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
                {errors.email && <p className="text-sm text-rose-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <label htmlFor="password">Password</label>
                  {formData.password && (
                    <span className="text-sm font-medium" style={{ color: strength.color }}>{strength.label}</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter a strong password"
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
                {errors.password && <p className="text-sm text-rose-600">{errors.password}</p>}
                <div className="mt-3 rounded-full bg-slate-100 p-2">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full" style={{ width: strength.pct, backgroundColor: strength.color }} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Confirm password</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Re-enter your password"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 pr-12 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {(confirmPasswordError || (confirmPassword && formData.password !== confirmPassword)) && (
                  <p className="text-sm text-rose-600">{confirmPasswordError || "Passwords do not match"}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="flex w-full items-center justify-center gap-3 rounded-3xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link className="font-semibold text-sky-600 hover:text-sky-700" to="/login">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
