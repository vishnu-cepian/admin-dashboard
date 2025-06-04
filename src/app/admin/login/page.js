"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { configDotenv } from "dotenv";
import { setTokens } from "@/app/lib/auth/actions";

export default function LoginPage() {
  configDotenv();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
        // const res = await api.post("/login", {
        //     email: email,
        //     password: password
        // });

        const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }
      // Save token in localStorage (or secure cookie)
      setTokens(data.data.accessToken, data.data.refreshToken)

      // Redirect to dashboard
      router.push("/admin/dashboard");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

 return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Portal</h1>
        <p className="text-gray-500">Enter your credentials to continue</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <input
              id="email"
              type="email"
              className="w-full text-black border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            type="password"
            className="w-full border text-black border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Authenticating...
            </>
          ) : 'Login'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Forgot password?</a>
      </div>
    </div>
  </div>
);
}
