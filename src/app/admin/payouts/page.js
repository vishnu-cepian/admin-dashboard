'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Tag, Space, Button, Typography, DatePicker,
  Input, message, Modal, Descriptions, Row, Col,
  Statistic, Select, InputNumber, Alert,
  Collapse
} from 'antd';
import {
  EyeOutlined, FilterOutlined, ReloadOutlined,
  ClockCircleOutlined, DollarOutlined, RocketOutlined,
  RetweetOutlined, SearchOutlined,
  UserOutlined, ShoppingOutlined, SettingOutlined, WarningOutlined, CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from "@/app/lib/api/axios";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;

export default function PayoutsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} payouts`
  });
  const [stats, setStats] = useState({
    processedPayoutAmount: 0,
    pendingPayoutAmount: 0,
    filteredExpectedAmount: 0,
    filteredActualPaidAmount: 0,
    processedPayoutCount: 0,
    pendingPayoutCount: 0,
    filteredCount: 0
  });
  const [filters, setFilters] = useState({
    id: '',
    orderId: '',
    vendorId: '',
    status: 'all',
    retryCount: 'all',
    utr: '',
    payoutId: '',
    dateRange: null
  });
   const [appliedFilters, setAppliedFilters] = useState({
    id: '',
    orderId: '',
    vendorId: '',
    status: 'all',
    retryCount: 'all',
    utr: '',
    payoutId: '',
    dateRange: null
  });
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState(0);
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  const fetchPayouts = useCallback(async (page = 1, pageSize = 10, filterParams = appliedFilters) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: pageSize,
        id: filterParams.id || undefined,
        orderId: filterParams.orderId || undefined,
        vendorId: filterParams.vendorId || undefined,
        status: filterParams.status !== 'all' ? filterParams.status : undefined,
        utr: filterParams.utr || undefined,
        payoutId: filterParams.payoutId || undefined
      };
      
      // Add retry count filter
      if (filterParams.retryCount !== 'all') {
        params.retryCount = filterParams.retryCount === 'has_retries' ? 'gt:0' : '0';
      }
      
      // Add date range if provided
      if (filterParams.dateRange && filterParams.dateRange[0] && filterParams.dateRange[1]) {
        params.from = filterParams.dateRange[0].toISOString();
        params.to = filterParams.dateRange[1].toISOString();
      }
      
      const res = await api.get("/api/admin/getPayoutsList", { params });
      
      setPayouts(res.data.data.payouts);
      setPagination(prev => ({
        ...prev,
        current: res.data.data.pagination.currentPage,
        pageSize: res.data.data.pagination.itemsPerPage,
        total: res.data.data.pagination.totalItems
      }));
      
      // Set statistics
      setStats({
        processedPayoutAmount: res.data.data.processedPayoutAmount || 0,
        processedPayoutCount: res.data.data.processedPayoutCount || 0,

        pendingPayoutAmount: res.data.data.pendingPayoutAmount || 0,
        pendingPayoutCount: res.data.data.pendingPayoutCount || 0,

        filteredExpectedAmount: res.data.data.filteredExpectedAmount || 0,
        filteredActualPaidAmount: res.data.data.filteredActualPaidAmount || 0,
        filteredCount: res.data.data.filteredCount || 0
      });
    } catch (err) {
      console.error(err);
      message.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, []); // Removed filters dependency

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleTableChange = (newPagination, filters, sorter) => {
    fetchPayouts(newPagination.current, newPagination.pageSize, appliedFilters);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters({...filters});
    fetchPayouts(1, pagination.pageSize, filters);
  };

  const resetFilters = () => {
    const emptyFilters = {
      id: '',
      orderId: '',
      vendorId: '',
      status: 'all',
      retryCount: 'all',
      utr: '',
      payoutId: '',
      dateRange: null
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    fetchPayouts(1, pagination.pageSize, emptyFilters);
  };

  const handleProcessPayout = async (idempotencyKey, amount = null) => {
    try {
      setProcessing(true);
      const payload = {
        idempotencyKey,
        amount: amount || selectedPayout.expected_amount
      };
      
      const res = await api.post("/api/admin/processPayout", payload);
      
      if (res.data.success) {
        message.success("Payout processed successfully");
        setPayoutModalVisible(false);
        // Soft reload to get updated status
        fetchPayouts(pagination.current, pagination.pageSize);
      } else {
        message.error(res.data.message || "Failed to process payout");
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Failed to process payout");
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryPayout = async (idempotencyKey) => {
    try {
      setProcessing(true);
      const res = await api.post("/api/admin/retryPayout", { idempotencyKey });
      
      if (res.data.success) {
        message.success("Payout retry initiated");
        // Soft reload to get updated status
        fetchPayouts(pagination.current, pagination.pageSize);
      } else {
        message.error(res.data.message || "Failed to retry payout");
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Failed to retry payout");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'action_required': { color: 'orange', text: 'Action Required', icon: <SettingOutlined /> },
      'queued': { color: 'purple', text: 'Queued', icon: <RetweetOutlined /> },
      'processing': { color: 'blue', text: 'Processing', icon: <RocketOutlined /> },
      'processed': { color: 'green', text: 'Processed', icon: <DollarOutlined /> },
      'cancelled': { color: 'red', text: 'Cancelled', icon: <WarningOutlined /> },
      'failed': { color: 'red', text: 'Failed', icon: <WarningOutlined /> },
      'reversed': { color: 'purple', text: 'Reversed', icon: <RetweetOutlined /> }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return (
      <Tag color={config.color} className="flex items-center">
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </Tag>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleViewDetails = (record) => {
    setSelectedPayout(record);
    setDetailModalVisible(true);
  };

  const handleInitiatePayout = (record) => {
    setSelectedPayout(record);
    setCustomAmount(record.expected_amount);
    setUseCustomAmount(false);
    setPayoutModalVisible(true);
  };

  const renderJsonData = (data, title) => {
    if (!data) return 'N/A';
    
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      return (
        <Collapse className="mt-2" ghost>
          <Panel header={title} key="1">
            <pre className="text-xs bg-gray-100 p-3 rounded max-h-40 overflow-auto">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </Panel>
        </Collapse>
      );
    } catch (e) {
      return (
        <div className="mt-2">
          <Text type="secondary">Invalid JSON format:</Text>
          <pre className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto">
            {data}
          </pre>
        </div>
      );
    }
  };

  const PayoutDetailsModal = () => {
    if (!selectedPayout) return null;

    return (
      <Modal
        title={
          <div className="flex items-center">
            <DollarOutlined className="mr-2 text-green-500" />
            Payout Details
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={900}
        style={{ top: 20 }}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <Descriptions bordered column={1} size="middle" className="mt-4">
            <Descriptions.Item label="Idempotency Key">
              <Text copyable>{selectedPayout.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Order ID">
              <Button 
                type="link" 
                onClick={() => router.push(`/admin/orders/${selectedPayout.orderId}`)}
                icon={<ShoppingOutlined />}
              >
                <Text copyable>{selectedPayout.orderId}</Text>
              </Button>
            </Descriptions.Item>
            <Descriptions.Item label="Vendor ID">
              <Button 
                type="link" 
                onClick={() => router.push(`/admin/vendors/${selectedPayout.vendorId}`)}
                icon={<UserOutlined />}
              >
                <Text copyable>{selectedPayout.vendorId}</Text>
              </Button>
            </Descriptions.Item>
            <Descriptions.Item label="Razorpay Fund Account ID">
              <Text copyable>{selectedPayout.razorpay_fund_account_id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Expected Amount">
              <Text strong>{formatCurrency(selectedPayout.expected_amount)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Actual Paid Amount">
              <Text strong>{selectedPayout.actual_paid_amount ? formatCurrency(selectedPayout.actual_paid_amount) : 'N/A'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {getStatusTag(selectedPayout.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Payout ID (Razorpay)">
              {selectedPayout.payout_id ? <Text copyable>{selectedPayout.payout_id}</Text> : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="UTR">
              {selectedPayout.utr ? <Text copyable>{selectedPayout.utr}</Text> : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Retry Count">
              <Tag color={selectedPayout.retry_count > 0 ? 'orange' : 'blue'}>
                {selectedPayout.retry_count}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              <Space>
                <CalendarOutlined />
                <Text>{dayjs(selectedPayout.entry_created_at).format('MMMM D, YYYY h:mm:ss A')}</Text>
              </Space>
            </Descriptions.Item>
            
            {/* New fields added here */}
            <Descriptions.Item label="Payout Created At">
              {selectedPayout.payout_created_at ? (
                <Space>
                  <CalendarOutlined />
                  <Text>{dayjs(selectedPayout.payout_created_at).format('MMMM D, YYYY h:mm:ss A')}</Text>
                </Space>
              ) : 'N/A'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Retry At">
              {selectedPayout.retry_at ? (
                <Space>
                  <CalendarOutlined />
                  <Text>{dayjs(selectedPayout.retry_at).format('MMMM D, YYYY h:mm:ss A')}</Text>
                </Space>
              ) : 'N/A'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Failure Reason">
              {selectedPayout.failure_reason ? selectedPayout.failure_reason
              : 'N/A'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Payout Status History">
              {selectedPayout.payout_status_history ? (
                renderJsonData(selectedPayout.payout_status_history, "View Status History")
              ) : 'N/A'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Retry Details">
              {selectedPayout.retry_details ? (
                renderJsonData(selectedPayout.retry_details, "View Retry Details")
              ) : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Modal>
    );
  };

const PayoutActionModal = () => {
  // Move hooks to the top level
  const inputRef = useRef(null);
  const [localCustomAmount, setLocalCustomAmount] = useState(
    selectedPayout ? selectedPayout.expected_amount : 0
  );
  const [localUseCustomAmount, setLocalUseCustomAmount] = useState(false);

  // Focus the input when custom amount is selected
  useEffect(() => {
    if (localUseCustomAmount && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [localUseCustomAmount]);

  // Now check for selectedPayout at the end, after all hooks
  if (!selectedPayout) return null;

  const handleProcess = () => {
    handleProcessPayout(
      selectedPayout.id, 
      localUseCustomAmount ? localCustomAmount : null
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <DollarOutlined className="mr-2 text-blue-500" />
          Process Payout
        </div>
      }
      open={payoutModalVisible}
      onCancel={() => {
        setPayoutModalVisible(false);
        setLocalUseCustomAmount(false);
        setLocalCustomAmount(selectedPayout.expected_amount);
      }}
      afterClose={() => {
        setLocalUseCustomAmount(false);
        setLocalCustomAmount(selectedPayout.expected_amount);
      }}
      footer={[
        <Button key="cancel" onClick={() => setPayoutModalVisible(false)}>
          Cancel
        </Button>,
        <Button 
          key="process" 
          type="primary" 
          loading={processing}
          onClick={handleProcess}
        >
          Process Payout
        </Button>
      ]}
      width={500}
      destroyOnClose={false}
    >
      <Alert
        message="Important"
        description="Please verify all details before processing the payout. This action cannot be undone."
        type="warning"
        showIcon
        className="mb-4"
      />
        
        <div className="mb-4">
          <Text strong>Payout Details:</Text>
          <div className="mt-2 space-y-1">
            <div>Idempotency Key: <Text copyable>{selectedPayout.id}</Text></div>
            <div>Vendor Fund Account: <Text copyable>{selectedPayout.razorpay_fund_account_id}</Text></div>
            <div>Expected Amount: <Text strong>{formatCurrency(selectedPayout.expected_amount)}</Text></div>
          </div>
        </div>

        <div className="mb-4">
        <Text strong>Payout Options:</Text>
        <div className="mt-2 space-y-2">
          <div>
            <Button
              type={!localUseCustomAmount ? 'primary' : 'default'}
              block
              onClick={() => setLocalUseCustomAmount(false)}
            >
              Use Expected Amount: {formatCurrency(selectedPayout.expected_amount)}
            </Button>
          </div>
          <div>
            <Button
              type={localUseCustomAmount ? 'primary' : 'default'}
              block
              onClick={() => setLocalUseCustomAmount(true)}
            >
              Use Custom Amount
            </Button>
          </div>
        </div>
      </div>

      {localUseCustomAmount && (
        <div className="mb-4">
          <Text strong>Custom Amount (INR):</Text>
          <InputNumber
            ref={inputRef}
            min={0.01}
            value={localCustomAmount}
            onChange={setLocalCustomAmount}
            style={{ width: '100%' }}
            className="mt-2"
            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/₹\s?|(,*)/g, '')}
            onPressEnter={handleProcess}
            precision={2}
            step={0.01}
            decimalSeparator="."
          />
          <Text type="secondary" className="text-xs">
            Enter the amount to be paid
          </Text>
          <div className="mt-1">
            <Alert
              message="Warning"
              description="You are entering a custom amount. Please ensure this amount is correct before processing."
              type="warning"
              showIcon
              size="small"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

  const columns = [
    {
      title: 'Idempotency Key',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id) => <Text copyable>{id}</Text>
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 120,
      render: (id) => (
        <Button 
          type="link" 
          onClick={() => router.push(`/admin/orders/${id}`)}
          icon={<ShoppingOutlined />}
          className="p-0"
        >
          {id.substring(0, 8)}...
        </Button>
      )
    },
    {
      title: 'Vendor ID',
      dataIndex: 'vendorId',
      key: 'vendorId',
      width: 120,
      render: (id) => (
        <Button 
          type="link" 
          onClick={() => router.push(`/admin/vendors/${id}`)}
          icon={<UserOutlined />}
          className="p-0"
        >
          {id.substring(0, 8)}...
        </Button>
      )
    },
    {
      title: 'Fund Account',
      dataIndex: 'razorpay_fund_account_id',
      key: 'razorpay_fund_account_id',
      width: 150,
      render: (id) => <Text copyable>{id}</Text>
    },
    {
      title: 'Expected Amount',
      dataIndex: 'expected_amount',
      key: 'expected_amount',
      width: 120,
      render: (amount) => (
        <Text strong className="text-green-600">
          {formatCurrency(amount)}
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Retries',
      dataIndex: 'retry_count',
      key: 'retry_count',
      width: 80,
      render: (count) => (
        <Tag color={count > 0 ? 'orange' : 'blue'}>
          {count}
        </Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'entry_created_at',
      key: 'entry_created_at',
      width: 120,
      render: (date) => (
        <Text className="text-xs">
          {dayjs(date).format('MMM D, YYYY, h:mm A')}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record)}
          >
            Details
          </Button>
          
          {record.status === 'action_required' && (
            <>
              <Button 
                type="primary" 
                size="small" 
                icon={<DollarOutlined />}
                onClick={() => handleInitiatePayout(record)}
              >
                Payout
              </Button>
              <Button 
                type="default" 
                size="small" 
                icon={<RetweetOutlined />}
                onClick={() => handleRetryPayout(record.id)}
              >
                Retry
              </Button>
            </>
          )}
          
          {record.status === 'failed' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<RetweetOutlined />}
              onClick={() => handleRetryPayout(record.id)}
            >
              Retry
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 w-full">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <Title level={2} className="flex items-center mb-2">
              <DollarOutlined className="mr-3 text-green-600" />
              Payouts Management
            </Title>
            <Text type="secondary" className="text-lg">
              Manage vendor payouts and monitor transaction status
            </Text>
          </div>
          
          <Space className="mt-4 lg:mt-0">
            <Button 
              icon={<ReloadOutlined />} 
              size="large"
              onClick={() => fetchPayouts(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={8} md={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Total Payouts (processed)"
                value={stats.processedPayoutCount}
                valueStyle={{ color: '#1890ff' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Pending Payouts (action_required)"
                value={stats.pendingPayoutCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Total Amount (processed)"
                value={stats.processedPayoutAmount}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
                prefix="₹"
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Pending Amount (action_required)"
                value={stats.pendingPayoutAmount}
                precision={2}
                valueStyle={{ color: '#ff4d4f' }}
                prefix="₹"
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Filtered Payouts"
                value={stats.filteredCount}
                valueStyle={{ color: '#722ed1' }}
                prefix={<FilterOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Filtered Expected Amount"
                value={stats.filteredExpectedAmount}
                precision={2}
                valueStyle={{ color: '#eb2f96' }}
                prefix="₹"
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Filtered Actual Paid Amount"
                value={stats.filteredActualPaidAmount}
                precision={2}
                valueStyle={{ color: '#eb2f96' }}
                prefix="₹"
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6 rounded-xl shadow-sm border-0 bg-white w-full">
          <Title level={5} className="mb-4 flex items-center">
            <FilterOutlined className="mr-2" />
            Filter Payouts
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Input
                placeholder="Idempotency Key"
                value={filters.id}
                onChange={(e) => handleFilterChange('id', e.target.value)}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Input
                placeholder="Order ID"
                value={filters.orderId}
                onChange={(e) => handleFilterChange('orderId', e.target.value)}
                prefix={<ShoppingOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Input
                placeholder="Vendor ID"
                value={filters.vendorId}
                onChange={(e) => handleFilterChange('vendorId', e.target.value)}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Input
                placeholder="UTR"
                value={filters.utr}
                onChange={(e) => handleFilterChange('utr', e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Input
                placeholder="Payout ID (Razorpay)"
                value={filters.payoutId}
                onChange={(e) => handleFilterChange('payoutId', e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                className="w-full"
                placeholder="Status"
              >
                <Option value="all">All Status</Option>
                <Option value="action_required">Action Required</Option>
                <Option value="queued">Queued</Option>
                <Option value="processing">Processing</Option>
                <Option value="processed">Processed</Option>
                <Option value="cancelled">Cancelled</Option>
                <Option value="failed">Failed</Option>
                <Option value="reversed">Reversed</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                value={filters.retryCount}
                onChange={(value) => handleFilterChange('retryCount', value)}
                className="w-full"
                placeholder="Retry Count"
              >
                <Option value="all">All</Option>
                <Option value="has_retries">Has Retries</Option>
                <Option value="no_retries">No Retries</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <RangePicker
                value={filters.dateRange}
                onChange={(value) => handleFilterChange('dateRange', value)}
                className="w-full"
                placeholder={['Start Date', 'End Date']}
              />
            </Col>
          </Row>
          
          <div className="flex justify-end mt-4">
            <Space>
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

        {/* Payouts Table */}
        <Card 
          className="rounded-xl shadow-sm border-0 w-full"
          bodyStyle={{ padding: 0 }}
        >
          <div className="p-4 border-b">
            <Space className="flex justify-between w-full">
              <Title level={5} className="m-0 flex items-center">
                <DollarOutlined className="mr-2" />
                Payout Transactions
              </Title>
              <Text type="secondary">
                Showing {pagination.total} records
              </Text>
            </Space>
          </div>
          
          <Table
            columns={columns}
            dataSource={payouts}
            rowKey="id"
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 1500 }}
            size="middle"
            className="rounded-b-xl"
          />
        </Card>

        {/* Details Modal */}
        <PayoutDetailsModal />
        
        {/* Payout Action Modal */}
        <PayoutActionModal />
      </div>
    </div>
  );
}