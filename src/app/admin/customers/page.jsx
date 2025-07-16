'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from "@/app/lib/api/axios";
import { Table, Badge, Button, Skeleton, message, Select, Space, Input, Form } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export default function CustomerListPage() {
  const [data, setData] = useState({
    customers: [],
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
  });

  const [searchForm] = Form.useForm();
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchCustomers = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/getAllCustomers', {
        params: {
          pageNumber: page,
          limitNumber: pageSize,
          ...filters
        }
      });

      const { data: customers, pagination: apiPagination } = response.data.data;

      setData({
        customers,
        pagination: {
          current: apiPagination.currentPage,
          pageSize: apiPagination.itemsPerPage,
          total: apiPagination.totalItems,
          hasMore: apiPagination.hasMore
        }
      });
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      message.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

 const handleSearch = async (values) => {
    try {
      setSearchLoading(true);
      const response = await api.post('/api/admin/searchCustomerByEmailorPhoneNumber', {
        email: values.email,
        phoneNumber: values.phoneNumber
      });
    
      setData({
        customers: response.data.data.customers || [],
        pagination: {
          current: 1,
          pageSize: 10,
          total: response.data.data.customers?.length || 0,
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
    fetchCustomers();
  };

  useEffect(() => {
    fetchCustomers();
  },[filters]);

  const handleTableChange = (pagination) => {
    fetchCustomers(pagination.current, pagination.pageSize);
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Badge 
          color={record.user?.isBlocked ? 'red'  : 'green'}
          text={record.user?.isBlocked ? 'BLOCKED' : 'ACTIVE'}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Link href={`/admin/customers/${record.id}`}>
          <Button type="link">View Details</Button>
        </Link>
      ),
    },
  ];

  return (
  <div className="p-6">
    {/* Header Section */}
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Manage Customers</h1>
      <Link href="/admin/dashboard">
        <Button type="primary">Dashboard</Button>
      </Link>
    </div>

    {/* Search and Filter Section */}
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Panel */}
        <div className="border-r pr-4">
          <h2 className="text-lg font-semibold mb-3 text-black">Search Customers</h2>
          <Form
            form={searchForm}
            onFinish={handleSearch}
            layout="vertical"
          >
            <div className="flex gap-4">
              <Form.Item name="email" label="Email" className="flex-1">
                <Input placeholder="customer@example.com" />
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
            <Form.Item label="Status" className="flex-1">
              <Select
                placeholder="All Statuses"
                onChange={(v) => handleFilterChange('status', v)}
                value={filters.status}
                allowClear
                options={[
                  { value: '', label: 'All Statuses' },
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
        dataSource={data.customers}
        rowKey="id"
        pagination={{
          current: data.pagination.current,
          pageSize: data.pagination.pageSize,
          total: data.pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} customers`,
        }}
        loading={loading || searchLoading}
        onChange={handleTableChange}
        scroll={{ x: true }}
        locale={{ emptyText: 'No customers found' }}
      />
    </div>
  </div>
);
}