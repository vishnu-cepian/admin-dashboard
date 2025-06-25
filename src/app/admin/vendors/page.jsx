'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from "@/app/lib/api/axios";
import { Table, Badge, Button, Skeleton, message, Select, Space } from 'antd';

export default function VendorListPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(''); // New state for filter
  const [serviceFilterStatus, setServiceFilterStatus] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchVendors = async (params = {}) => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/getAllVendors', {
        params: {
          status: filterStatus, // Send filter to backend
          service: serviceFilterStatus,
          page: params.pagination?.current || pagination.current,
          pageSize: params.pagination?.pageSize || pagination.pageSize,
          ...params,
        },
      });
      
      // Handle both array and object responses
      let vendorsData = [];
      if (Array.isArray(response.data.data.vendors)) {
        vendorsData = response.data.data.vendors;
      } else if (response.data.data.vendors && typeof response.data.data.vendors === 'object') {
        vendorsData = [response.data.data.vendors];
      }
    
      setVendors(vendorsData);
      setPagination({
        ...pagination,
        total: response.data.data.totalCount || vendorsData.length, // Use totalCount from backend if available
        ...params.pagination,
      });
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      message.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [filterStatus,serviceFilterStatus]); // Refetch when filter changes

  const handleTableChange = (newPagination) => {
    fetchVendors({
      pagination: newPagination,
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: ['user', 'name'],
      key: 'name',
      render: (name) => name || 'N/A',
    },
    {
      title: 'Email',
      dataIndex: ['user', 'email'],
      key: 'email',
      render: (email) => email || 'N/A',
    },
    {
      title: 'Phone',
      dataIndex: ['user', 'phoneNumber'],
      key: 'phone',
      render: (phone) => phone || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        let color;
        if (record.user.isBlocked) {
          color = "red";
          return <Badge color={color} text="BLOCKED" />;
        } else {
          switch (status?.toUpperCase()) {
            case 'VERIFIED':
              color = 'green';
              break;
            case 'REJECTED':
              color = 'red';
              break;
            case 'PENDING':
              color = 'orange';
              break;
            default:
              color = 'gray';
          }
          return <Badge color={color} text={status} />;
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Link href={`/admin/vendors/${record.id}`}>
          <Button type="link">View Details</Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Vendors</h1>
        <Space>
        <Select
            placeholder="Filter by SERVICE"
            style={{ width: 150 }}
            onChange={setServiceFilterStatus}
            allowClear
            options={[
              { value: '', label: 'All Services' },
              { value: 'tailoring', label: 'Tailoring' },
              { value: 'laundry', label: 'Laundry' },
            ]}
          />
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            onChange={setFilterStatus}
            allowClear
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'VERIFIED', label: 'Verified' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'BLOCKED', label: 'Blocked' },
            ]}
          />
          <Link href="/admin/dashboard">
            <Button type="primary">Go back to Dashboard</Button>
          </Link>
        </Space>
      </div>

      {loading && vendors.length === 0 ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <Table
          columns={columns}
          dataSource={vendors}
          rowKey={(record) => record.id}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: true }}
          locale={{
            emptyText: 'No vendors found',
          }}
        />
      )}
    </div>
  );
}