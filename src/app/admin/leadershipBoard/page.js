'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronDown, Trophy, Crown, Star, Award, Store } from 'lucide-react';
import api from '@/app/lib/api/axios';

export default function LeaderboardPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get current month-year in YYYY-MM format
  function getCurrentMonthYear() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, selectedMonth]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = timeframe === 'daily' 
        ? { timeframe: 'daily' } 
        : { timeframe: 'monthly', monthYear: selectedMonth };
      
      const response = await api.get('/api/admin/getLeadershipBoard', { params });
      setLeaderboardData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
    if (rank === 2) return <Award className="w-6 h-6 text-gray-400 fill-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-700 fill-amber-700" />;
    
    // For ranks 4-25, show a colored badge with the rank number
    let bgColor = 'bg-blue-100 text-blue-800';
    if (rank >= 10) bgColor = 'bg-purple-100 text-purple-800';
    if (rank >= 20) bgColor = 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-bold ${bgColor}`}>
        #{rank}
      </span>
    );
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Generate options for the last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // Months are 0-indexed in JS
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const displayText = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      options.unshift( // Add to beginning to show most recent first
        <option key={value} value={value}>
          {displayText}
        </option>
      );
    }
    
    return options;
  };

  const handleVendorClick = (vendorId) => {
    router.push(`/admin/vendors/${vendorId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Vendor Leaderboard</h1>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setTimeframe('daily')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  timeframe === 'daily'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Daily Ranking
              </button>
              <button
                onClick={() => setTimeframe('monthly')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  timeframe === 'monthly'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly Ranking
              </button>
            </div>
            
            {timeframe === 'monthly' && (
              <div className="relative flex-1 max-w-xs">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white shadow-sm"
                >
                  {generateMonthOptions()}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading leaderboard...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboardData.map((vendor, index) => (
                    <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {getRankBadge(index + 1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Store className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{vendor.shopName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleVendorClick(vendor.vendorId)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm"
                        >
                          {vendor.vendorId.slice(0, 8)}...
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {vendor.serviceType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-2 rounded-lg">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-gray-900">{vendor.currentMonthRating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {vendor.currentMonthReviewCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-bold">
                          {vendor.bayesianScore || vendor.currentMonthBayesianScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && leaderboardData.length === 0 && (
            <div className="p-12 text-center">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No leaderboard data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}