'use client';
import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Typography, Button, 
   Space, Tag, Avatar, message, Tooltip,
  Descriptions, Statistic, Modal
} from 'antd';
import {
  SecurityScanOutlined, ReloadOutlined,
  EyeOutlined, UserOutlined, GlobalOutlined, LoginOutlined,
  LogoutOutlined, HistoryOutlined, ClockCircleOutlined,
  DesktopOutlined, MobileOutlined, TabletOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from "@/app/lib/api/axios";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export default function AdminLoginHistoryPage() {
  const [loading, setLoading] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    recent: 0
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  const fetchLoginHistory = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize
      };

      const res = await api.get("/api/admin/loginHistory", { params });
      const { loginHistory: historyData, totalCount } = res.data.data;
      
      setLoginHistory(historyData);
      
      // Update pagination
      setPagination({
        current: page,
        pageSize: pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount
      });
      
      // Calculate stats
      const active = historyData.filter(record => !record.logoutTime).length;
      const recent = historyData.filter(record => 
        dayjs(record.loginTime).isAfter(dayjs().subtract(24, 'hours'))
      ).length;
      
      setStats({ total: totalCount, active, recent });
    } catch (err) {
      console.error(err);
      message.error("Failed to load login history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginHistory(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (pagination) => {
    fetchLoginHistory(pagination.current, pagination.pageSize);
  };

  const viewRecordDetails = (record) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <DesktopOutlined />;
    
    if (/mobile/i.test(userAgent)) {
      return <MobileOutlined />;
    } else if (/tablet/i.test(userAgent)) {
      return <TabletOutlined />;
    } else {
      return <DesktopOutlined />;
    }
  };

  const getStatusTag = (logoutTime) => {
    if (!logoutTime) {
      return <Tag color="green" icon={<LoginOutlined />}>Active Session</Tag>;
    } else {
      return <Tag color="blue" icon={<LogoutOutlined />}>Logged Out</Tag>;
    }
  };

  const getDuration = (loginTime, logoutTime) => {
    if (!logoutTime) return 'Still active';
    
    const duration = dayjs(logoutTime).diff(dayjs(loginTime), 'minute');
    
    if (duration < 60) {
      return `${duration} minutes`;
    } else if (duration < 1440) {
      return `${Math.floor(duration / 60)} hours ${duration % 60} minutes`;
    } else {
      return `${Math.floor(duration / 1440)} days ${Math.floor((duration % 1440) / 60)} hours`;
    }
  };

  const columns = [
    {
      title: 'Admin',
      dataIndex: 'adminEmail',
      key: 'adminEmail',
      render: (email, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{email}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.adminUserId ? `ID: ${record.adminUserId.substring(0, 8)}...` : 'N/A'}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Login Time',
      dataIndex: 'loginTime',
      key: 'loginTime',
      render: (time) => (
        <div>
          <div>{dayjs(time).format('MMM D, YYYY')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(time).format('h:mm A')}
          </Text>
        </div>
      )
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip) => (
        <Tag icon={<GlobalOutlined />} color="geekblue">
          {ip}
        </Tag>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record.logoutTime)
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => (
        <Text type="secondary">
          {getDuration(record.loginTime, record.logoutTime)}
        </Text>
      )
    },
    {
      title: 'Device',
      key: 'device',
      render: (_, record) => (
        <Tooltip title={record.userAgent || 'Unknown device'}>
          {getDeviceIcon(record.userAgent)}
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => viewRecordDetails(record)}
          />
        </Tooltip>
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
              <SecurityScanOutlined className="mr-3 text-blue-600" />
              Admin Login History
            </Title>
            <Text type="secondary" className="text-lg">
              Monitor administrator access and security events
            </Text>
          </div>
          
          <Space className="mt-4 lg:mt-0">
            <Button 
              icon={<ReloadOutlined />} 
              size="large"
              onClick={() => fetchLoginHistory(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Stats Overview */}
        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} sm={12} lg={8}>
            <Card className="border-0 rounded-xl shadow-md">
              <Statistic
                title="Total Logins"
                value={stats.total}
                prefix={<HistoryOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div className="mt-2">
                {/* <Text type="secondary">
                  Between {dayjs(dateRange[0]).format('MMM D, YYYY')} and {dayjs(dateRange[1]).format('MMM D, YYYY')}
                </Text> */}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="border-0 rounded-xl shadow-md">
              <Statistic
                title="Active Sessions"
                value={stats.active}
                prefix={<LoginOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div className="mt-2">
                <Text type="secondary">Currently logged in</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="border-0 rounded-xl shadow-md">
              <Statistic
                title="Recent Logins"
                value={stats.recent}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div className="mt-2">
                <Text type="secondary">Last 24 hours</Text>
              </div>
            </Card>
          </Col>
        </Row>

        

        {/* Login History Table */}
        <Card 
          title={`Login Records (${pagination.total})`}
          className="rounded-xl shadow-sm border-0"
          extra={
            <Text type="secondary">
              Updated: {dayjs().format('MMM D, YYYY h:mm A')}
            </Text>
          }
        >
          <Table
            columns={columns}
            dataSource={loginHistory}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} records`
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* Record Detail Modal */}
        <Modal
          title="Login Session Details"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              Close
            </Button>
          ]}
          width={700}
        >
          {selectedRecord && (
            <div>
              <Descriptions bordered column={1} className="mb-4">
                <Descriptions.Item label="Admin User">
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                      <div className="font-medium">{selectedRecord.adminEmail}</div>
                      <Text type="secondary">
                        ID: {selectedRecord.adminUserId}
                      </Text>
                    </div>
                  </Space>
                </Descriptions.Item>
                
                <Descriptions.Item label="IP Address">
                  <Tag icon={<GlobalOutlined />} color="geekblue" style={{ fontSize: '14px' }}>
                    {selectedRecord.ipAddress}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Login Time">
                  <Space>
                    <LoginOutlined />
                    {dayjs(selectedRecord.loginTime).format('MMM D, YYYY h:mm A')}
                  </Space>
                </Descriptions.Item>
                
                <Descriptions.Item label="Logout Time">
                  <Space>
                    <LogoutOutlined />
                    {selectedRecord.logoutTime ? 
                      dayjs(selectedRecord.logoutTime).format('MMM D, YYYY h:mm A') : 
                      'Still active'}
                  </Space>
                </Descriptions.Item>
                
                <Descriptions.Item label="Session Duration">
                  <Space>
                    <ClockCircleOutlined />
                    {getDuration(selectedRecord.loginTime, selectedRecord.logoutTime)}
                  </Space>
                </Descriptions.Item>
                
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedRecord.logoutTime)}
                </Descriptions.Item>
                
                {selectedRecord.userAgent && (
                  <Descriptions.Item label="Device Info">
                    <Text>
                      {selectedRecord.userAgent}
                    </Text>
                  </Descriptions.Item>
                )}
                
                {selectedRecord.location && (
                  <Descriptions.Item label="Approximate Location">
                    <Text>
                      {selectedRecord.location}
                    </Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}