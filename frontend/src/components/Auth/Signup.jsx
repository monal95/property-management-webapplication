import React, { useState } from "react";
import { Eye, EyeOff, UserPlus, User, Mail, Lock, Home, Phone } from "lucide-react";
import api from '../../api';

const EMAIL_POLICY =/^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const PASSWORD_POLICY = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

export default function Signup({ onSignup, onGoToLogin }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleSignup = async () => {
    setError("");
    setSuccess("");

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (!EMAIL_POLICY.test(email)) {
      setError("Email must be letters followed by @gmail.com");
      return;
    }
    if (!PASSWORD_POLICY.test(password)) {
      setError("Password needs 1 uppercase, 1 number, 1 special char, 6+ chars");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const role = localStorage.getItem("role") || "tenant";

    setLoading(true);
    try {
      const res = await api.post("/auth/register", { firstName, lastName, email, phone, password, role });
      const data = res.data || {};
      setSuccess("Account created! Please verify your phone number with OTP.");
      setUserId(data.user?.id);
      setShowOTPVerification(true);
      setLoading(false);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Signup failed';
      setError(message);
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    setVerifyingOTP(true);

    // In development only: fetch server OTP so developers can inspect it
    if (import.meta.env.DEV) {
      try {
        console.log("Fetching OTP for phone:", phone);
        const otp_res = await api.get("/auth/get-otp", { params: { phone } });
        const data_otp = otp_res.data || {};
        const serverOtp = data_otp.otp;
        console.log("OTP Response:", data_otp);
        if (serverOtp) {
          console.log("Dev OTP for phone", phone, "is:", serverOtp);
        } else {
          console.log("No OTP found in response");
        }
      } catch (err) {
        console.error("Error fetching dev OTP:", err.message);
        console.error("Full error:", err);
        window.alert("Error fetching OTP: " + (err.message || "Unknown error"));
      }
    }

    // Validate the OTP entered by the user (state `otp`)
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setVerifyingOTP(false);
      return;
    }

    try {
      const res = await api.post("/auth/verify-phone", { phone, otp });
      const data = res.data;
      if (res.status !== 200) {
        throw new Error(data.message || "OTP verification failed");
      }

      setSuccess("Phone verified successfully! Redirecting to login...");
      setTimeout(() => {
        onGoToLogin();
      }, 2000);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'OTP verification failed';
      setError(message);
    } finally {
      setVerifyingOTP(false);
    }
  };
  const handleResendOTP = async () => {
    setError("");
    try {
      const res = await api.post("/auth/resend-otp", { phone });
      const data = res.data;
      if (res.status !== 200) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setSuccess("New OTP sent! Check your phone.");
      setOtp("");
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Failed to resend OTP';
      setError(message);
    }
  };

  const goToLogin = () => {
    onGoToLogin();
  };

  if (showOTPVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-yellow-100 mb-4">
              <Phone className="h-10 w-10 text-yellow-500" />
            </div>
            <h2 className="text-4xl font-extrabold"><span className="text-black">Renti</span><span className="text-yellow-500">fy</span></h2>
            <p className="mt-2 text-gray-600">Verify your phone number</p>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
            {success && <div className="mt-3 text-sm text-green-600">{success}</div>}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                We've sent a 6-digit OTP to or try <b>123456</b> for Dev <span className="font-semibold">{phone}</span>
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                  maxLength={6}
                />
              </div>
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={verifyingOTP || !otp || otp.length !== 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {verifyingOTP ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="text-center">
              <button
                onClick={handleResendOTP}
                className="text-sm text-yellow-600 hover:text-yellow-500 transition-colors duration-200"
              >
                Didn't receive OTP? Resend
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowOTPVerification(false)}
                className="text-sm text-gray-600 hover:text-gray-500 transition-colors duration-200"
              >
                ← Back to signup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-yellow-100 mb-4">
            <Home className="h-10 w-10 text-yellow-500" />
          </div>
          <h2 className="text-4xl font-extrabold"><span className="text-black">Renti</span><span className="text-yellow-500">fy</span></h2>
          <p className="mt-2 text-gray-600">Create your account</p>
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          {success && <div className="mt-3 text-sm text-green-600">{success}</div>}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (e.g., example123@gmail.com)"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number (e.g., +919876543210)"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={goToLogin}
                className="font-medium text-black hover:text-gray-700 transition-colors duration-200"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}