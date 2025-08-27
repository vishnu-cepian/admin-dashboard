'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
  ExclamationCircleOutlined, DatabaseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from "@/app/lib/api/axios";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function QueueLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [queueLogs, setQueueLogs] = useState([]);
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
    queueName: ''
  });
  const [selectedQueueLog, setSelectedQueueLog] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [queueNames, setQueueNames] = useState([]);

  const fetchQueueLogs = useCallback(async (page = 1, pageSize = 10) => {
  try {
    setLoading(true);
    
    const params = {
      page,
      limit: pageSize,
      queueName: filters.queueName || undefined
    };
    
    // Add date range if provided
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      params.from = filters.dateRange[0].toISOString();
      params.to = filters.dateRange[1].toISOString();
    }
    
    const res = await api.get("/api/admin/getQueueLogs", { params });
    
    setQueueLogs(res.data.data.queueLogs);
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

    // Extract unique queue names for filter dropdown
    setQueueNames(['emailQueue', 'pushQueue', 'phoneQueue']);
  } catch (err) {
    console.error(err);
    message.error("Failed to load queue logs");
  } finally {
    setLoading(false);
  }
}, [filters]); // Add filters as dependency

useEffect(() => {
  fetchQueueLogs();
}, [fetchQueueLogs]); // Add fetchQueueLogs as dependency

  const handleTableChange = (newPagination, filters, sorter) => {
    fetchQueueLogs(newPagination.current, newPagination.pageSize);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchQueueLogs(1, pagination.pageSize);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: null,
      queueName: ''
    });
    setTimeout(() => fetchQueueLogs(1, pagination.pageSize), 0);
  };

  const exportQueueLogs = async () => {
    try {
      message.loading('Preparing export...');
      
      const params = {
        queueName: filters.queueName || undefined,
        export: true
      };
      
      // Add date range if provided
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        params.from = filters.dateRange[0].toISOString();
        params.to = filters.dateRange[1].toISOString();
      }
      
      const res = await api.get("/api/admin/getQueueLogs", { 
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `queue-logs-export-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Export downloaded successfully');
    } catch (err) {
      console.error(err);
      message.error("Failed to export queue logs");
    }
  };

  const getReasonTag = (reason) => {
    if (!reason) return null;
    
    const reasonConfig = {
      'failed': { color: 'red', text: 'Failed' },
      'timeout': { color: 'orange', text: 'Timeout' },
      'exception': { color: 'purple', text: 'Exception' },
      'max_attempts': { color: 'magenta', text: 'Max Attempts' },
      'dependency_failed': { color: 'volcano', text: 'Dependency Failed' }
    };
    const config = reasonConfig[reason] || { color: 'default', text: reason };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleViewDetails = (record) => {
    setSelectedQueueLog(record);
    setModalVisible(true);
  };

  const QueueLogDetailsModal = () => {
    if (!selectedQueueLog) return null;

    return (
      <Modal
        title={
          <div className="flex items-center">
            <DatabaseOutlined className="mr-2 text-blue-500" />
            Queue Log Details
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
          <Descriptions.Item label="Log ID">
            <Text copyable>{selectedQueueLog.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Queue Name">
            <Tag color="blue">{selectedQueueLog.queueName}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Job ID">
            <Text copyable>{selectedQueueLog.jobId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Reason">
            {getReasonTag(selectedQueueLog.reason)}
          </Descriptions.Item>
          <Descriptions.Item label="Failed At">
            {dayjs(selectedQueueLog.failedAt).format('MMMM D, YYYY h:mm:ss A')}
          </Descriptions.Item>
          <Descriptions.Item label="Job Data">
            <div className="max-h-40 overflow-auto">
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(selectedQueueLog.jobData, null, 2)}
              </pre>
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    );
  };

  const columns = [
    {
      title: 'Log ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id) => <Text copyable>{id}</Text>
    },
    {
      title: 'Queue Name',
      dataIndex: 'queueName',
      key: 'queueName',
      width: 150,
      render: (name) => <Tag color="blue">{name}</Tag>
    },
    {
      title: 'Job ID',
      dataIndex: 'jobId',
      key: 'jobId',
      width: 150,
      render: (id) => <Text copyable>{id}</Text>
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      render: (reason) => getReasonTag(reason)
    },
    {
      title: 'Failed At',
      dataIndex: 'failedAt',
      key: 'failedAt',
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

  // Calculate statistics for queue name distribution
  const queueDistribution = queueLogs.reduce((acc, log) => {
    acc[log.queueName] = (acc[log.queueName] || 0) + 1;
    return acc;
  }, {});

  // Calculate statistics for reason distribution
  const reasonDistribution = queueLogs.reduce((acc, log) => {
    acc[log.reason] = (acc[log.reason] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <Title level={2} className="flex items-center mb-2">
              <DatabaseOutlined className="mr-3 text-blue-600" />
              Queue Logs Management
            </Title>
            <Text type="secondary" className="text-lg">
              View and monitor all failed queue jobs
            </Text>
          </div>
          
          <Space className="mt-4 lg:mt-0">
            <Button 
              icon={<ReloadOutlined />} 
              size="large"
              onClick={() => fetchQueueLogs(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              size="large"
              onClick={exportQueueLogs}
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
                title="Total Failed Jobs"
                value={stats.totalCount}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Filtered Jobs"
                value={stats.filteredCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<FilterOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Unique Queues"
                value={Object.keys(queueDistribution).length}
                valueStyle={{ color: '#1890ff' }}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="border-0 rounded-xl shadow-sm" size="small">
              <Statistic
                title="Failure Reasons"
                value={Object.keys(reasonDistribution).length}
                valueStyle={{ color: '#52c41a' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Queue Distribution */}
        {queueLogs.length > 0 && (
          <>
            <Card className="mb-6 rounded-xl shadow-sm border-0">
              <Title level={5} className="mb-4">
                <InfoCircleOutlined className="mr-2" />
                Queue Distribution
              </Title>
              <Row gutter={[16, 16]}>
                {Object.entries(queueDistribution).map(([queueName, count]) => (
                  <Col xs={12} md={6} key={queueName}>
                    <div className="flex items-center justify-between mb-2">
                      <Tag color="blue">{queueName}</Tag>
                      <Text strong>{count}</Text>
                    </div>
                    <Progress 
                      percent={Math.round((count / queueLogs.length) * 100)} 
                      size="small" 
                      showInfo={false}
                      strokeColor="#1890ff"
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
                      percent={Math.round((count / queueLogs.length) * 100)} 
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
              Filter Queue Logs:
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
                value={filters.queueName}
                onChange={(value) => handleFilterChange('queueName', value)}
                size="large"
                className="w-full lg:w-64"
                placeholder="Select Queue Name"
                allowClear
                showSearch
              >
                <Option value="">All Queues</Option>
                {queueNames.map(name => (
                  <Option key={name} value={name}>{name}</Option>
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

        {/* Queue Logs Table */}
        <Card 
          title={
            <span className="flex items-center">
              <DatabaseOutlined className="mr-2" />
              Failed Queue Jobs
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
            dataSource={queueLogs}
            rowKey="id"
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="middle"
          />
        </Card>

        {/* Details Modal */}
        <QueueLogDetailsModal />
      </div>
    </div>
  );
}