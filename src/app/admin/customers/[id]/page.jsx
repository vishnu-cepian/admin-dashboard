'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from "@/app/lib/api/axios";
import { Button, Card, Descriptions, message, Skeleton, Tag, Space, Image, Tabs, Divider } from 'antd';
import { EnvironmentOutlined, BankOutlined, IdcardOutlined, ShopOutlined } from '@ant-design/icons';

export default function customerDetailsPage({ params }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(false);
  const router = useRouter();

  const resolvedParams = React.use(params);

  const blockOrUnblockCustomer = async() => {
    await api.post(`/api/admin/blockOrUnblockCustomer/${resolvedParams.id}`)
    setAction(!action);
  }

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await api.get(`/api/admin/getCustomerById/${resolvedParams.id}`);
        setCustomer(response.data.data.customer);
      } catch (error) {
        console.error('Failed to fetch customer:', error);
        message.error('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }, [resolvedParams.id,action]);

  const getUserStatusTag = () => {
    if (customer?.user?.isBlocked) {
      return <Tag color="red">BLOCKED</Tag>;
    }
    return <Tag color="green">UNBLOCKED</Tag>
  };


  const items = [
    {
      key: '1',
      label: 'Basic Information',
      icon: <ShopOutlined />,
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="User Status">{getUserStatusTag()}</Descriptions.Item>
          <Descriptions.Item label="Customer ID">{customer?.id}</Descriptions.Item>
          <Descriptions.Item label="Name">{customer?.user?.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{customer?.user?.email}</Descriptions.Item>
          <Descriptions.Item label="Phone Number">{customer?.user?.phoneNumber}</Descriptions.Item>
          <Descriptions.Item label="User Id">{customer?.userId}</Descriptions.Item>
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

  if (!customer) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Customer Not Found</h1>
        <Button type="primary" onClick={() => router.push('/admin/customers')}>
          Back to customers List
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Details</h1>
        <Space>
          <Button onClick={() => router.push('/admin/customers')}>
            Back to List
          </Button>
          <Button type="primary" onClick={() => router.push(`/admin/customers/${params.id}/edit`)}>
            Edit Customer
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs defaultActiveKey="1" items={items} />
      </Card>

      <Divider />


<div className="mt-4 mb-6 space-y-4">
  <Card size="big" type="inner" title="🚨 Blocking Warning">
    <p className="text-red-600 text-lg">
      🚨🚨 <strong>Blocking</strong> a customer with ongoing orders or commitments may cause <strong>system instability</strong>. 
      Only proceed after ensuring the customer has no active engagements.
    </p>
  </Card>
</div>

      <div className="mt-6 flex gap-4">
        <Button 
          danger 
          onClick={() => blockOrUnblockCustomer(resolvedParams.id)}
        >
          {customer.user?.isBlocked ? 'Unblock customer' : 'Block customer'}
        </Button>
        
      </div>
    </div>
  );
}