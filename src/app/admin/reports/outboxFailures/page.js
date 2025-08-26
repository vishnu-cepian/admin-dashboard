'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Tag, Space, Button, Typography, DatePicker,
  Input, Tooltip, message, Modal, Descriptions, Row, Col,
  Statistic, Select, Progress, Dropdown
} from 'antd';
import {
  EyeOutlined, FilterOutlined, ReloadOutlined, DownloadOutlined,
  ClockCircleOutlined, UndoOutlined, FileTextOutlined,
  RocketOutlined, CommentOutlined, InfoCircleOutlined,
  ExclamationCircleOutlined, DatabaseOutlined, SendOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from "@/app/lib/api/axios";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function OutboxFailuresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [outboxFailures, setOutboxFailures] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
  });
  const [stats, setStats] = useState({
    totalCount: 0,
    filteredCount: 0
  });
  const [filters, setFilters] = useState({
    dateRange: null,
    eventType: ''
  });
  const [selectedOutboxFailure, setSelectedOutboxFailure] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventTypes, setEventTypes] = useState([]);

  const fetchOutboxFailures = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: pageSize,
        status: 'FAILED', // Only show FAILED status
        eventType: filters.eventType || undefined
      };
      
      // Add date range if provided
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.from = filters.dateRange[0].toISOString();
        params.to = filters.dateRange[1].toISOString();
      }
      
      const res = await api.get("/api/admin/getOutboxFailures", { params });
      
      setOutboxFailures(res.data.data.outboxFailures);
      setPagination(prev => ({
        ...prev,
        current: res.data.data.pagination.currentPage,
        pageSize: res.data.data.pagination.itemsPerPage,
        total: res.data.data.pagination.totalItems
      }));
      
      // Set statistics
      setStats({
        totalCount: res.data.data.totalCount || 0,
        filteredCount: res.data.data.filteredCount || 0
      });

      // Extract unique event types for filter dropdown
    //   if (res.data.data.outboxFailures && res.data.data.outboxFailures.length > 0) {
    //     const uniqueEventTypes = [...new Set(res.data.data.outboxFailures.map(item => item.eventType))];
        setEventTypes(['INITIATE_PICKUP', 'SEND_ITEM_DELIVERY']);
    //   }
    } catch (err) {
      console.error(err);
      message.error("Failed to load outbox failures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutboxFailures();
  }, []);

  const handleTableChange = (newPagination, filters, sorter) => {
    fetchOutboxFailures(newPagination.current, newPagination.pageSize);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchOutboxFailures(1, pagination.pageSize);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: null,
      eventType: ''
    });
    setTimeout(() => fetchOutboxFailures(1, pagination.pageSize), 0);
  };

  const exportOutboxFailures = async () => {
    try {
      message.loading('Preparing export...');
      
      const params = {
        status: 'FAILED',
        eventType: filters.eventType || undefined,
        export: true
      };
      
      // Add date range if provided
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.from = filters.dateRange[0].toISOString();
        params.to = filters.dateRange[1].toISOString();
      }
      
      const res = await api.get("/api/admin/getOutboxFailures", { 
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `outbox-failures-export-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Export downloaded successfully');
    } catch (err) {
      console.error(err);
      message.error("Failed to export outbox failures");
    }
  };

  const getEventTypeTag = (eventType) => {
    if (!eventType) return null;
    
    // Color coding based on event type
    const eventTypeConfig = {
      'ORDER_CREATED': { color: 'green', text: 'Order Created' },
      'ORDER_UPDATED': { color: 'blue', text: 'Order Updated' },
      'PAYMENT_PROCESSED': { color: 'purple', text: 'Payment Processed' },
      'USER_REGISTERED': { color: 'cyan', text: 'User Registered' },
      'NOTIFICATION_SENT': { color: 'orange', text: 'Notification Sent' }
    };
    
    const config = eventTypeConfig[eventType] || { color: 'default', text: eventType };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleViewDetails = (record) => {
    setSelectedOutboxFailure(record);
    setModalVisible(true);
  };

  const OutboxFailureDetailsModal = () => {
    if (!selectedOutboxFailure) return null;

    return (
      <Modal
        title={
          <div className="flex items-center">
            <SendOutlined className="mr-2 text-red-500" />
            Outbox Failure Details
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
          <Descriptions.Item label="Message ID">
            <Text copyable>{selectedOutboxFailure.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Event Type">
            {getEventTypeTag(selectedOutboxFailure.eventType)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="red">FAILED</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Failure Reason">
            {selectedOutboxFailure.failureReason || 'No reason provided'}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {dayjs(selectedOutboxFailure.createdAt).format('MMMM D, YYYY h:mm:ss A')}
          </Descriptions.Item>
          <Descriptions.Item label="Status Updated At">
            {selectedOutboxFailure.statusUpdatedAt 
              ? dayjs(selectedOutboxFailure.statusUpdatedAt).format('MMMM D, YYYY h:mm:ss A')
              : 'N/A'
            }
          </Descriptions.Item>
          <Descriptions.Item label="Payload">
            <div className="max-h-40 overflow-auto">
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(selectedOutboxFailure.payload, null, 2)}
              </pre>
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    );
  };

  const columns = [
    {
      title: 'Message ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id) => <Text copyable>{id}</Text>
    },
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      key: 'eventType',
      width: 150,
      render: (eventType) => getEventTypeTag(eventType)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: () => <Tag color="red">FAILED</Tag>
    },
    {
      title: 'Failure Reason',
      dataIndex: 'failureReason',
      key: 'failureReason',
      width: 200,
      ellipsis: true,
      render: (reason) => reason || 'No reason provided'
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: true,
      render: (date) => (
        <Space size="small">
          <ClockCircleOutlined />
          <Text>{dayjs(date).format('MMM D, YYYY h:mm A')}</Text>
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

  // Calculate statistics for event type distribution
  const eventTypeDistribution = outboxFailures.reduce((acc, item) => {
    acc[item.eventType] = (acc[item.eventType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <Title level={2} className="flex items-center mb-2">
              <SendOutlined className="mr-3 text-red-600" />
              Outbox Failures Management
            </Title>
            <Text type="secondary" className="text-lg">
              View and monitor all failed outbox messages
            </Text>
          </div>
          
          <Space className="mt-4 lg:mt-0">
            <Button 
              icon={<ReloadOutlined />} 
              size="large"
              onClick={() => fetchOutboxFailures(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              size="large"
              onClick={exportOutboxFailures}
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
                title="Total Failed Messages"
                value={stats.totalCount}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Filtered Messages"
                value={stats.filteredCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<FilterOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Unique Event Types"
                value={Object.keys(eventTypeDistribution).length}
                valueStyle={{ color: '#1890ff' }}
                prefix={<SendOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="View Only"
                value="Read-Only"
                valueStyle={{ color: '#52c41a' }}
                prefix={<EyeOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Event Type Distribution */}
        {outboxFailures.length > 0 && (
          <Card className="mb-6 rounded-xl shadow-sm border-0">
            <Title level={5} className="mb-4">
              <InfoCircleOutlined className="mr-2" />
              Event Type Distribution
            </Title>
            <Row gutter={[16, 16]}>
              {Object.entries(eventTypeDistribution).map(([eventType, count]) => (
                <Col xs={12} md={6} key={eventType}>
                  <div className="flex items-center justify-between mb-2">
                    {getEventTypeTag(eventType)}
                    <Text strong>{count}</Text>
                  </div>
                  <Progress 
                    percent={Math.round((count / outboxFailures.length) * 100)} 
                    size="small" 
                    showInfo={false}
                    strokeColor={getEventTypeTag(eventType).props.color}
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
              Filter Outbox Failures:
            </Text>
            
            <Space direction="vertical" size="middle" className="w-full lg:w-auto">
              <RangePicker
                value={filters.dateRange}
                onChange={(value) => handleFilterChange('dateRange', value)}
                size="large"
                className="w-full lg:w-auto"
                placeholder={['Start Date', 'End Date']}
              />
              
              <Select
                value={filters.eventType}
                onChange={(value) => handleFilterChange('eventType', value)}
                size="large"
                className="w-full lg:w-64"
                placeholder="Select Event Type"
                allowClear
                showSearch
              >
                <Option value="">All Event Types</Option>
                {eventTypes.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
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

        {/* Outbox Failures Table */}
        <Card 
          title={
            <span className="flex items-center">
              <SendOutlined className="mr-2" />
              Failed Outbox Messages
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
            dataSource={outboxFailures}
            rowKey="id"
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="middle"
          />
        </Card>

        {/* Details Modal */}
        <OutboxFailureDetailsModal />
      </div>
    </div>
  );
}