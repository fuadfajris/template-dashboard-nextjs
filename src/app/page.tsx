"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleLogin = async () => {
    setEmailError("")
    setPasswordError("")
    setIsLoading(true);

    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    // if (error || !data) {
    //   setIsLoading(false);
    //   alert("Login gagal: email atau password salah");
    //   return;
    // }

    if (error || !data) {
      if (!email) {
        setEmailError("Email tidak boleh kosong")
      } else if (!email.includes("@")) {
        setEmailError("Format email tidak valid")
      } else {
        setEmailError("Email atau password salah")
      }

      if (!password) {
        setPasswordError("Password tidak boleh kosong")
      } else {
        setPasswordError("Email atau password salah")
      }

      setIsLoading(false)
      return
    }


    login({
      id: data.id,
      name: data.name,
      logo: data.logo ?? "/default-logo.png",
      email: data.email,
    });

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2">
        {/* Left Side - Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-800">Merchant</h2>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-sans">
              Hello,
              <br />
              Welcome Back
            </h1>
            <p className="text-gray-600 font-serif">
              Create your special event
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input
                type="email"
                placeholder="email@email.com"
                className="w-full px-4 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {emailError && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="........"
                className="w-full px-4 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {passwordError && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-purple-500 text-white py-4 rounded-lg hover:bg-purple-600 transition-colors duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </div>
        </div>

        <div className="hidden md:flex bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 p-8 md:p-12 items-center justify-center relative overflow-hidden">
          {/* Floating Geometric Shapes */}
          <div className="absolute inset-0">
            <div className="absolute top-8 left-8 w-20 h-20 bg-white/10 rounded-2xl rotate-12 animate-pulse"></div>
            <div className="absolute bottom-16 right-12 w-16 h-16 bg-white/15 rounded-full animate-bounce"></div>
            <div className="absolute top-1/3 left-4 w-12 h-12 bg-white/20 rounded-lg rotate-45"></div>
            <div className="absolute bottom-1/3 left-16 w-8 h-8 bg-white/25 rounded-full animate-pulse"></div>
            <div className="absolute top-16 right-20 w-6 h-6 bg-white/30 rounded-full"></div>
            <div className="absolute bottom-24 right-8 w-10 h-10 bg-white/15 rounded-xl rotate-12"></div>
          </div>

          {/* Main Dashboard Mockup */}
          <div className="relative z-10 text-center text-white max-w-sm">
            {/* Dashboard Preview Card */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Event Dashboard</span>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <Users className="w-4 h-4 mb-1" />
                  <div className="text-xs opacity-80">Attendees</div>
                  <div className="text-lg font-bold">2.4k</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <TrendingUp className="w-4 h-4 mb-1" />
                  <div className="text-xs opacity-80">Revenue</div>
                  <div className="text-lg font-bold">$12k</div>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-end justify-between h-8 gap-1">
                  <div
                    className="w-2 bg-white/60 rounded-t"
                    style={{ height: "20%" }}
                  ></div>
                  <div
                    className="w-2 bg-white/60 rounded-t"
                    style={{ height: "40%" }}
                  ></div>
                  <div
                    className="w-2 bg-white/80 rounded-t"
                    style={{ height: "80%" }}
                  ></div>
                  <div
                    className="w-2 bg-white/60 rounded-t"
                    style={{ height: "60%" }}
                  ></div>
                  <div
                    className="w-2 bg-white/60 rounded-t"
                    style={{ height: "30%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Real-time Analytics</div>
                  <div className="text-xs opacity-80">
                    Track your event performance
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Instant Setup</div>
                  <div className="text-xs opacity-80">
                    Launch events in minutes
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Action Indicators */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Star className="w-3 h-3 text-yellow-800" />
            </div>
          </div>

          {/* Additional Floating Elements */}
          <div className="absolute top-20 right-16 w-3 h-3 bg-white/40 rounded-full animate-ping"></div>
          <div className="absolute bottom-32 left-12 w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-4 w-2 h-2 bg-white/50 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
