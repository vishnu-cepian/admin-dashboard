'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from "@/app/lib/api/axios";
import { Button, Card, Descriptions, message, Skeleton, Tag, Space, Image, Tabs, Divider } from 'antd';
import { EnvironmentOutlined, BankOutlined, IdcardOutlined, ShopOutlined } from '@ant-design/icons';
import {fileView} from '@/app/lib/s3/fileView';

export default function VendorDetailsPage({ params }) {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(false);
  const router = useRouter();

  const resolvedParams = React.use(params);

  const blockOrUnblockVendor = async() => {
    await api.post(`/api/admin/blockOrUnblockVendor/${resolvedParams.id}`)
    setAction(!action);
  }
  
  const verifyVendor = async() => {
    await api.post(`/api/admin/verifyVendor/${resolvedParams.id}`)
    setAction(!action);
  }

  const rejectVendor = async() => {
    await api.delete(`/api/admin/rejectVendor/${resolvedParams.id}`)
    setAction(!action);
  }

  const handleViewDocument = async(fileName) => {
    const presignedUrl = await fileView(fileName);
    console.log(presignedUrl)
    const link = document.createElement("a");
      link.href = presignedUrl;
      link.target = "_blank"; // Open in a new tab
      link.rel = "noopener noreferrer"; // Security best practice
      document.body.appendChild(link);
      link.click(); // Programmatically click the link
      document.body.removeChild(link); // Clean up
  }

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await api.get(`/api/admin/getVendorById/${resolvedParams.id}`);
        setVendor(response.data.data.vendor);
      } catch (error) {
        console.error('Failed to fetch vendor:', error);
        message.error('Failed to load vendor details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendor();
  }, [resolvedParams.id,action]);

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
          <Descriptions.Item label="Address">{vendor?.address}</Descriptions.Item>
          <Descriptions.Item label="Street">{vendor?.street}</Descriptions.Item>
          <Descriptions.Item label="City">{vendor?.city}</Descriptions.Item>
          <Descriptions.Item label="State">{vendor?.state}</Descriptions.Item>
          <Descriptions.Item label="Pincode">{vendor?.pincode}</Descriptions.Item>
          <Descriptions.Item label="Location Coordinates">
            {vendor?.location?.coordinates?.join(', ')}
          </Descriptions.Item>
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
          onClick={() => blockOrUnblockVendor(resolvedParams.id)}
        >
          {vendor.user?.isBlocked ? 'Unblock Vendor' : 'Block Vendor'}
        </Button>
        
        {vendor.status === 'PENDING'  && (
          <Space>
            <Button 
              type="primary" 
              onClick= {() => verifyVendor(resolvedParams.id)}
            >
              Verify Vendor
            </Button>
            <Button 
              danger 
              onClick={() => rejectVendor(resolvedParams.id)}
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
              onClick= {() => rejectVendor(resolvedParams.id)}
            >
              Reject (hard DELETE) Vendor
            </Button>
            <Button 
              type="primary" 
              // onClick= {() => rejectVendor(resolvedParams.id)}
            >
              View All Orders
            </Button>
          </Space>
        )}
      </div>
    </div>
  );
}