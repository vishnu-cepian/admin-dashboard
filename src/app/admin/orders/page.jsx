'use client';
import { useState, useEffect } from 'react';
import { Table, Input, Select, Space, Button, Tag, Card, Statistic } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '@/app/lib/api/axios';
import Link from 'next/link';
const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    id: '',
    customerId: '',
    selectedVendorId: '',
    isPaid: undefined,
    isRefunded: undefined,
    orderStatus: undefined,
  });
  const [sort, setSort] = useState('createdAt:desc');

  
  const fetchOrders = async (params) => {
      setLoading(true);
      try {
        const response = await api.get('/api/admin/getOrders', { params });
        setOrders(response.data.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.totalItems,
        }));
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    }

  useEffect(() => {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      sort,
      ...filters,
    };
    fetchOrders(params);
  }, [pagination.current, pagination.pageSize, filters, sort]);

  const handleTableChange = (pagination, _, sorter) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
    if (sorter.field) {
      setSort(`${sorter.field}:${sorter.order === 'ascend' ? 'asc' : 'desc'}`);
    }
  };

  const handleIdSearch = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStatusFilter = (value) => {
    setFilters(prev => ({
      ...prev,
      orderStatus: value || undefined, 
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePaymentFilter = (value) => {
    setFilters(prev => ({
      ...prev,
      isPaid: value === 'paid' ? true : value === 'unpaid' ? false : undefined,
      isRefunded: value === 'refunded' ? true : undefined,
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({
      id: '',
      customerId: '',
      selectedVendorId: '',
      isPaid: undefined,
      isRefunded: undefined,
      orderStatus: undefined,
    });
    setSort('createdAt:desc');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      render: (id) => <Tag>{id}</Tag>,
      filterDropdown: ({ confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Order ID"
            value={filters.id}
            onChange={(e) => setFilters(prev => ({ ...prev, id: e.target.value }))}
            onPressEnter={() => confirm()}
            allowClear
            style={{ width: 188, marginBottom: 8 }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (customerId) => (
        <a href={`/admin/customers/${customerId}`}>{customerId}</a>
      ),
      filterDropdown: ({ confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Customer ID"
            value={filters.customerId}
            onChange={(e) => setFilters(prev => ({ ...prev, customerId: e.target.value }))}
            onPressEnter={() => confirm()}
            allowClear
            style={{ width: 188, marginBottom: 8 }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
        </div>
      ),
    },
    {
      title: 'Vendor',
      dataIndex: 'selectedVendorId',
      key: 'selectedVendorId',
      render: (selectedVendorId) => (
        <a href={`/admin/vendors/${selectedVendorId}`}>{selectedVendorId}</a>
      ),
      filterDropdown: ({ confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Vendor ID"
            value={filters.selectedVendorId}
            onChange={(e) => setFilters(prev => ({ ...prev, selectedVendorId: e.target.value }))}
            onPressEnter={() => confirm()}
            allowClear
            style={{ width: 188, marginBottom: 8 }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      // filters: [
      //   { text: 'Pending', value: 'PENDING' },
      //   { text: 'Confirmed', value: 'ORDER_CONFIRMED' },
      //   { text: 'Out for Pickup', value: 'OUT_FOR_PICKUP' },
      //   { text: 'In Progress', value: 'IN_PROGRESS' },
      //   { text: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
      //   { text: 'Completed', value: 'COMPLETED' },
      //   { text: 'Refunded', value: 'REFUNDED' },
      // ],
      // filteredValue: filters.orderStatus ? [filters.orderStatus] : null,
      // onFilter: (value, record) => record.orderStatus === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Payment',
      key: 'payment',
      render: (_, record) => (
        <Space>
          <Tag color={record.isPaid ? 'green' : 'red'}>
            {record.isPaid ? 'PAID' : 'UNPAID'}
          </Tag>
          {record.isRefunded && <Tag color="orange">REFUNDED</Tag>}
        </Space>
      ),
      // filters: [
      //   { text: 'Paid', value: 'paid' },
      //   { text: 'Unpaid', value: 'unpaid' },
      //   { text: 'Refunded', value: 'refunded' },
      // ],
      // onFilter: (value, record) => {
      //   if (value === 'paid') return record.isPaid;
      //   if (value === 'unpaid') return !record.isPaid;
      //   if (value === 'refunded') return record.isRefunded;
      //   return true;
      // },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: (date) => new Date(date).toLocaleString(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" href={`/admin/orders/${record.id}`}>
            View
          </Button>
        </Space>
      ),
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'orange';
      // case 'ORDER_CONFIRMED': return 'blue';
      // case 'OUT_FOR_PICKUP': return 'geekblue';
      case 'IN_PROGRESS': return 'purple';
      // case 'OUT_FOR_DELIVERY': return 'cyan';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      case 'REFUNDED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold"></h1>
      <Link href="/admin/dashboard">
        <Button type="primary">Dashboard</Button>
      </Link>
    </div>
      <Card title="Orders Management" className="mb-6">
        <div className="flex justify-between mb-6">
          <Space>
            <Input
              placeholder="Search Order ID"
              prefix={<SearchOutlined />}
              value={filters.id}
              onChange={(e) => handleIdSearch('id', e.target.value)}
              style={{ width: 200 }}
            />
            
            <Select
              placeholder="Filter by Status"
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: "CANCELLED", label: 'Cancelled' },
                { value: 'REFUNDED', label: 'Refunded' },
              ]}
              value={filters.orderStatus}
              onChange={handleStatusFilter}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="Filter by Payment"
              options={[
                { value: 'paid', label: 'Paid' },
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'refunded', label: 'Refunded' },
              ]}
              onChange={handlePaymentFilter}
              style={{ width: 200 }}
              allowClear
            />
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              Reset
            </Button>
          </Space>
          <Statistic
            title="Total Orders"
            value={pagination.total}
          />
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
          bordered
        />
      </Card>
      
    </div>
    
  );
};

export default OrdersPage;