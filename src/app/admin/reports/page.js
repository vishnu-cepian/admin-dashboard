'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, Row, Col, Statistic, Typography, Button, DatePicker,
  Select, Space, Progress, List, Tag, Avatar, Divider, message
} from 'antd';
import { 
  BarChartOutlined, WarningOutlined, HistoryOutlined, SafetyCertificateOutlined,
  DollarOutlined, UndoOutlined, CloseCircleOutlined, DatabaseOutlined,
  SendOutlined, EyeOutlined, DownloadOutlined, FilterOutlined, ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from "@/app/lib/api/axios";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ReportsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'days'), dayjs()]);
  const [reportType, setReportType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState([]);
  const [reportStats, setReportStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  const fetchReportStats = async () => {
    try {
      setLoading(true);
 
      const res = await api.get("/api/admin/reports",
        {
          params: {
            from: dateRange[0].toISOString(),
            to: dateRange[1].toISOString(),
            reportType
          }
        }
      );
      
      setReportStats(res.data.data.stats);
      setRecentActivities(res.data.data.recentActivities);
    } catch (err) {
      console.error(err);
      message.error("Failed to load report stats");
    } finally {
      setLoading(false);
    }
  };

const fetchHealth = async () => {
    try {
      const res = await api.get("/api/health");
      setHealth({
        status: res.data.status,
        uptime: (res.data.uptime / (1000 * 60 )).toFixed(2),
        systemCpuUsage: res.data.cpuUsage.system,
        userCpuUsage: res.data.cpuUsage.user,
        totalMem: (res.data.totalMem / (1024 * 1024)).toFixed(2),
        freeMem: (res.data.freeMem / (1024 * 1024)).toFixed(2)
      });
    } catch (err) {
      console.error(err);
      message.error("Failed to load health status");
    }
  };

  useEffect(() => {
    fetchReportStats();
    fetchHealth();
  }, [dateRange, reportType]);

//   const generateReport = () => {
//     message.loading("Generating report...");
//     // You might POST to backend with filters (dateRange, reportType)
//     setTimeout(() => {
//       message.success("Report generated successfully!");
//     }, 1500);
//   };

  const getStatusTag = (status) => {
    const statusConfig = {
      resolved: { color: 'green', text: 'Resolved' },
      success: { color: 'blue', text: 'Success' },
      warning: { color: 'orange', text: 'Warning' },
      processing: { color: 'gold', text: 'Processing' },
      error: { color: 'red', text: 'Error' }
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getIconByType = (type) => {
    const icons = {
      complaint: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      payment: <DollarOutlined style={{ color: '#52c41a' }} />,
      login: <SafetyCertificateOutlined style={{ color: '#1890ff' }} />,
      refund: <UndoOutlined style={{ color: '#faad14' }} />,
      failure: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    };
    return icons[type] || <BarChartOutlined />;
  };

  // Function to handle card clicks and navigate to respective pages
  const handleCardClick = (cardKey) => {
    const routes = {
      complaints: '/admin/reports/complaints',
      adminLogins: '/admin/reports/adminLogins',
      adminActions: '/admin/reports/adminActions',
      payments: '/admin/reports/payments',
      refunds: '/admin/reports/refunds',
      paymentFailures: '/admin/reports/paymentFailures',
      queueLogs: '/admin/reports/queueLogs',
      outboxFailures: '/admin/reports/outboxFailures'
    };

    const route = routes[cardKey];
    if (route) {
      router.push(route);
    }
  };

  const reportCards = reportStats ? [
    {
      key: 'complaints', 
      title: 'Complaints', 
      value: reportStats.complaints,
      icon: <WarningOutlined />, 
      color: '#ff4d4f', 
      description: 'User complaints and issues',
      route: '/admin/reports/complaints'
    },
    {
      key: 'adminLogins', 
      title: 'Admin Logins', 
      value: reportStats.adminLogins,
      icon: <HistoryOutlined />, 
      color: '#1890ff', 
      description: 'Admin login history',
      route: '/admin/reports/adminLogins'
    },
    {
      key: 'adminActions', 
      title: 'Admin Actions', 
      value: reportStats.adminActions,
      icon: <SafetyCertificateOutlined />, 
      color: '#52c41a', 
      description: 'Admin activity history',
      route: '/admin/reports/adminActions'
    },
    {
      key: 'payments', 
      title: 'Payments', 
      value: reportStats.payments,
      icon: <DollarOutlined />, 
      color: '#722ed1', 
      description: 'Payment transactions',
      route: '/admin/reports/payments'
    },
    {
      key: 'refunds', 
      title: 'Refunds', 
      value: reportStats.refunds,
      icon: <UndoOutlined />, 
      color: '#faad14', 
      description: 'Refund processing',
      route: '/admin/reports/refunds'
    },
    {
      key: 'paymentFailures', 
      title: 'Payment Failures', 
      value: reportStats.paymentFailures,
      icon: <CloseCircleOutlined />, 
      color: '#ff4d4f', 
      description: 'Failed payment attempts',
      route: '/admin/reports/paymentFailures'
    },
    {
      key: 'queueLogs', 
      title: 'Queue Logs', 
      value: reportStats.queueLogs,
      icon: <DatabaseOutlined />, 
      color: '#13c2c2', 
      description: 'System queue monitoring',
      route: '/admin/reports/queueLogs'
    },
    {
      key: 'outboxFailures', 
      title: 'Outbox Failures', 
      value: reportStats.outboxFailures,
      icon: <SendOutlined />, 
      color: '#eb2f96', 
      description: 'Failed outgoing messages',
      route: '/admin/reports/outboxFailures'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <Title level={2} className="flex items-center mb-2">
              <BarChartOutlined className="mr-3 text-blue-600" />
              Reports Dashboard
            </Title>
            <Text type="secondary" className="text-lg">
              Monitor system activities and generate detailed reports
            </Text>
          </div>
          
          <Space className="mt-4 lg:mt-0">
            <Button 
              icon={<ReloadOutlined />} 
              size="large"
              onClick={() => { fetchReportStats(); }}
              loading={loading}
            >
              Refresh Data
            </Button>
            {/* <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              size="large"
              onClick={generateReport}
              loading={loading}
            >
              Generate Report
            </Button> */}
          </Space>
        </div>

        {/* Filters */}
        <Card className="mb-8 rounded-xl shadow-sm border-0 bg-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Text strong className="flex items-center whitespace-nowrap">
              <FilterOutlined className="mr-2" />
              Filter Reports:
            </Text>
            
            <Space direction="vertical" size="middle" className="w-full lg:w-auto">
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                size="large"
                className="w-full lg:w-auto"
              />
              
              <Select
                value={reportType}
                onChange={setReportType}
                size="large"
                className="w-full lg:w-48"
              >
                <Option value="all">All Reports</Option>
                <Option value="complaints">Complaints</Option>
                <Option value="security">Security Logs</Option>
                <Option value="financial">Financial Reports</Option>
                <Option value="system">System Logs</Option>
              </Select>
            </Space>
            
            <div className="ml-auto">
              <Text type="secondary">
                Showing data from {dateRange[0].format('MMM D, YYYY')} to {dateRange[1].format('MMM D, YYYY')}
              </Text>
            </div>
          </div>
        </Card>

        {/* Stats Overview */}
        <Row gutter={[24, 24]} className="mb-8">
          {reportCards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.key}>
              <Card 
                className="h-full border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                bodyStyle={{ padding: '20px' }}
                onClick={() => handleCardClick(card.key)}
                hoverable
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl`} style={{ backgroundColor: `${card.color}15` }}>
                    {React.cloneElement(card.icon, { 
                      style: { ...card.icon.props.style, fontSize: '24px', color: card.color } 
                    })}
                  </div>
                  <Tag color={card.color}>{card.value}</Tag>
                </div>
                
                <Statistic
                  title={card.title}
                  value={card.value}
                  valueStyle={{ color: card.color, fontSize: '28px', fontWeight: 'bold' }}
                />
                
                <Text type="secondary" className="text-sm mt-2 block">
                  {card.description}
                </Text>
                
                <Progress
                  percent={Math.min((card.value / 1500) * 100, 100)}
                  showInfo={false}
                  strokeColor={card.color}
                  className="mt-4"
                />
                
                <div className="mt-4 text-right">
                  <Text type="secondary" className="text-xs">
                    Click to view details →
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Recent Activities */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card 
              title={
                <span className="flex items-center">
                  <HistoryOutlined className="mr-2" />
                  Recent Activities
                </span>
              }
              className="rounded-xl shadow-sm border-0 h-full"
            //   extra={
            //     <Button 
            //       type="link" 
            //       icon={<EyeOutlined />}
            //       onClick={() => router.push('/admin/activities')}
            //     >
            //       View All
            //     </Button>
            //   }
            >
              <List
                itemLayout="horizontal"
                dataSource={recentActivities}
                renderItem={(item) => (
                  <List.Item
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      // Navigate to appropriate detail page based on activity type
                      if (item.type === 'complaint') {
                        router.push('/admin/reports/complaints');
                      } else if (item.type === 'payment') {
                        router.push('/admin/reports/payments');
                      }
                      // Add more conditions for other activity types
                    }}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={getIconByType(item.type)} />}
                      title={
                        <div className="flex justify-between items-center">
                          <Text>{item.action}</Text>
                          {getStatusTag(item.status)}
                        </div>
                      }
                      description={
                        <Text type="secondary" className="text-sm">
                          {item.time}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* Right Sidebar */}
          <Col xs={24} lg={8}>
            {/* <Card title="Quick Actions" className="rounded-xl shadow-sm border-0 mb-6">
              <Space direction="vertical" className="w-full"> */}
                {/* <Button 
                  block 
                  icon={<DownloadOutlined />} 
                  size="large"
                  onClick={() => router.push('/admin/data-export')}
                >
                  Export All Data
                </Button> */}
                {/* <Button 
                  block 
                  icon={<DatabaseOutlined />} 
                  size="large"
                  onClick={() => router.push('/admin/backup')}
                >
                  Database Backup
                </Button> */}
                {/* <Button 
                  block 
                  icon={<WarningOutlined />} 
                  size="large"
                  onClick={() => router.push('/admin/system-health')}
                >
                  System Health Check
                </Button> */}
                {/* <Button 
                  block 
                  icon={<BarChartOutlined />} 
                  size="large"
                  onClick={() => router.push('/admin/analytics')}
                >
                  Analytics Dashboard
                </Button> */}
              {/* </Space>
            </Card> */}

            <Card 
              title="System Status" 
              className="rounded-xl shadow-sm border-0"
            //   extra={
            //     <Button 
            //       type="link" 
            //       size="small"
            //       onClick={() => router.push('/admin/system-status')}
            //     >
            //       Details
            //     </Button>
            //   }
            >
              <Space direction="vertical" className="w-full">
                <div className="flex justify-between items-center">
                  <Text>Server Status</Text>
                  <Tag color="green">{health.status ? health.status : 'N/A'}</Tag>
                </div>
                <Divider className="my-3" />
                <div className="flex justify-between items-center">
                  <Text>Server Uptime</Text>
                  <Tag color="blue">{health.uptime ? health.uptime : 'N/A'} Mins</Tag>
                </div>
                <Divider className="my-3" />
                <div className="flex justify-between items-center">
                  <Text>System Cpu Usage</Text>
                  <Tag color="orange">{health.systemCpuUsage ? health.systemCpuUsage : 'N/A'}</Tag>
                  <Text>User Cpu Usage</Text>
                  <Tag color="orange">{health.userCpuUsage ? health.userCpuUsage : 'N/A'}</Tag>
                </div>
                <Divider className="my-3" />
                <div className="flex justify-between items-center">
                  <Text>RAM (totalMem)</Text>
                  <Tag color="purple">{health.totalMem ? health.totalMem : 'N/A'} Mb</Tag>
                  <Text>RAM (freeMem)</Text>
                  <Tag color="purple">{health.freeMem ? health.freeMem : 'N/A'} Mb</Tag>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}