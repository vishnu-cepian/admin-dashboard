'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Tag, Space, Button, Typography, DatePicker,
  Input, Avatar, Tooltip, message, Modal, Descriptions, Row, Col,
  Statistic, Select
} from 'antd';
import {
  EyeOutlined, FilterOutlined, ReloadOutlined, UserOutlined,
  ClockCircleOutlined, DownloadOutlined, DollarOutlined,
  FileTextOutlined, ShopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from "@/app/lib/api/axios";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function PaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [stats, setStats] = useState({
    totalCount: 0,
    totalAmount: 0,
    filteredCount: 0,
    filteredAmount: 0
  });
  const [filters, setFilters] = useState({
    dateRange: null,
    orderId: '',
    razorpayPaymentId: ''
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentMethodStatusFilter, setPaymentMethodStatusFilter] = useState('all');

  const fetchPayments = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: pageSize,
        orderId: filters.orderId || undefined,
        razorpayPaymentId: filters.razorpayPaymentId || undefined,
        paymentMethod: paymentMethodStatusFilter !== 'all' ? paymentMethodStatusFilter : undefined
      };
      
      // Add date range if provided
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.from = filters.dateRange[0].toISOString();
        params.to = filters.dateRange[1].toISOString();
      }
      
      const res = await api.get("/api/admin/getPaymentsList", { params });
      
      setPayments(res.data.data.payments);
      setPagination({
        current: res.data.data.pagination.currentPage,
        pageSize: res.data.data.pagination.itemsPerPage,
        total: res.data.data.pagination.totalItems
      });
      
      // Set statistics
      setStats({
        totalCount: res.data.data.totalCount || 0,
        totalAmount: res.data.data.totalAmount || 0,
        filteredCount: res.data.data.filteredCount || 0,
        filteredAmount: res.data.data.filteredAmount || 0
      });
    } catch (err) {
      console.error(err);
      message.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleTableChange = (pagination, filters, sorter) => {
    fetchPayments(pagination.current, pagination.pageSize);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchPayments(1, pagination.pageSize);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: null,
      orderId: '',
      razorpayPaymentId: ''
    });
    setPaymentMethodStatusFilter('all');
    setTimeout(() => fetchPayments(1, pagination.pageSize), 0);
  };

  const exportPayments = async () => {
    try {
      message.loading('Preparing export...');
      
      const params = {
        orderId: filters.orderId || undefined,
        razorpayPaymentId: filters.razorpayPaymentId || undefined,
        paymentStatus: paymentMethodStatusFilter !== 'all' ? paymentMethodStatusFilter : undefined,
        export: true
      };
      
      // Add date range if provided
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.from = filters.dateRange[0].toISOString();
        params.to = filters.dateRange[1].toISOString();
      }
      
      const res = await api.get("/api/admin/getPaymentsList", { 
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments-export-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Export downloaded successfully');
    } catch (err) {
      console.error(err);
      message.error("Failed to export payments");
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'captured': { color: 'green', text: 'Captured' },
      'authorized': { color: 'blue', text: 'Authorized' },
      'failed': { color: 'red', text: 'Failed' },
      'refunded': { color: 'orange', text: 'Refunded' },
      'pending': { color: 'gold', text: 'Pending' }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handleViewDetails = (record) => {
    setSelectedPayment(record);
    setModalVisible(true);
  };

  const PaymentDetailsModal = () => {
    if (!selectedPayment) return null;

    return (
      <Modal
        title={
          <div className="flex items-center">
            <DollarOutlined className="mr-2 text-green-500" />
            Payment Details
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        <Descriptions bordered column={1} size="middle" className="mt-4">
          <Descriptions.Item label="Payment ID">
            <Text copyable>{selectedPayment.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Razorpay Payment ID">
            {selectedPayment.razorpayPaymentId || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Order ID">
            <Text copyable>{selectedPayment.orderId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Vendor ID">
            <Text copyable>{selectedPayment.vendorId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Customer ID">
            <Text copyable>{selectedPayment.customerId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Quote ID">
            <Text copyable>{selectedPayment.quoteId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Amount">
            <Text strong>{formatCurrency(selectedPayment.paymentAmount, selectedPayment.paymentCurrency)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {getStatusTag(selectedPayment.paymentStatus)}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Method">
            {selectedPayment.paymentMethod}
          </Descriptions.Item>
          <Descriptions.Item label="Currency">
            {selectedPayment.paymentCurrency}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Date">
            {selectedPayment.paymentDate ? dayjs(selectedPayment.paymentDate).format('MMMM D, YYYY h:mm:ss A') : 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    );
  };

  const columns = [
    {
      title: 'Razorpay ID',
      dataIndex: 'razorpayPaymentId',
      key: 'razorpayPaymentId',
      width: 200,
      render: (id) => id || 'N/A'
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 150,
      render: (id) => <Text copyable>{id}</Text>
    },
    {
      title: 'Amount',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      width: 120,
      render: (amount, record) => (
        <Text strong>{formatCurrency(amount, record.paymentCurrency)}</Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 120,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100
    },
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 180,
      render: (date) => date ? dayjs(date).format('MMM D, YYYY h:mm A') : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewDetails(record)}
        >
          Details
        </Button>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <Title level={2} className="flex items-center mb-2">
              <DollarOutlined className="mr-3 text-green-600" />
              Payments
            </Title>
            <Text type="secondary" className="text-lg">
              View and manage all payment transactions
            </Text>
          </div>
          
          <Space className="mt-4 lg:mt-0">
            <Button 
              icon={<ReloadOutlined />} 
              size="large"
              onClick={() => fetchPayments(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              size="large"
              onClick={exportPayments}
              loading={loading}
            >
              Export
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Total Payments"
                value={stats.totalCount}
                valueStyle={{ color: '#1890ff' }}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Total Amount"
                value={stats.totalAmount}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
                prefix="₹"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Filtered Payments"
                value={stats.filteredCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<FilterOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Filtered Amount"
                value={stats.filteredAmount}
                precision={2}
                valueStyle={{ color: '#eb2f96' }}
                prefix="₹"
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6 rounded-xl shadow-sm border-0 bg-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Text strong className="flex items-center whitespace-nowrap">
              <FilterOutlined className="mr-2" />
              Filter Payments:
            </Text>
            
            <Space direction="vertical" size="middle" className="w-full lg:w-auto">
              <RangePicker
                value={filters.dateRange}
                onChange={(value) => handleFilterChange('dateRange', value)}
                size="large"
                className="w-full lg:w-auto"
                placeholder={['Start Date', 'End Date']}
              />
              
              <Input
                placeholder="Order ID"
                value={filters.orderId}
                onChange={(e) => handleFilterChange('orderId', e.target.value)}
                size="large"
                className="w-full lg:w-48"
              />

              <Input
                placeholder="Razorpay Payment ID"
                value={filters.razorpayPaymentId}
                onChange={(e) => handleFilterChange('razorpayPaymentId', e.target.value)}
                size="large"
                className="w-full lg:w-64"
              />

              <Select
                value={paymentMethodStatusFilter}
                onChange={setPaymentMethodStatusFilter}
                size="large"
                className="w-full lg:w-32"
              >
                <Option value="all">All Status</Option>
                <Option value="card">Card</Option>
                <Option value="netbanking">Netbanking</Option>
                <Option value="wallet">Wallet</Option>
                <Option value="emi">EMI</Option>
                <Option value="upi">UPI</Option>
              </Select>
            </Space>
            
            <Space className="ml-auto">
              <Button 
                icon={<FilterOutlined />}
                type="primary"
                onClick={applyFilters}
                loading={loading}
              >
                Apply Filters
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={resetFilters}
              >
                Reset
              </Button>
            </Space>
          </div>
        </Card>

        {/* Payments Table */}
        <Card 
          title={
            <span className="flex items-center">
              <DollarOutlined className="mr-2" />
              Payment Transactions
            </span>
          }
          className="rounded-xl shadow-sm border-0"
          extra={
            <Text type="secondary">
              Showing {pagination.total} records
            </Text>
          }
        >
          <Table
            columns={columns}
            dataSource={payments}
            rowKey="id"
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="middle"
          />
        </Card>

        {/* Details Modal */}
        <PaymentDetailsModal />
      </div>
    </div>
  );
}