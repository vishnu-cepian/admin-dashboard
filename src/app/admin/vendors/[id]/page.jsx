'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from "@/app/lib/api/axios";
import { Button, Card, Descriptions, message, Skeleton, Tag, Space, Image, Tabs, Divider, Modal } from 'antd';
import { EnvironmentOutlined, BankOutlined, IdcardOutlined, ShopOutlined } from '@ant-design/icons';
import {fileView} from '@/app/lib/s3/fileView';

export default function VendorDetailsPage({ params }) {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const resolvedParams = React.use(params);

  // Block/Unblock Vendor
  const showBlockModal = () => setIsBlockModalOpen(true);
  const handleBlockCancel = () => setIsBlockModalOpen(false);
  const blockOrUnblockVendor = async () => {
    setProcessing(true);
    try {
      await api.post(`/api/admin/blockOrUnblockVendor/${resolvedParams.id}`);
      message.success(`Vendor ${vendor.user?.isBlocked ? 'unblocked' : 'blocked'} successfully`);
      setAction(!action);
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${vendor.user?.isBlocked ? 'unblock' : 'block'} vendor`);
      console.error('Failed to update block status:', error);
      message.error(`Failed to ${vendor.user?.isBlocked ? 'unblock' : 'block'} vendor`);
    } finally {
      setProcessing(false);
      setIsBlockModalOpen(false);
    }
  };

  // Verify Vendor
  const showVerifyModal = () => setIsVerifyModalOpen(true);
  const handleVerifyCancel = () => setIsVerifyModalOpen(false);
  const verifyVendor = async () => {
    setProcessing(true);
    try {
      await api.post(`/api/admin/verifyVendor/${resolvedParams.id}`);
      message.success('Vendor verified successfully');
      setAction(!action);
    } catch (error) {
      alert("Failed to verify vendor");
      console.error('Failed to verify vendor:', error);
      message.error('Failed to verify vendor');
    } finally {
      setProcessing(false);
      setIsVerifyModalOpen(false);
    }
  };

  // Reject Vendor
  const showRejectModal = () => setIsRejectModalOpen(true);
  const handleRejectCancel = () => setIsRejectModalOpen(false);
  const rejectVendor = async () => {
    setProcessing(true);
    try {
      await api.delete(`/api/admin/rejectVendor/${resolvedParams.id}`);
      message.success('Vendor rejected successfully');
      router.push('/admin/vendors');
    } catch (error) {
      // Modal.error({
      //   title: 'Reject Failed',
      //   content: 'This will permanently delete the vendor\'s data! Are you sure you want to proceed?',
      // });
      alert(error.response?.data?.message || 'Failed to reject vendor');
      console.error('Failed to reject vendor:', error);
      message.error('Failed to reject vendor');
    } finally {
      setProcessing(false);
      setIsRejectModalOpen(false);
    }
  };

  const handleViewDocument = async(fileName) => {
    const presignedUrl = await fileView(fileName);
    const link = document.createElement("a");
    link.href = presignedUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await api.get(`/api/admin/getVendorById/${resolvedParams.id}`);
        setVendor(response.data.data);
      } catch (error) {
        console.error('Failed to fetch vendor:', error);
        message.error('Failed to load vendor details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendor();
  }, [resolvedParams.id, action]);

  const getUserStatusTag = () => {
    if (vendor?.user?.isBlocked) {
      return <Tag color="red">BLOCKED</Tag>;
    }
    return <Tag color="green">UNBLOCKED</Tag>
  };

  const getVerificationStatusTag = () => {
    switch(vendor?.status?.toUpperCase()) {
      case 'VERIFIED':
        return <Tag color="green">VERIFIED</Tag>;
      case 'REJECTED':
        return <Tag color="red">REJECTED</Tag>;
      case 'PENDING':
        return <Tag color="orange">PENDING</Tag>;
      default:
        return <Tag color="gray">UNKNOWN</Tag>;
    }
  };

  const items = [
    {
      key: '1',
      label: 'Basic Information',
      icon: <ShopOutlined />,
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="User Status">{getUserStatusTag()}</Descriptions.Item>
          <Descriptions.Item label="Verification Status">{getVerificationStatusTag()}</Descriptions.Item>
          <Descriptions.Item label="Vendor ID">{vendor?.id}</Descriptions.Item>
          <Descriptions.Item label="Shop Name">{vendor?.shopName}</Descriptions.Item>
          <Descriptions.Item label="Shop Type">{vendor?.shopType}</Descriptions.Item>
          <Descriptions.Item label="Service Type">{vendor?.serviceType}</Descriptions.Item>
          <Descriptions.Item label="Vendor Services">{vendor?.vendorServices}</Descriptions.Item>
          <Descriptions.Item label="Ownership Type">{vendor?.ownershipType}</Descriptions.Item>
          <Descriptions.Item label="Rating">{vendor?.allTimeRating} ({vendor?.allTimeReviewCount} reviews)</Descriptions.Item>
          <Descriptions.Item label="Current Month Rating">{vendor?.currentMonthRating} ({vendor?.currentMonthReviewCount} reviews)</Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {vendor?.shopDescription}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: '2',
      label: 'Contact Details',
      icon: <EnvironmentOutlined />,
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Owner Name">{vendor?.user?.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{vendor?.user?.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{vendor?.user?.phoneNumber}</Descriptions.Item>
          <Descriptions.Item label="Address Line 1">{vendor?.addressLine1}</Descriptions.Item>
          <Descriptions.Item label="Address Line 2">{vendor?.addressLine2}</Descriptions.Item>
          <Descriptions.Item label="Street">{vendor?.street}</Descriptions.Item>
          <Descriptions.Item label="City">{vendor?.city}</Descriptions.Item>
          <Descriptions.Item label="District">{vendor?.district}</Descriptions.Item>
          <Descriptions.Item label="State">{vendor?.state}</Descriptions.Item>
          <Descriptions.Item label="Pincode">{vendor?.pincode}</Descriptions.Item>
          <Descriptions.Item label="Location Coordinates">
            {vendor?.location?.coordinates?.join(', ')}
          </Descriptions.Item>
          <Descriptions.Item label="Landmark">{vendor?.landmark}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: '3',
      label: 'Bank Details',
      icon: <BankOutlined />,
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Account Holder">{vendor?.accountHolderName}</Descriptions.Item>
          <Descriptions.Item label="Account Number">{vendor?.accountNumber}</Descriptions.Item>
          <Descriptions.Item label="IFSC Code">{vendor?.ifscCode}</Descriptions.Item>
          <Descriptions.Item label="Bank Passbook">
            {vendor?.bankPassbookUrlPath ? (
          <button
                onClick={() => handleViewDocument(vendor.bankPassbookUrlPath)}
                disabled={loading || !vendor.bankPassbookUrlPath}
                className="px-4 py-2 font-semibold rounded-md bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="View Shop Document"
            >
                {loading ? "Loading..." : "View File"}
            </button>
            ) : 'Not provided'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: '4',
      label: 'Documents',
      icon: <IdcardOutlined />,
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Aadhaar Number">{vendor?.aadhaarNumber}</Descriptions.Item>
          <Descriptions.Item label="Aadhaar Document">
            {vendor?.aadhaarUrlPath ? (
              <button
                onClick={() => handleViewDocument(vendor.aadhaarUrlPath)}
                disabled={loading || !vendor.aadhaarUrlPath}
                className="px-4 py-2 font-semibold rounded-md bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="View Shop Document"
            >
                {loading ? "Loading..." : "View File"}
            </button>
            ) : 'Not provided'}
          </Descriptions.Item>
          <Descriptions.Item label="Shop Document">
            {vendor?.shopDocumentUrlPath ? (
             <button
                onClick={() => handleViewDocument(vendor.shopDocumentUrlPath)}
                disabled={loading || !vendor.shopDocumentUrlPath}
                className="px-4 py-2 font-semibold rounded-md bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="View Shop Document"
            >
                {loading ? "Loading..." : "View File"}
            </button>
      
            ) : 'Not provided'}
          </Descriptions.Item> 
          <Descriptions.Item label="Shop Image">
            {vendor?.shopImageUrlPath ? (
              <button
                onClick={() => handleViewDocument(vendor.shopImageUrlPath)}
                disabled={loading || !vendor.shopImageUrlPath}
                className="px-4 py-2 font-semibold rounded-md bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="View Shop Document"
            >
                {loading ? "Loading..." : "View File"}
            </button>
            ) : 'Not provided'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: '5',
      label: 'Stats',
      icon: <ShopOutlined />,
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Completed Orders">{vendor?.totalCompletedOrders}</Descriptions.Item>
          <Descriptions.Item label="In Progress Orders">{vendor?.totalInProgressOrders}</Descriptions.Item>
          <Descriptions.Item label="Pending Requests">{vendor?.totalPendingRequests}</Descriptions.Item>
          <Descriptions.Item label="Total Earnings">{vendor?.totalEarnings}</Descriptions.Item>
          <Descriptions.Item label="Total Deductions">-{vendor?.totalDeductions}</Descriptions.Item>
        </Descriptions>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Vendor Not Found</h1>
        <Button type="primary" onClick={() => router.push('/admin/vendors')}>
          Back to Vendors List
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendor Details</h1>
        <Space>
          <Button onClick={() => router.push('/admin/vendors')}>
            Back to List
          </Button>
          <Button type="primary" onClick={() => router.push(`/admin/vendors/${params.id}/edit`)}>
            Edit Vendor
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs defaultActiveKey="1" items={items} />
      </Card>

      <Divider />


<div className="mt-4 mb-6 space-y-4">
  {vendor.status === 'PENDING' && (
    <Card size="big" type="inner" title="⚠️ Verification Warning">
      <p className="text-red-600 text-lg">
        Rejecting vendor will <strong>delete all the vendor data from the database</strong> and will enable an option 
        for them to re-apply for verification. <strong>Note:</strong> This will not delete the actual 
        user from users table - they can still login but won't have vendor authorization.
      </p>
    </Card>
  )}

  <Card size="big" type="inner" title="🚨 Blocking Warning">
    <p className="text-red-600 text-lg">
      🚨🚨 <strong>Blocking</strong> a vendor with ongoing orders or commitments may cause <strong>system instability</strong>. 
      Only proceed after ensuring the vendor has no active engagements.
    </p>
  </Card>

  {vendor.status === 'VERIFIED' && (
    <Card size="big" type="inner" title="🔒 Verification Notice">
      <p className="text-green-600 text-lg">
        This vendor is already verified. Only use rejection in exceptional circumstances 
        as it may <strong>disrupt</strong> existing customer relationships.
      </p>
      <p className="text-red-600 text-lg">
          ⚠️ <strong>REJECT will DELETE vendor</strong>. which is not advised as it may <strong>break</strong> the production
      </p>
    </Card>
  )}
</div>

      <div className="mt-6 flex gap-4">
        <Button 
          danger 
          onClick={showBlockModal}
          loading={processing}
        >
          {vendor?.user?.isBlocked ? 'Unblock Vendor' : 'Block Vendor'}
        </Button>
        
        {vendor?.status === 'PENDING' && (
          <Space>
            <Button 
              type="primary" 
              onClick={showVerifyModal}
              loading={processing}
            >
              Verify Vendor
            </Button>
            <Button 
              danger 
              onClick={showRejectModal}
              loading={processing}
            >
              Reject (hard DELETE) Vendor
            </Button>
          </Space>
        )}
         {vendor.status === 'REJECTED' && (
          <Space>
            <Button 
              type="primary" 
              onClick= {() => verifyVendor(resolvedParams.id)}
            >
              Verify Vendor
            </Button>
          </Space>
        )}
         {vendor.status === 'VERIFIED' && (
          <Space>
            <Button 
              type="primary" 
              danger
              onClick= {showRejectModal}
            >
              Reject (hard DELETE) Vendor
            </Button>
            <Button 
              type="primary" 
              onClick={() => router.push(`/admin/vendors/orders/${params.id}/`)}
            >
              View All Orders
            </Button>
          </Space>
        )}
      </div>
      <Modal
        title={`Confirm ${vendor?.user?.isBlocked ? 'Unblock' : 'Block'} Vendor`}
        open={isBlockModalOpen}
        onOk={blockOrUnblockVendor}
        onCancel={handleBlockCancel}
        okText={vendor?.user?.isBlocked ? 'Yes, Unblock' : 'Yes, Block'}
        cancelText="Cancel"
        confirmLoading={processing}
        okButtonProps={{ danger: !vendor?.user?.isBlocked }}
      >
        <p>
          Are you sure you want to {vendor?.user?.isBlocked ? 'unblock' : 'block'} this vendor?
          {!vendor?.user?.isBlocked && (
            <span className="text-red-600 block mt-2">
              This will prevent the vendor from accessing their account.
            </span>
          )}
        </p>
      </Modal>

      {/* Verify Modal */}
      <Modal
        title="Confirm Verify Vendor"
        open={isVerifyModalOpen}
        onOk={verifyVendor}
        onCancel={handleVerifyCancel}
        okText="Yes, Verify"
        cancelText="Cancel"
        confirmLoading={processing}
      >
        <p>
          Are you sure you want to verify this vendor?
          <span className="text-green-600 block mt-2">
            This will grant them full vendor privileges.
          </span>
        </p>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="⚠️ Confirm Reject Vendor"
        open={isRejectModalOpen}
        onOk={rejectVendor}
        onCancel={handleRejectCancel}
        okText="Yes, Reject"
        cancelText="Cancel"
        confirmLoading={processing}
        okButtonProps={{ danger: true }}
      >
        <p className="text-red-600">
          WARNING: This will permanently delete the vendor's data!
        </p>
        <p className="mt-2">
          Are you absolutely sure you want to reject this vendor?
          <span className="block mt-2 font-semibold">
            This action cannot be undone and will remove all vendor information.
          </span>
        </p>
      </Modal>
    </div>
  );
}