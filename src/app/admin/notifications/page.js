'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/app/lib/auth/actions';
import api from '@/app/lib/api/axios';
import { 
  Bell, 
  Mail, 
  MessageCircle, 
  Send, 
  Info,
  ChevronDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Template configuration with variables
const EMAIL_TEMPLATES = {
  global_otp: {
    name: 'global_otp',
    variables: ['otp'],
    defaultMessage: "Hi,\nWelcome to ! We're excited to have you!\nPlease use this OTP to complete your login / signup process - \n\n{{otp}}\n\nRegards,\nTeam"
  },
  welcome_customer: {
    name: 'Welcome Customer',
    variables: ['name', 'email'],
    defaultMessage: 'Hi {{name}}, thanks for registering with us. All communications will be sent to {{email}}.'
  },
  order_confirmation: {
    name: 'Order Confirmation',
    variables: ['name', 'order_id', 'amount'],
    defaultMessage: 'Hi {{name}}, your order #{{order_id}} has been confirmed. Total amount: ₹{{amount}}.'
  },
  password_reset: {
    name: 'Password Reset',
    variables: ['name', 'reset_link'],
    defaultMessage: 'Hi {{name}}, click here to reset your password: {{reset_link}}'
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('push');
  const [recipientType, setRecipientType] = useState('role');
  const [selectedRole, setSelectedRole] = useState('customer');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [template_id, setTemplateId] = useState('');
  const [templateVariables, setTemplateVariables] = useState({});
  const [recipientPhone, setRecipientPhone] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.push('/admin/login');
      return;
    }
  }, [router]);

  // Update message when template changes
  useEffect(() => {
    if (template_id && EMAIL_TEMPLATES[template_id]) {
      setNotificationMessage(EMAIL_TEMPLATES[template_id].defaultMessage);
      
      // Initialize template variables
      const vars = {};
      EMAIL_TEMPLATES[template_id].variables.forEach(v => {
        vars[v] = '';
      });
      setTemplateVariables(vars);
    }
  }, [template_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      let endpoint = '';
      let payload = {};

      // Determine endpoint and payload based on notification type
      switch (activeTab) {
        case 'push':
          endpoint = recipientType === 'role' 
            ? '/api/admin/broadcastPushNotificationByRole' 
            : '/api/admin/send-push-notification';
          payload = {
            title: notificationTitle,
            body: notificationMessage,
          };
          
          if (recipientType === 'role') {
            payload.role = selectedRole;
          } else {
            // For individual push, you might need a user ID or device token
            payload.userId = ''; // You'll need to implement how to get this
          }
          break;

        case 'email':
          endpoint = '/api/admin/sendIndividualEmail';
          payload = {
            template_id: template_id,
            name: recipientName,
            email: recipientEmail,
            variables: templateVariables, // Changed to nest variables in a separate object
          };
          break;

        case 'whatsapp':
          endpoint = '/api/send-whatsapp';
          payload = {
            phone: recipientPhone,
            title: notificationTitle,
            body: notificationMessage,
          };
          break;

        default:
          throw new Error('Invalid notification type');
      }

      const response = await api.post(endpoint, payload);
      
      setSuccess('Notification sent successfully!');
      setNotificationTitle('');
      setNotificationMessage('');
      setTemplateVariables({});
      setRecipientEmail('');
      setRecipientName('');
      setRecipientPhone('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
      console.error('Error sending notification:', err);
    } finally {
      setIsSending(false);
    }
  };

  const renderRecipientInput = () => {
    if (recipientType === 'role' && activeTab === 'push') {
      return (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-2">Select Role</label>
          <select
            className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>
      );
    }

    if (activeTab === 'email') {
      return (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Recipient Email</label>
            <input
              type="email"
              className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Recipient Name</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
            />
          </div>
        </div>
      );
    }

    if (activeTab === 'whatsapp') {
      return (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-2">Recipient Phone (with country code)</label>
          <input
            type="tel"
            className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900"
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

  const renderTemplateVariables = () => {
    if (activeTab !== 'email' || !template_id || !EMAIL_TEMPLATES[template_id]) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-800">Template Variables</label>
          <button
            type="button"
            onClick={() => setShowTemplateInfo(!showTemplateInfo)}
            className="text-blue-700 text-sm flex items-center font-medium hover:text-blue-800"
          >
            <Info size={16} className="mr-1" />
            How it works
          </button>
        </div>
        
        {showTemplateInfo && (
          <div className="bg-blue-100 p-4 rounded-lg mb-4 text-sm text-blue-900 border border-blue-200">
            <p className="mb-2 font-medium">Template variables will be replaced in your message. For example, <code className="bg-blue-200 px-1.5 py-0.5 rounded font-bold">{"{{name}}"}</code> will be replaced with the actual value.</p>
            <p className="font-medium">Available variables: {EMAIL_TEMPLATES[template_id].variables.join(', ')}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EMAIL_TEMPLATES[template_id].variables.map(variable => (
            <div key={variable}>
              <label className="block text-sm font-semibold text-gray-800 mb-2 capitalize">
                {variable.replace('_', ' ')}
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900"
                value={templateVariables[variable] || ''}
                onChange={(e) => setTemplateVariables(prev => ({
                  ...prev,
                  [variable]: e.target.value
                }))}
                required
              />
            </div>
          ))}
        </div>
        
        {/* Message preview for admin (not sent in payload) */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Message Preview:</h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {Object.entries(templateVariables).reduce((message, [key, value]) => {
              return message.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
            }, notificationMessage)}
          </p>
        </div>
      </div>
    );
  };

  const renderMessageInput = () => {
    // Don't show message input for email notifications
    if (activeTab === 'email') return null;
    
    return (
      <div className="mb-6">
        {activeTab === 'push' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Title</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              required
            /> 
          </div>
        )}
        
        <label className="block text-sm font-semibold text-gray-800 mb-2">Message</label>
        <textarea
          className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900"
          rows={4}
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
          required
        />
      </div>
    );
  };

  const TabButton = ({ id, icon, label }) => (
    <button
      className={`flex items-center px-4 py-3 rounded-t-lg font-semibold transition-colors ${
        activeTab === id 
          ? 'bg-white text-blue-700 border-b-2 border-blue-700' 
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab(id)}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center mb-2">
            <Bell className="w-8 h-8 text-blue-700 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          </div>
          <p className="text-gray-700 font-medium">Send messages to users through multiple channels</p>
        </header>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-200">
          <div className="border-b border-gray-300 flex px-6 bg-gray-50">
            <TabButton 
              id="push" 
              icon={<Send size={18} />} 
              label="Push Notification" 
            />
            <TabButton 
              id="email" 
              icon={<Mail size={18} />} 
              label="Email" 
            />
            <TabButton 
              id="whatsapp" 
              icon={<MessageCircle size={18} />} 
              label="WhatsApp" 
            />
          </div>

          <div className="p-6 bg-white">
            <form onSubmit={handleSubmit}>
              {activeTab === 'push' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Recipient Type</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-blue-700"
                        name="recipientType"
                        checked={recipientType === 'role'}
                        onChange={() => setRecipientType('role')}
                      />
                      <span className="ml-2 text-gray-800 font-medium">Role-based</span>
                    </label>
                    {/* <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-blue-700"
                        name="recipientType"
                        checked={recipientType === 'individual'}
                        onChange={() => setRecipientType('individual')}
                      />
                      <span className="ml-2 text-gray-800 font-medium">Individual</span>
                    </label> */}
                  </div>
                </div>
              )}

              {renderRecipientInput()}

              {activeTab === 'email' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Email Template</label>
                  <select
                    className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900"
                    value={template_id}
                    onChange={(e) => setTemplateId(e.target.value)}
                    required
                  >
                    <option value="">Select a template</option>
                    {Object.entries(EMAIL_TEMPLATES).map(([id, template]) => (
                      <option key={id} value={id}>{template.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {renderTemplateVariables()}
              {renderMessageInput()}

              {error && (
                <div className="mb-6 p-3 bg-red-100 text-red-800 rounded-lg flex items-center border border-red-200">
                  <AlertCircle size={18} className="mr-2" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              
              {success && (
                <div className="mb-6 p-3 bg-green-100 text-green-800 rounded-lg flex items-center border border-green-200">
                  <CheckCircle size={18} className="mr-2" />
                  <span className="font-medium">{success}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 disabled:bg-blue-400 transition-colors flex items-center justify-center font-semibold shadow-md hover:shadow-lg"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    Send Notification
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}