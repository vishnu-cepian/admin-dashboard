'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getAccessToken, removeTokens } from '@/app/lib/auth/actions';
import api from '@/app/lib/api/axios';

export default function DashboardPage() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState("");
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalVendors: 0,
    pendingApprovals: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
 
    if (!token) {
      router.push("/admin/login");
    } else {
      setAdminEmail("admin@nexs.com"); 
      fetchStats();
    }
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/stats");
     
      setStats({
        totalCustomers: response.data.data.totalCustomers || 0,
        totalVendors: response.data.data.totalVendors || 0,
        pendingApprovals: response.data.data.totalUnverifiedVendors || 0,
        totalOrders: response.data.data.totalOrders || 0
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load statistics");
      console.error("Error fetching stats:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeTokens();
    router.push("/admin/login");
  };

  const manageVendors =()=> {
    router.push("/admin/vendors")
  }

 const manageNotifications =()=> {
    router.push("/admin/notifications")
  }
 
  const manageOrders = () => {
    router.push("/admin/orders")
  }

  const manageCustomers = () => {
    router.push("/admin/customers")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black-100 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchStats}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl text-black font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {adminEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard title="Total Customers" value={stats.totalCustomers} />
          <DashboardCard title="Total Vendors" value={stats.totalVendors} />
          <DashboardCard title="Pending Approvals" value={stats.pendingApprovals} />
          <DashboardCard title="Total Orders" value={stats.totalOrders} />
        </div>

       <section className="mt-10">
         <h2 className="text-xl text-black font-medium mb-4">Recent Activity</h2>
         <ul className="bg-white shadow rounded-md divide-y divide-gray-200">
           <li className="p-4 text-black text-sm">Vendor <strong>#1234</strong> requested verification.</li>
           <li className="p-4 text-black text-sm">Customer <strong>John Doe</strong> placed an order.</li>
           <li className="p-4 text-black text-sm">Vendor <strong>#1203</strong> uploaded shop documents.</li>
         </ul>
       </section>
        <div className="bg-grey rounded-xl shadow-md p-6">
          <p className="text-gray-700 mb-4">Welcome, <strong>{adminEmail}</strong> 👋</p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 border text-black rounded-xl text-center bg-blue-70 hover:bg-blue-100 cursor-pointer" onClick = {manageCustomers}>
              Manage Customers
            </div>
            <div className="p-4 border text-black rounded-xl text-center bg-green-50 hover:bg-green-100 cursor-pointer" onClick={manageVendors}>
              Manage Vendors
            </div>
            <div className="p-4 border text-black rounded-xl text-center bg-green-50 hover:bg-green-100 cursor-pointer" onClick={manageNotifications}>
              Notifications
            </div>
            <div className="p-4 border text-black rounded-xl text-center bg-yellow-50 hover:bg-yellow-100 cursor-pointer" onClick={manageOrders}>
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

function DashboardCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="text-gray-500 text-black text-sm">{title}</div>
      <div className="text-2xl text-black font-bold mt-2">{value}</div>
    </div>
  );
}