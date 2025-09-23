import React, { useState } from "react";
import { Eye, EyeOff, Home, Mail, Lock } from "lucide-react";
import api from '../../api';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

export default function Login({ onLogin, onGoToSignup }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {

    setError("");
    if (!identifier || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { identifier, password });
      const data = res.data;

      // Save minimal user data for greeting
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("userEmail", data?.user?.email || identifier);
      localStorage.setItem("userName", data?.user?.name || identifier.split("@")[0]);
      localStorage.setItem("token", data?.token || "");
      // Preserve previously selected role
      const savedRole = localStorage.getItem("role");
      if (!savedRole && data?.user?.role) {
        localStorage.setItem("role", data.user.role);
      }
      onLogin();
    } catch (err) {
      // Handle phone verification requirement specifically
      const message = err?.response?.data?.message || err.message || 'Login failed';
      if (message.includes('Please verify your phone number')) {
        setError("Please verify your phone number with OTP before logging in. Check your phone for the verification code.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => {
    onGoToSignup();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-yellow-100 mb-4">
            <Home className="h-10 w-10 text-yellow-500" />
          </div>
          <h2 className="text-4xl font-extrabold"><span className="text-black">Renti</span><span className="text-yellow-500">fy</span></h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
          {error && (
            <div className="mt-3 text-sm text-red-600">{error}</div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or Phone"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full px-4 py-3 text-base font-semibold rounded-xl text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-center">
            <span className="text-gray-600">Don't have an account? </span>
            <button
              onClick={goToSignup}
              className="font-semibold text-yellow-600 hover:text-yellow-500 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}