"use client";
import React, { useState, useEffect } from "react";
import { Building2, GraduationCap, School, ArrowRight, Mail, Lock, User, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  
  // --- STATE ---
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "",
    state: "Punjab",
    collegeId: "" 
  });

  // Indian States & Union Territories
  const indianStates = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
    "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli",
    "Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal"
  ].sort();

  // Password Change State (For Students)
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // --- 1. LOGIC: HIDE STUDENT TAB ON REGISTER ---
  // If user toggles to Register mode, and they are currently on "student", 
  // switch them to "company" automatically.
  useEffect(() => {
    if (!isLogin && role === "student") {
        setRole("company");
    }
  }, [isLogin, role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordUpdate = async () => {
     try {
        await api.put("/api/auth/change-password", {
            newPassword: newPassword
        });
        alert("Password updated! Please login with your new password.");
        setShowChangePassword(false);
        setNewPassword(""); 
        setIsLogin(true);   
     } catch(err) {
        alert("Error updating password");
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = isLogin 
      ? "/api/auth/login" 
      : "/api/auth/register";

    try {
      const { data } = await api.post(url, { ...formData, role });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      
      // CHECK FOR FIRST TIME LOGIN (Student Only)
      if(data.isFirstLogin) {
         alert("Welcome! Since this is your first login, please set a new password.");
         setShowChangePassword(true);
         setLoading(false);
         return; 
      }

      alert(isLogin ? "Login Successful!" : "Registration Successful!");

      if (role === 'student') router.push('/student/dashboard');
      else if (role === 'company') router.push('/company/dashboard');
      else if (role === 'college') router.push('/college/dashboard');
      else if (role === 'college_member') router.push('/college/dashboard'); // Staff Login

    } catch (error: any) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 text-white flex-col justify-center px-12 relative overflow-hidden">
         <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-6 leading-tight">Unified Placement <br/>Orchestration Platform</h1>
          <p className="text-xl text-blue-200 mb-8">Bridging the gap between Campus Talent and Top Recruiters.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">{isLogin ? "Welcome Back" : "Partner With Us"}</h2>
            <p className="text-gray-500 mt-2">
                {isLogin ? "Please enter your details to access the portal." : "Register your Company or College to get started."}
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { id: "student", label: "Student", icon: GraduationCap },
              { id: "company", label: "Company", icon: Building2 },
              { id: "college", label: "College", icon: School },
            ]
            // FILTER: Remove "Student" if we are in Register Mode (!isLogin)
            .filter(item => isLogin || item.id !== 'student')
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  role === item.id
                    ? "bg-blue-50 border-blue-500 text-blue-600 ring-2 ring-blue-200"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                } ${!isLogin && "col-span-1.5"} `} // Adjust width when only 2 items exist
              >
                <item.icon size={24} className="mb-2" />
                <span className="text-xs font-semibold">{item.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Registration Name Field */}
            {!isLogin && (
              <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input type="text" name="name" placeholder={role === 'company' ? "Company Name" : "College Name"} className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" onChange={handleChange} />
              </div>
            )}

            {/* State Field - Only for College Registration */}
            {!isLogin && role === "college" && (
              <div className="relative">
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                >
                  {indianStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={20} />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input type="email" name="email" placeholder="Email Address" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" onChange={handleChange} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input type="password" name="password" placeholder="Password" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" onChange={handleChange} />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              {loading ? "Processing..." : (isLogin ? "Sign In" : "Register Now")} <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "New here?" : "Have an account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-semibold hover:underline">
                {isLogin ? "Register Partner" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl max-w-sm w-full animate-in fade-in zoom-in">
                <h2 className="text-xl font-bold mb-2 text-gray-800">Set New Password</h2>
                <p className="text-gray-500 text-sm mb-4">Your account was created by your college. Please set a secure password to continue.</p>
                
                <input 
                    type="password" 
                    placeholder="Enter New Password" 
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setNewPassword(e.target.value)}
                    value={newPassword}
                />
                
                <button 
                    onClick={handlePasswordUpdate}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Update & Login
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
