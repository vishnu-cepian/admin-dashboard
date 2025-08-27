'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Tag, Space, Button, Typography, DatePicker,
  Input, Tooltip, message, Modal, Descriptions, Row, Col,
  Statistic, Select, Progress
} from 'antd';
import {
  EyeOutlined, FilterOutlined, ReloadOutlined, DownloadOutlined,
  ClockCircleOutlined, UndoOutlined, FileTextOutlined,
  RocketOutlined, CommentOutlined, InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from "@/app/lib/api/axios";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function PaymentFailuresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentFailures, setPaymentFailures] = useState([]);
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
    paymentId: '',
    orderId: ''
  });
  const [selectedPaymentFailure, setSelectedPaymentFailure] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchPaymentFailures = useCallback(async (page = 1, pageSize = 10) => {
  try {
    setLoading(true);
    
    const params = {
      page,
      limit: pageSize,
      paymentId: filters.paymentId || undefined,
      orderId: filters.orderId || undefined
    };
    
    // Add date range if provided
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      params.from = filters.dateRange[0].toISOString();
      params.to = filters.dateRange[1].toISOString();
    }
    
    const res = await api.get("/api/admin/getPaymentFailuresList", { params });
    
    setPaymentFailures(res.data.data.paymentFailures);
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
    message.error("Failed to load payment failures");
  } finally {
    setLoading(false);
  }
}, [filters]); // Add filters as dependency

