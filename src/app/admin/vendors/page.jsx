'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from "@/app/lib/api/axios";
import { Table, Badge, Button, Skeleton, message, Select, Space, Input, Form } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export default function VendorListPage() {
  const [data, setData] = useState({
    vendors: [],
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
      hasMore: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    serviceType: ''
  });

  const [searchForm] = Form.useForm();
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchVendors = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/getAllVendors', {
        params: {
          pageNumber: page,
          limitNumber: pageSize,
          ...filters
        }
      });

      const { data: vendors, pagination: apiPagination } = response.data.data;

      setData({
        vendors,
        pagination: {
          current: apiPagination.currentPage,
          pageSize: apiPagination.itemsPerPage,
          total: apiPagination.totalItems,
          hasMore: apiPagination.hasMore
        }
      });
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      message.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

 const handleSearch = async (values) => {
    try {
      setSearchLoading(true);
      const response = await api.post('/api/admin/searchByEmailorPhoneNumber', {
        email: values.email,
        phoneNumber: values.phoneNumber
      });
    
      setData({
        vendors: response.data.data.vendors || [],
        pagination: {
          current: 1,
          pageSize: 10,
          total: response.data.data.vendors?.length || 0,
          hasMore: false
        }
      });
    } catch (error) {
      console.error('Search failed:', error);
      message.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const resetSearch = () => {
    searchForm.resetFields();
    fetchVendors();
  };

  useEffect(() => {
    fetchVendors();
  }, [filters]);

  const handleTableChange = (pagination) => {
    fetchVendors(pagination.current, pagination.pageSize);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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
      title: 'Service Type',
      dataIndex: 'serviceType',
      key: 'serviceType',
      render: (type) => type || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Badge 
          color={record.user?.isBlocked ? 'red' : 
                status === 'VERIFIED' ? 'green' :
                status === 'REJECTED' ? 'red' :
                status === 'PENDING' ? 'orange' : 'gray'}
          text={record.user?.isBlocked ? 'BLOCKED' : status}
        />
      ),
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
    {/* Header Section */}
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Manage Vendors</h1>
      <Link href="/admin/dashboard">
        <Button type="primary">Dashboard</Button>
      </Link>
    </div>

    {/* Search and Filter Section */}
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Panel */}
        <div className="border-r pr-4">
          <h2 className="text-lg font-semibold mb-3 text-black">Search Vendors</h2>
          <Form
            form={searchForm}
            onFinish={handleSearch}
            layout="vertical"
          >
            <div className="flex gap-4">
              <Form.Item name="email" label="Email" className="flex-1">
                <Input placeholder="vendor@example.com" />
              </Form.Item>
              <Form.Item name="phoneNumber" label="Phone" className="flex-1">
                <Input placeholder="+1 234 567 890" />
              </Form.Item>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button onClick={resetSearch}>Reset</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SearchOutlined />}
                loading={searchLoading}
              >
                Search
              </Button>
            </div>
          </Form>
        </div>

        {/* Filter Panel */}
        <div className="pl-4">
          <h2 className="text-lg font-semibold mb-3 text-black">Filter Options</h2>
          <div className="flex gap-4">
            <Form.Item label="Service Type" className="flex-1">
              <Select
                placeholder="All Services"
                onChange={(v) => handleFilterChange('serviceType', v)}
                value={filters.serviceType}
                allowClear
                options={[
                  { value: '', label: 'All Services' },
                  { value: 'tailors', label: 'Tailors' },
                  { value: 'laundry', label: 'Laundry' },
                ]}
              />
            </Form.Item>
            <Form.Item label="Status" className="flex-1">
              <Select
                placeholder="All Statuses"
                onChange={(v) => handleFilterChange('status', v)}
                value={filters.status}
                allowClear
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'VERIFIED', label: 'Verified' },
                  { value: 'REJECTED', label: 'Rejected' },
                  { value: 'BLOCKED', label: 'Blocked' },
                ]}
              />
            </Form.Item>
          </div>
        </div>
      </div>
    </div>

    {/* Results Section */}
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <Table
        columns={columns}
        dataSource={data.vendors}
        rowKey="id"
        pagination={{
          current: data.pagination.current,
          pageSize: data.pagination.pageSize,
          total: data.pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} vendors`,
        }}
        loading={loading || searchLoading}
        onChange={handleTableChange}
        scroll={{ x: true }}
        locale={{ emptyText: 'No vendors found' }}
      />
    </div>
  </div>
);
}