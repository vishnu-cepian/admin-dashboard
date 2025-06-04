"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from '@/app/lib/api/axios'
import { removeTokens } from "@/app/lib/auth/actions";

export default function DashboardPage() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
 
    // if (!token) {
    //   router.push("/login");
    // } else {
    //   // In real case, decode token or fetch admin data
    //   // setAdminEmail(decodedToken.email);
    //   setAdminEmail("admin@example.com"); // Placeholder
    // }
  }, []);
const manageUser = async() => {
        const res = await api.get("/api/admin/test");
        console.log(res);
}
  const handleLogout = () => {
    removeTokens();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-black font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </header>

        <div className="bg-grey rounded-xl shadow-md p-6">
          <p className="text-gray-700 mb-4">Welcome, <strong>{adminEmail}</strong> 👋</p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 border text-black rounded-xl text-center bg-blue-70 hover:bg-blue-100 cursor-pointer" onClick={manageUser}>
              Manage Users
            </div>
            <div className="p-4 border text-black rounded-xl text-center bg-green-50 hover:bg-green-100 cursor-pointer">
              Manage Vendors
            </div>
            <div className="p-4 border text-black rounded-xl text-center bg-yellow-50 hover:bg-yellow-100 cursor-pointer">
              Orders
            </div>
            <div className="p-4 border text-black rounded-xl text-center bg-purple-50 hover:bg-purple-100 cursor-pointer">
              Reports
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
