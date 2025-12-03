import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import emailjs from "emailjs-com";

const LOGIN_URL = "http://localhost:3001/api/auth/login";
const REGISTER_URL = "http://localhost:3001/api/users";

export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth();

  if (!auth) return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;

  const { user, login, authLoading } = auth;
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (user) navigate(user.role === "admin" ? "/admin/dashboard" : "/select-table", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const passwordValid = /(?=.*[0-9])/.test(password) && /(?=.*[!@#$%^&*])/.test(password) && password.length >= 6;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid = mode === "login" || (name.length >= 3);
  const phoneValid = mode === "login" || (/^[6-9]\d{9}$/.test(phone));

  const canSendOtp = emailValid && passwordValid && nameValid && phoneValid;

  // Send OTP using EmailJS
  const sendOtp = async () => {
    if (!canSendOtp) {
      setOtpError("Please fill all fields correctly first");
      return;
    }

    setOtpLoading(true);
    setOtpError("");
    setError("");

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otpCode);

    const templateParams = {
      to_email: email,
      otp: otpCode,
      user_name: name || email.split('@')[0],
    };

    try {
      await emailjs.send(
        "service_s5xto0c",   // Replace with your EmailJS service ID
        "template_2b544ag",  // Replace with your EmailJS template ID
        templateParams,
        "2dMMEjr3SLbvzQvtK"    // Replace with your EmailJS public key
      );
      setOtpSent(true);
      setResendTimer(60); // 60 seconds timer
    } catch (err) {
      console.error(err);
      setOtpError("Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and proceed with login/registration
  const verifyOtpAndProceed = async () => {
    if (otp !== generatedOtp) {
      setOtpError("Invalid OTP. Please try again.");
      return;
    }

    // OTP is correct, proceed
    setOtpError("");
    setLoading(true);

    if (mode === "login") {
      await loginUser();
    } else {
      await registerUser();
    }
  };

  // Login user
  const loginUser = async () => {
    setError("");
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (data.data.role === "admin") {
          setError("Please use the admin login page");
          setLoading(false);
          return;
        }
        login(data.data);
        navigate("/profile", { replace: true });
      } else {
        setError(data.message || "Login failed");
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Register user
  const registerUser = async () => {
    setError("");
    try {
      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role: "customer" }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
        setLoading(false);
        // Reset form and switch to login
        setOtpSent(false);
        setOtp("");
        setGeneratedOtp("");
        setName("");
        setPhone("");
        setPassword("");
        setMode("login");
      } else {
        setError(data.message || "Registration failed");
        setLoading(false);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setSuccess(false);
    setOtpSent(false);
    setOtp("");
    setGeneratedOtp("");
    setOtpError("");
  };

  const changeDetails = () => {
    setOtpSent(false);
    setOtp("");
    setGeneratedOtp("");
    setOtpError("");
  };

  if (authLoading) return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  if (user) return null;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">{mode === "login" ? "Login" : "Register"}</h1>

      {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">Registration successful! Please login.</div>}

      <div className="space-y-4">

        {mode === "register" && (
          <>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[a-zA-Z\s]*$/.test(val)) setName(val);
                }}
                disabled={loading || otpSent}
                className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 ${
                  name && name.length < 3 ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your full name"
              />
              {name && name.length < 3 && (
                <p className="text-red-500 text-sm mt-1">Name must be at least 3 characters</p>
              )}
            </div>

            <div>
              <label className="block mb-1 font-semibold text-gray-700">Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => { if (/^\d*$/.test(e.target.value)) setPhone(e.target.value); }}
                disabled={loading || otpSent}
                className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 ${
                  phone && phone.length !== 10 ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter 10-digit phone number"
              />
              {phone && phone.length !== 10 && (
                <p className="text-red-500 text-sm mt-1">Phone number must be 10 digits</p>
              )}
              {phone && !/^[6-9]\d{9}$/.test(phone) && (
                <p className="text-red-500 text-sm mt-1">Phone number must start with 6-9</p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block mb-1 font-semibold text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || otpSent}
            className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 ${
              email && !emailValid ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your email"
          />
          {email && !emailValid && (
            <p className="text-red-500 text-sm mt-1">Enter a valid email address</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-semibold text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading || otpSent}
              className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 ${
                password && !passwordValid ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Strong password"
            />
            {password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            )}
          </div>
          {password && password.length < 6 && <p className="text-red-500 text-sm mt-1">Password must be at least 6 characters</p>}
          {password && !/(?=.*[0-9])/.test(password) && <p className="text-red-500 text-sm mt-1">Password must contain a number</p>}
          {password && !/(?=.*[!@#$%^&*])/.test(password) && <p className="text-red-500 text-sm mt-1">Password must contain a special character (!@#$%^&*)</p>}
        </div>

        {otpSent ? (
          <div className="space-y-3">
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 6) setOtp(val);
                }}
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400 border-gray-300"
                placeholder="Enter 6-digit OTP sent to your email"
                maxLength={6}
              />
              {otpError && <p className="text-red-500 text-sm mt-1">{otpError}</p>}
            </div>
            
            <button
              type="button"
              onClick={verifyOtpAndProceed}
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded font-semibold"
            >
              {loading ? "Processing..." : `Verify OTP & ${mode === "login" ? "Login" : "Register"}`}
            </button>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={sendOtp}
                disabled={otpLoading || resendTimer > 0}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 font-medium"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
              </button>
              <button
                type="button"
                onClick={changeDetails}
                disabled={loading}
                className="text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 font-medium"
              >
                Change Details
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={sendOtp}
            disabled={!canSendOtp || otpLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded font-semibold"
          >
            {otpLoading ? "Sending OTP..." : "Send OTP to Email"}
          </button>
        )}

      </div>

      <p className="mt-4 text-center text-gray-600">
        {mode === "login" ? (
          <>New user? <button onClick={switchMode} className="text-blue-600 hover:underline font-semibold" disabled={loading || otpSent}>Register here</button></>
        ) : (
          <>Already have an account? <button onClick={switchMode} className="text-blue-600 hover:underline font-semibold" disabled={loading || otpSent}>Login here</button></>
        )}
      </p>
    </div>
  );
}