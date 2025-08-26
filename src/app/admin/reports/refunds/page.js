'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Tag, Space, Button, Typography, DatePicker,
  Input, Tooltip, message, Modal, Descriptions, Row, Col,
  Statistic, Select, Progress
} from 'antd';
import {
  EyeOutlined, FilterOutlined, ReloadOutlined, DownloadOutlined,
  ClockCircleOutlined, UndoOutlined, FileTextOutlined,
  RocketOutlined, CommentOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from "@/app/lib/api/axios";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function RefundsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refunds, setRefunds] = useState([]);
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
    status: 'all'
  });
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchRefunds = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: pageSize,
        paymentId: filters.paymentId || undefined,
        status: filters.status !== 'all' ? filters.status : undefined
      };
      
      // Add date range if provided
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.from = filters.dateRange[0].toISOString();
        params.to = filters.dateRange[1].toISOString();
      }
      
      const res = await api.get("/api/admin/getRefundsList", { params });
      
      setRefunds(res.data.data.refunds);
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
      message.error("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleTableChange = (pagination, filters, sorter) => {
    fetchRefunds(pagination.current, pagination.pageSize);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchRefunds(1, pagination.pageSize);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: null,
      paymentId: '',
      status: 'all'
    });
    setTimeout(() => fetchRefunds(1, pagination.pageSize), 0);
  };

  const exportRefunds = async () => {
    try {
      message.loading('Preparing export...');
      
      const params = {
        paymentId: filters.paymentId || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        export: true
      };
      
      // Add date range if provided
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.from = filters.dateRange[0].toISOString();
        params.to = filters.dateRange[1].toISOString();
      }
      
      const res = await api.get("/api/admin/getRefundsList", { 
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `refunds-export-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Export downloaded successfully');
    } catch (err) {
      console.error(err);
      message.error("Failed to export refunds");
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'processed': { color: 'green', text: 'Processed' },
      'pending': { color: 'blue', text: 'Pending' },
      'failed': { color: 'red', text: 'Failed' },
      'requested': { color: 'orange', text: 'Requested' },
      'cancelled': { color: 'default', text: 'Cancelled' }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getSpeedTag = (speed) => {
    if (!speed) return null;
    
    const speedConfig = {
      'optimum': { color: 'green', text: 'Optimum', icon: <RocketOutlined /> },
      'normal': { color: 'blue', text: 'Normal' },
      'slow': { color: 'orange', text: 'Slow' }
    };
    const config = speedConfig[speed] || { color: 'default', text: speed };
    return <Tag color={config.color}>{config.icon} {config.text}</Tag>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount / 100); // Assuming amount is in paise
  };

  const handleViewDetails = (record) => {
    setSelectedRefund(record);
    setModalVisible(true);
  };

  const RefundDetailsModal = () => {
    if (!selectedRefund) return null;

    return (
      <Modal
        title={
          <div className="flex items-center">
            <UndoOutlined className="mr-2 text-blue-500" />
            Refund Details
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
          <Descriptions.Item label="Refund ID">
            <Text copyable>{selectedRefund.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Payment ID">
            <Text copyable>{selectedRefund.paymentId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Amount">
            <Text strong>{formatCurrency(selectedRefund.amount)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {getStatusTag(selectedRefund.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Speed Requested">
            {getSpeedTag(selectedRefund.speedRequested) || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Speed Processed">
            {getSpeedTag(selectedRefund.speedProcessed) || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Notes">
            {selectedRefund.notes || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Comments">
            {selectedRefund.comment || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {dayjs(selectedRefund.createdAt).format('MMMM D, YYYY h:mm:ss A')}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    );
  };

  const columns = [
    {
      title: 'Refund ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id) => <Text copyable>{id.substring(0, 8)}...</Text>
    },
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
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
      title: 'Speed',
      key: 'speed',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.speedRequested && (
            <div>
              <Text type="secondary">Req: </Text>
              {getSpeedTag(record.speedRequested)}
            </div>
          )}
          {record.speedProcessed && (
            <div>
              <Text type="secondary">Proc: </Text>
              {getSpeedTag(record.speedProcessed)}
            </div>
          )}
        </Space>
      )
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
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
  const statusDistribution = refunds.reduce((acc, refund) => {
    acc[refund.status] = (acc[refund.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <Title level={2} className="flex items-center mb-2">
              <UndoOutlined className="mr-3 text-blue-600" />
              Refunds Management
            </Title>
            <Text type="secondary" className="text-lg">
              View and monitor all refund transactions
            </Text>
          </div>
          
          <Space className="mt-4 lg:mt-0">
            <Button 
              icon={<ReloadOutlined />} 
              size="large"
              onClick={() => fetchRefunds(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              size="large"
              onClick={exportRefunds}
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
                title="Total Refunds"
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
                value={stats.totalAmount ? stats.totalAmount / 100 : 0}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
                prefix="₹"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Filtered Refunds"
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
                value={stats.filteredAmount ? stats.filteredAmount / 100 : 0}
                precision={2}
                valueStyle={{ color: '#eb2f96' }}
                prefix="₹"
              />
            </Card>
          </Col>
        </Row>

        {/* Status Distribution */}
        {refunds.length > 0 && (
          <Card className="mb-6 rounded-xl shadow-sm border-0">
            <Title level={5} className="mb-4">
              <InfoCircleOutlined className="mr-2" />
              Refund Status Distribution
            </Title>
            <Row gutter={[16, 16]}>
              {Object.entries(statusDistribution).map(([status, count]) => (
                <Col xs={12} md={6} key={status}>
                  <div className="flex items-center justify-between mb-2">
                    <Text>{getStatusTag(status)}</Text>
                    <Text strong>{count}</Text>
                  </div>
                  <Progress 
                    percent={Math.round((count / refunds.length) * 100)} 
                    size="small" 
                    showInfo={false}
                    strokeColor={getStatusTag(status).props.color}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6 rounded-xl shadow-sm border-0 bg-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Text strong className="flex items-center whitespace-nowrap">
              <FilterOutlined className="mr-2" />
              Filter Refunds:
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

              <Select
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                size="large"
                className="w-full lg:w-40"
              >
                <Option value="all">All Status</Option>
                <Option value="processed">Processed</Option>
                <Option value="pending">Pending</Option>
                <Option value="failed">Failed</Option>
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

        {/* Refunds Table */}
        <Card 
          title={
            <span className="flex items-center">
              <UndoOutlined className="mr-2" />
              Refund Transactions
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
            dataSource={refunds}
            rowKey="id"
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="middle"
          />
        </Card>

        {/* Details Modal */}
        <RefundDetailsModal />
      </div>
    </div>
  );
}