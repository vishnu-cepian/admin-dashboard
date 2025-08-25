'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/app/lib/auth/actions';
import api from '@/app/lib/api/axios';

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('push');
  const [recipientType, setRecipientType] = useState('role');
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [template_id, setTemplateId] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.push('/admin/login');
      return;
    }
    // fetchNotificationHistory();
  }, [router]); // Added router to dependency array

  // const fetchNotificationHistory = async () => {
  //   try {
  //     const response = await api.get('/api/admin/notifications/history');
  //     setNotificationHistory(response.data.data);
  //   } catch (err) {
  //     console.error('Failed to fetch notification history:', err);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      let endpoint = '';
      let payload = {
        title: notificationTitle,
        body: notificationMessage,
      };

      // Determine endpoint and payload based on notification type
      switch (activeTab) {
        case 'push':
          endpoint = recipientType === 'role' 
            ? '/api/notification/broadcast-push-notification' 
            : '/api/notification/send-push-notification';
          if (recipientType === 'role') {
            payload.role = selectedRole;
          } else {
            // For individual push, you might need a user ID or device token
            payload.userId = ''; // You'll need to implement how to get this
          }
          break;

        case 'email':
          endpoint = recipientType === 'role' 
            ? '/api/notification/broadcast-email' 
            : '/api/notification/send-email';
          if (recipientType === 'role') {
            payload.role = selectedRole;
             payload.template_id = template_id;
          } else {
            payload.template_id = template_id;
            payload.name = recipientName;
            payload.email = recipientEmail;
          }
          break;

        case 'whatsapp':
          endpoint = '/api/send-whatsapp';
          payload.phone = recipientPhone;
          break;

        default:
          throw new Error('Invalid notification type');
      }

      const response = await api.post(endpoint, payload);
      
      setSuccess('Notification sent successfully!');
      setNotificationTitle('');
      setNotificationMessage('');
      // fetchNotificationHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
      console.error('Error sending notification:', err);
    } finally {
      setIsSending(false);
    }
  };

  const renderRecipientInput = () => {
    if (recipientType === 'role') {
      return (
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select Role</label>
          <select
            className="w-full p-2 text-gray-600 border rounded"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="CUSTOMER">Customers</option>
            <option value="VENDOR">Vendors</option>
          </select>
        </div>
      );
    }

    if (activeTab === 'email') {
      return (
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Recipient Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            required
          />
          <label className="block text-gray-700 mb-2">Recipient Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
          />
        </div>
        
      );
    }

    if (activeTab === 'whatsapp') {
      return (
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Recipient Phone (with country code)</label>
          <input
            type="tel"
            className="w-full p-2 border rounded"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="e.g., +919876543210"
            required
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl text-black font-bold">Notifications</h1>
            <p className="text-gray-600">Send messages to users</p>
          </div>
        </header>

        <div className="bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <div className="flex border-b mb-6 ">
            <button
              className={`px-4 py-2 ${activeTab === 'push' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('push')}
            >
              Push Notification
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'email' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('email')}
            >
              Email
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'whatsapp' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('whatsapp')}
            >
              WhatsApp
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4 " >
              <label className="block text-gray-700 mb-2">Recipient Type</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="recipientType"
                    checked={recipientType === 'role'}
                    onChange={() => setRecipientType('role')}
                  />
                  <span className="ml-2 text-gray-600">Role-based</span>
                </label>
                {activeTab !== 'push' && (
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="recipientType"
                      checked={recipientType === 'individual'}
                      onChange={() => setRecipientType('individual')}
                    />
                    <span className="ml-2 text-gray-600">Individual</span>
                  </label>
                )}
              </div>
            </div>

            {renderRecipientInput()}

          
            <div className="mb-4">
              {activeTab === 'email' && (
                <>
                  <label className="block text-gray-700 mb-2">template_id</label>
                  <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={template_id}
                  onChange={(e) => setTemplateId(e.target.value)}
                  required
                />
                </>
              )}
              {activeTab === 'push' && (
                <>
                  <label className="block text-gray-700 mb-2">Title</label>
                  <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  required
                /> 
                </>
              )}
            
              {/* <label className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                required
              /> */}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Message</label>
              <textarea
                className="w-full p-2 border rounded"
                rows={4}
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                required
              />
            </div>

            {error && <div className="mb-4 text-red-500">{error}</div>}
            {success && <div className="mb-4 text-green-500">{success}</div>}

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>

        {/* <div className="bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Notification History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notificationHistory.map((notification) => (
                  <tr key={notification.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        notification.type === 'push' ? 'bg-blue-100 text-blue-800' :
                        notification.type === 'email' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {notification.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {notification.recipientType === 'role' 
                        ? `All ${notification.role || 'users'}` 
                        : notification.recipient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{notification.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                        notification.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {notification.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div> */}
      </div>
    </div>
  );
}