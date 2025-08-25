'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { getAccessToken, removeTokens } from '@/app/lib/auth/actions';
import api from '@/app/lib/api/axios';
import { 
  Users, 
  Store, 
  Clock, 
  ShoppingCart, 
  LogOut, 
  Settings, 
  Bell, 
  BarChart3,
  UserCheck,
  TrendingUp,
  Shield
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState("");
  const [lastLoginTime, setLastLoginTime] = useState("");
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalVendors: 0,
    pendingApprovals: 0,
    totalOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wrap fetchStats in useCallback to prevent unnecessary recreations
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/stats");
     
      const loginResponse = await api.get("/api/admin/loginHistory",
        {
          params: {
            page: 2,
            limit: 1
          }
        }
      )
    
      setLastLoginTime(new Date(loginResponse.data.data.loginHistory[0]?.loginTime).toLocaleString() || "N/A");
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
  }, []);

  const handleLogout = async () => {
    await api.patch("/api/admin/logout").catch((err) => {
      console.error("Error logging out:", err);
    });
    removeTokens();
    router.push("/admin/login");
  };

  const manageVendors = () => {
    router.push("/admin/vendors")
  }

  const manageNotifications = () => {
    router.push("/admin/notifications")
  }
 
  const manageOrders = () => {
    router.push("/admin/orders")
  }

  const manageCustomers = () => {
    router.push("/admin/customers")
  }

  const manageSettings = () => {
    router.push("/admin/settings")
  }

  const manageReports = () => {
    router.push("/admin/reports")
  }
  useEffect(() => {
    const token = getAccessToken();
 
    if (!token) {
      router.push("/admin/login");
    } else {
      setAdminEmail("admin@nexs.com"); 
      fetchStats();
    }
  }, [router, fetchStats]); // Added dependencies

  const quickActions = [
    {
      title: "Manage Customers",
      icon: <Users className="w-6 h-6" />,
      onClick: manageCustomers,
      color: "bg-blue-500/10 hover:bg-blue-500/20",
      iconColor: "text-blue-600"
    },
    {
      title: "Manage Vendors",
      icon: <Store className="w-6 h-6" />,
      onClick: manageVendors,
      color: "bg-green-500/10 hover:bg-green-500/20",
      iconColor: "text-green-600"
    },
    {
      title: "Notifications",
      icon: <Bell className="w-6 h-6" />,
      onClick: manageNotifications,
      color: "bg-purple-500/10 hover:bg-purple-500/20",
      iconColor: "text-purple-600"
    },
    {
      title: "Orders",
      icon: <ShoppingCart className="w-6 h-6" />,
      onClick: manageOrders,
      color: "bg-yellow-500/10 hover:bg-yellow-500/20",
      iconColor: "text-yellow-600"
    },
    {
      title: "Reports",
      icon: <BarChart3 className="w-6 h-6" />,
      onClick: manageReports,
      color: "bg-indigo-500/10 hover:bg-indigo-500/20",
      iconColor: "text-indigo-600"
    },
    {
      title: "Settings",
      icon: <Settings className="w-6 h-6" />,
      onClick: manageSettings,
      color: "bg-gray-500/10 hover:bg-gray-500/20",
      iconColor: "text-gray-600"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4">
          <div className="text-red-500 mb-4 text-center font-medium">{error}</div>
          <button
            onClick={fetchStats}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 p-6 bg-white rounded-2xl shadow-sm">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Welcome back, <span className="font-semibold text-blue-600">{adminEmail}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard 
            title="Total Customers" 
            value={stats.totalCustomers} 
            icon={<Users className="w-5 h-5" />}
            // trend="+12%"
            color="blue"
          />
          <DashboardCard 
            title="Total Vendors" 
            value={stats.totalVendors} 
            icon={<Store className="w-5 h-5" />}
            // trend="+8%"
            color="green"
          />
          <DashboardCard 
            title="Pending Approvals" 
            value={stats.pendingApprovals} 
            icon={<Clock className="w-5 h-5" />}
            trend={stats.pendingApprovals > 0 ? "Attention needed" : "All clear"}
            color="amber"
          />
          <DashboardCard 
            title="Total Orders" 
            value={stats.totalOrders} 
            icon={<ShoppingCart className="w-5 h-5" />}
            // trend="+23%"
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`p-4 rounded-xl border border-gray-200 transition-all duration-200 hover:scale-105 hover:shadow-md ${action.color}`}
              >
                <div className={`p-2 rounded-lg inline-block mb-3 ${action.iconColor}`}>
                  {action.icon}
                </div>
                <p className="text-sm font-medium text-gray-800">{action.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Welcome to Nexs Admin Panel</h2>
            <p className="text-blue-100 mb-6">
              Manage your platform efficiently with real-time insights and powerful tools. 
              Everything you need to oversee customers, vendors, and orders is right here.
            </p>
            <div className="flex items-center gap-4">
              <UserCheck className="w-5 h-5" />
              <span className="text-sm">Last login: {lastLoginTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon, trend, color }) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    amber: 'bg-amber-500/10 text-amber-600',
    purple: 'bg-purple-500/10 text-purple-600'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          color === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {trend}
        </span>
      </div>
      <div className="text-gray-500 text-sm font-medium mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</div>
    </div>
  );
}