useEffect(() => {
  fetchPaymentFailures();
}, [fetchPaymentFailures]); // Add fetchPaymentFailures as dependency

  const handleTableChange = (pagination, filters, sorter) => {
    fetchPaymentFailures(pagination.current, pagination.pageSize);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchPaymentFailures(1, pagination.pageSize);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: null,
      paymentId: '',
      orderId: ''
    });
    setTimeout(() => fetchPaymentFailures(1, pagination.pageSize), 0);
  };

  const exportPaymentFailures = async () => {
    try {
      message.loading('Preparing export...');
      
      const params = {
        paymentId: filters.paymentId || undefined,
        orderId: filters.orderId || undefined,
        export: true
      };
      
      // Add date range if provided
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.from = filters.dateRange[0].toISOString();
        params.to = filters.dateRange[1].toISOString();
      }
      
      const res = await api.get("/api/admin/getPaymentFailuresList", { 
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-failures-export-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Export downloaded successfully');
    } catch (err) {
      console.error(err);
      message.error("Failed to export payment failures");
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'failed': { color: 'red', text: 'Failed' },
      'retrying': { color: 'orange', text: 'Retrying' },
      'resolved': { color: 'green', text: 'Resolved' },
      'pending': { color: 'blue', text: 'Pending' }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getReasonTag = (reason) => {
    if (!reason) return null;
    
    const reasonConfig = {
      'insufficient_funds': { color: 'red', text: 'Insufficient Funds' },
      'card_declined': { color: 'orange', text: 'Card Declined' },
      'network_error': { color: 'blue', text: 'Network Error' },
      'timeout': { color: 'purple', text: 'Timeout' },
      'invalid_card': { color: 'magenta', text: 'Invalid Card' }
    };
    const config = reasonConfig[reason] || { color: 'default', text: reason };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleViewDetails = (record) => {
    setSelectedPaymentFailure(record);
    setModalVisible(true);
  };

  const PaymentFailureDetailsModal = () => {
    if (!selectedPaymentFailure) return null;

    return (
      <Modal
        title={
          <div className="flex items-center">
            <ExclamationCircleOutlined className="mr-2 text-red-500" />
            Payment Failure Details
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
          <Descriptions.Item label="Failure ID">
            <Text copyable>{selectedPaymentFailure.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Payment ID">
            <Text copyable>{selectedPaymentFailure.paymentId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Order ID">
            <Text copyable>{selectedPaymentFailure.orderId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Quote ID">
            <Text copyable>{selectedPaymentFailure.quoteId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Customer ID">
            <Text copyable>{selectedPaymentFailure.customerId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Amount">
            <Text strong>{formatCurrency(selectedPaymentFailure.amount)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {getStatusTag(selectedPaymentFailure.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Reason">
            {getReasonTag(selectedPaymentFailure.reason)}
          </Descriptions.Item>
          <Descriptions.Item label="Timestamp">
            {dayjs(selectedPaymentFailure.timestamp).format('MMMM D, YYYY h:mm:ss A')}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    );
  };

  const columns = [
    {
      title: 'Failure ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id) => <Text copyable>{id}</Text>
    },
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
      width: 150,
      render: (id) => <Text copyable>{id}</Text>
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
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => (
        <Text strong>{formatCurrency(amount)}</Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      render: (reason) => <Text >{reason.substring(0, 16)}...</Text>
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: true,
      render: (date) => (
        <Space size="small">
          <ClockCircleOutlined />
          <Text>{dayjs(date).format('MMM D, YYYY')}</Text>
        </Space>
      )
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

  // Calculate statistics for status distribution
  const statusDistribution = paymentFailures.reduce((acc, failure) => {
    acc[failure.status] = (acc[failure.status] || 0) + 1;
    return acc;
  }, {});

  // Calculate statistics for reason distribution
  const reasonDistribution = paymentFailures.reduce((acc, failure) => {
    acc[failure.reason] = (acc[failure.reason] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <Title level={2} className="flex items-center mb-2">
              <ExclamationCircleOutlined className="mr-3 text-red-600" />
              Payment Failures Management
            </Title>
            <Text type="secondary" className="text-lg">
              View and monitor all payment failure transactions
            </Text>
          </div>
          
          <Space className="mt-4 lg:mt-0">
            <Button 
              icon={<ReloadOutlined />} 
              size="large"
              onClick={() => fetchPaymentFailures(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              size="large"
              onClick={exportPaymentFailures}
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
                title="Total Failures"
                value={stats.totalCount}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Total Amount"
                value={stats.totalAmount || 0}
                precision={2}
                valueStyle={{ color: '#ff4d4f' }}
                prefix="₹"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Filtered Failures"
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
                value={stats.filteredAmount || 0}
                precision={2}
                valueStyle={{ color: '#faad14' }}
                prefix="₹"
              />
            </Card>
          </Col>
        </Row>

        {/* Status Distribution */}
        {paymentFailures.length > 0 && (
          <>
            <Card className="mb-6 rounded-xl shadow-sm border-0">
              <Title level={5} className="mb-4">
                <InfoCircleOutlined className="mr-2" />
                Failure Status Distribution
              </Title>
              <Row gutter={[16, 16]}>
                {Object.entries(statusDistribution).map(([status, count]) => (
                  <Col xs={12} md={6} key={status}>
                    <div className="flex items-center justify-between mb-2">
                      <Text>{getStatusTag(status)}</Text>
                      <Text strong>{count}</Text>
                    </div>
                    <Progress 
                      percent={Math.round((count / paymentFailures.length) * 100)} 
                      size="small" 
                      showInfo={false}
                      strokeColor={getStatusTag(status).props.color}
                    />
                  </Col>
                ))}
              </Row>
            </Card>

            <Card className="mb-6 rounded-xl shadow-sm border-0">
              <Title level={5} className="mb-4">
                <InfoCircleOutlined className="mr-2" />
                Failure Reason Distribution
              </Title>
              <Row gutter={[16, 16]}>
                {Object.entries(reasonDistribution).map(([reason, count]) => (
                  <Col xs={12} md={6} key={reason}>
                    <div className="flex items-center justify-between mb-2">
                      <Text>{getReasonTag(reason)}</Text>
                      <Text strong>{count}</Text>
                    </div>
                    <Progress 
                      percent={Math.round((count / paymentFailures.length) * 100)} 
                      size="small" 
                      showInfo={false}
                      strokeColor={getReasonTag(reason).props.color}
                    />
                  </Col>
                ))}
              </Row>
            </Card>
          </>
        )}

        {/* Filters */}
        <Card className="mb-6 rounded-xl shadow-sm border-0 bg-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Text strong className="flex items-center whitespace-nowrap">
              <FilterOutlined className="mr-2" />
              Filter Payment Failures:
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
                placeholder="Payment ID"
                value={filters.paymentId}
                onChange={(e) => handleFilterChange('paymentId', e.target.value)}
                size="large"
                className="w-full lg:w-64"
              />

              <Input
                placeholder="Order ID"
                value={filters.orderId}
                onChange={(e) => handleFilterChange('orderId', e.target.value)}
                size="large"
                className="w-full lg:w-64"
              />
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

        {/* Payment Failures Table */}
        <Card 
          title={
            <span className="flex items-center">
              <ExclamationCircleOutlined className="mr-2" />
              Payment Failure Transactions
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
            dataSource={paymentFailures}
            rowKey="id"
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Card>

        {/* Details Modal */}
        <PaymentFailureDetailsModal />
      </div>
    </div>
  );
}