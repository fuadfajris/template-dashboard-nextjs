"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login } = useUser();

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      alert("Login gagal: email atau password salah");
      return;
    }

    login({
      id: data.id,
      name: data.name,
      logo: data.logo_url ?? "/default-logo.png",
      email: data.email,
    });

    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-4xl flex">
        <div className="w-1/2 p-8 flex justify-center items-center">
          <div className="max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
            <p className="text-sm text-gray-600 mb-6">
              Manage your store, track orders, and grow your business.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  EMAIL
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-[#7c6650] text-white py-2 rounded-md hover:bg-[#6b5844] transition"
              >
                Login
              </button>
            </div>
          </div>
        </div>

        <div className="w-1/2 hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?ixlib=rb-0.3.5&auto=format&fit=crop&w=1000&q=80"
            alt="Login"
            className="object-cover w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
