'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Row, Col, Table, Typography, Button, DatePicker,
  Select, Space, Tag, Avatar, Divider, message, Modal, Form, Input,
  Descriptions, Progress, Statistic, Tooltip, Badge, Popconfirm, Pagination
} from 'antd';
import {
  WarningOutlined, SearchOutlined, FilterOutlined, ReloadOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  CloseCircleOutlined, UserOutlined, MailOutlined, PhoneOutlined,
  ShoppingOutlined, FileTextOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined, SolutionOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from "@/app/lib/api/axios";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

export default function ComplaintsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  
  // Add state for applied filters
  const [appliedDateRange, setAppliedDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
  const [appliedSearchText, setAppliedSearchText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
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

  // Remove dependencies from useCallback
  const fetchComplaints = useCallback(async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const params = {
        from: appliedDateRange[0].toISOString(),
        to: appliedDateRange[1].toISOString(),
        status: appliedStatusFilter !== 'all' ? appliedStatusFilter : undefined,
        search: appliedSearchText || undefined,
        page,
        limit: pageSize
      };

      const res = await api.get("/api/admin/getComplaints", 
        { 
            params: {
                ...params
            }
        }
      );

      const { complaints: complaintData, totalCount } = res.data.data.data;
      setComplaints(complaintData);
      
      // Update pagination
      setPagination({
        current: page,
        pageSize: pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount
      });
      
      // Calculate stats
      const resolved = complaintData.filter(c => c.isResolved).length;
      const pending = totalCount - resolved;
      const recent = complaintData.filter(c => 
        dayjs(c.createdAt).isAfter(dayjs().subtract(7, 'days'))
      ).length;
      
      setStats({ total: totalCount, resolved, pending, recent });
    } catch (err) {
      console.error(err);
      message.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, [appliedDateRange, appliedStatusFilter, appliedSearchText]); // Use applied filters as dependencies

  useEffect(() => {
    fetchComplaints(1, pagination.pageSize);
  }, [fetchComplaints, pagination.pageSize]);

  const handleTableChange = (pagination) => {
    fetchComplaints(pagination.current, pagination.pageSize);
  };

  const applyFilters = () => {
    setAppliedDateRange(dateRange);
    setAppliedStatusFilter(statusFilter);
    setAppliedSearchText(searchText);
    fetchComplaints(1, pagination.pageSize);
  };

  const resetFilters = () => {
    const defaultDateRange = [dayjs().subtract(30, 'days'), dayjs()];
    setDateRange(defaultDateRange);
    setStatusFilter('all');
    setSearchText('');
    
    setAppliedDateRange(defaultDateRange);
    setAppliedStatusFilter('all');
    setAppliedSearchText('');
    
    fetchComplaints(1, pagination.pageSize);
  };

  const handleResolveComplaint = async (id, resolutionNotes) => {
    try {
      await api.patch(`/api/admin/resolveComplaint/${id}`, {
        resolutionNotes
      });
      message.success("Complaint marked as resolved");
      setResolveModalVisible(false);
      setDetailModalVisible(false);
      fetchComplaints(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error(err);
      message.error("Failed to resolve complaint");
    }
  };

  const exportComplaints = async () => {
    try {
      setExportLoading(true);
      const params = {
        from: appliedDateRange[0].toISOString(),
        to: appliedDateRange[1].toISOString(),
        status: appliedStatusFilter !== 'all' ? appliedStatusFilter : undefined,
        search: appliedSearchText || undefined,
        export: true
      };

      const res = await api.get("/api/admin/complaints/export", { 
        params,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complaints-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success("Complaints exported successfully");
    } catch (err) {
      console.error(err);
      message.error("Failed to export complaints");
    } finally {
      setExportLoading(false);
    }
  };

  const viewComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setDetailModalVisible(true);
  };

  const handleOrderClick = (orderId, e) => {
    e.stopPropagation();
    if (orderId) {
      router.push(`/admin/orders/${orderId}`);
    }
  };

  const handleCustomerClick = (customerId, e) => {
    e.stopPropagation();
    if (customerId) {
      router.push(`/admin/customers/${customerId}`);
    }
  };

  const handleVendorClick = (vendorId, e) => {
    e.stopPropagation();
    if (vendorId) {
      router.push(`/admin/vendors/${vendorId}`);
    }
  };

  const columns = [
    {
      title: 'Complaint ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => <Text copyable>{id}</Text>
    },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (customerId, record) => ( customerId ? (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div
              className={customerId ? "text-blue-500 cursor-pointer hover:underline" : "text-gray-400"}
              onClick={(e) => handleCustomerClick(customerId, e)}
            >
              {record.name || 'Unknown Customer'}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      ) : null )
    },
    {
      title: 'Vendor',
      dataIndex: 'vendorId',
      key: 'vendorId',
      render: (vendorId, record) => (
        vendorId ? (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div
              className={vendorId ? "text-blue-500 cursor-pointer hover:underline" : "text-gray-400"}
              onClick={(e) => handleVendorClick(vendorId, e)}
            >
              {record.name || 'Unknown Vendor'}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      ): null)
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (phone) => <Text>{phone || 'N/A'}</Text>
    },
    {
      title: 'Complaint',
      dataIndex: 'complaint',
      key: 'complaint',
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text}</Tooltip>
    },
    {
      title: 'Order',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (orderId) => orderId ? 
        <Tag 
          icon={<ShoppingOutlined />} 
          color="blue"
          className="cursor-pointer hover:bg-blue-100"
          onClick={(e) => handleOrderClick(orderId, e)}
        >
          {orderId.substring(0, 8)}...
        </Tag> : 
        <Tag>N/A</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'isResolved',
      key: 'isResolved',
      render: (isResolved, record) => (
        <div>
          <Tag color={isResolved ? "green" : "orange"} icon={isResolved ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}>
            {isResolved ? "Resolved" : "Pending"}
          </Tag>
          {isResolved && record.resolvedAt && (
            <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
              {dayjs(record.resolvedAt).format('MMM D, YYYY')}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => viewComplaintDetails(record)}
            />
          </Tooltip>
          {!record.isResolved && (
            <Tooltip title="Mark as Resolved">
              <Button 
                size="small" 
                icon={<CheckCircleOutlined />} 
                onClick={() => {
                  setSelectedComplaint(record);
                  setResolveModalVisible(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <Title level={2} className="flex items-center mb-2">
              <WarningOutlined className="mr-3 text-orange-600" />
              Complaints Management
            </Title>
            <Text type="secondary" className="text-lg">
              Manage and resolve customer complaints
            </Text>
          </div>
          
          <Space className="mt-4 lg:mt-0">
            <Button 
              icon={<ReloadOutlined />} 
              size="large"
              onClick={() => fetchComplaints(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<FileTextOutlined />} 
              size="large"
              onClick={exportComplaints}
              loading={exportLoading}
            >
              Export
            </Button>
          </Space>
        </div>

        {/* Stats Overview */}
        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 rounded-xl shadow-md">
              <Statistic
                title="Total Complaints"
                value={stats.total}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
              <div className="mt-2">
                <Text type="secondary">Between {dayjs(dateRange[0]).format('MMM D, YYYY')} and {dayjs(dateRange[1]).format('MMM D, YYYY')}</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 rounded-xl shadow-md">
              <Statistic
                title="Resolved"
                value={stats.resolved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Progress 
                percent={stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0} 
                size="small" 
                status="active" 
                showInfo={false}
                strokeColor="#52c41a"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 rounded-xl shadow-md">
              <Statistic
                title="Pending Resolution"
                value={stats.pending}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
              <div className="mt-2">
                <Text type="secondary">Requires attention</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 rounded-xl shadow-md">
              <Statistic
                title="Recent Complaints"
                value={stats.recent}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div className="mt-2">
                <Text type="secondary">Last 7 days</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-8 rounded-xl shadow-sm border-0 bg-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Text strong className="flex items-center whitespace-nowrap">
              <FilterOutlined className="mr-2" />
              Filter Complaints:
            </Text>
            
            <Space direction="vertical" size="middle" className="w-full lg:w-auto">
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                size="large"
                className="w-full lg:w-auto"
              />
              
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                size="large"
                className="w-full lg:w-48"
              >
                <Option value="all">All Status</Option>
                <Option value="pending">Pending</Option>
                <Option value="resolved">Resolved</Option>
              </Select>

              <Input
                placeholder="Search complaints..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="large"
                className="w-full lg:w-64"
              />
            </Space>
            
            <div className="ml-auto flex gap-2">
              <Button 
                onClick={resetFilters}
              >
                Reset
              </Button>
              <Button 
                type="primary" 
                onClick={applyFilters}
                loading={loading}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Complaints Table */}
        <Card 
          title={`Complaints List (${pagination.total})`}
          className="rounded-xl shadow-sm border-0"
          extra={
            <Text type="secondary">
              Updated: {dayjs().format('MMM D, YYYY h:mm A')}
            </Text>
          }
        >
          <Table
            columns={columns}
            dataSource={complaints}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} complaints`
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
          />
        </Card>

        {/* Complaint Detail Modal */}
        <Modal
          title="Complaint Details"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              Close
            </Button>,
            !selectedComplaint?.isResolved && (
              <Button 
                key="resolve" 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={() => setResolveModalVisible(true)}
              >
                Mark as Resolved
              </Button>
            )
          ]}
          width={700}
        >
          {selectedComplaint && (
            <div>
              <Descriptions bordered column={1} className="mb-4">
                <Descriptions.Item label="Complaint ID">
                  <Text copyable>{selectedComplaint.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={selectedComplaint.isResolved ? "green" : "orange"}>
                    {selectedComplaint.isResolved ? "Resolved" : "Pending"}
                  </Tag>
                </Descriptions.Item>
                 { selectedComplaint.customerId && (
                <Descriptions.Item label="Customer">
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                      <div 
                        className={selectedComplaint.customerId ? "text-blue-500 cursor-pointer hover:underline" : ""}
                        onClick={() => selectedComplaint.customerId && router.push(`/admin/customers/${selectedComplaint.customerId}`)}
                      >
                        {selectedComplaint.name}
                      </div>
                      <div>
                        <MailOutlined /> {selectedComplaint.email}
                      </div>
                      {selectedComplaint.phoneNumber && (
                        <div>
                          <PhoneOutlined /> {selectedComplaint.phoneNumber}
                        </div>
                      )}
                    </div>
                  </Space>
                </Descriptions.Item>
          )}
                {selectedComplaint.vendorId && (
                  <Descriptions.Item label="Vendor">
                    <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                      <div 
                        className={selectedComplaint.vendorId ? "text-blue-500 cursor-pointer hover:underline" : ""}
                        onClick={() => selectedComplaint.vendorId && router.push(`/admin/vendors/${selectedComplaint.vendorId}`)}
                      >
                        {selectedComplaint.name}
                      </div>
                      <div>
                        <MailOutlined /> {selectedComplaint.email}
                      </div>
                      {selectedComplaint.phoneNumber && (
                        <div>
                          <PhoneOutlined /> {selectedComplaint.phoneNumber}
                        </div>
                      )}
                    </div>
                  </Space>
                  </Descriptions.Item>
                )}
                {selectedComplaint.orderId && (
                  <Descriptions.Item label="Order">
                    <Tag 
                      icon={<ShoppingOutlined />} 
                      color="blue"
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => router.push(`/admin/orders/${selectedComplaint.orderId}`)}
                    >
                      {selectedComplaint.orderId}
                    </Tag>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Date Submitted">
                  {dayjs(selectedComplaint.createdAt).format('MMM D, YYYY h:mm A')}
                </Descriptions.Item>
                
                {/* Resolution Details for Resolved Complaints */}
                {selectedComplaint.isResolved && (
                  <>
                    <Descriptions.Item label="Resolved At">
                      <Space>
                        <ClockCircleOutlined />
                        {selectedComplaint.resolvedAt ? 
                          dayjs(selectedComplaint.resolvedAt).format('MMM D, YYYY h:mm A') : 
                          'N/A'}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Resolution Notes">
                      <Card size="small" style={{ marginTop: '8px' }}>
                        <div className="flex items-start">
                          <SolutionOutlined style={{ color: '#52c41a', marginRight: '8px', marginTop: '4px' }} />
                          <Paragraph>
                            {selectedComplaint.resolutionNotes || 'No resolution notes provided.'}
                          </Paragraph>
                        </div>
                      </Card>
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>

              <Card title="Complaint Details" size="small">
                <Paragraph>
                  {selectedComplaint.complaint}
                </Paragraph>
              </Card>

              {selectedComplaint.customerId && (
                <div className="mt-4">
                  <Button 
                    type="link" 
                    icon={<UserOutlined />}
                    onClick={() => router.push(`/admin/customers/${selectedComplaint.customerId}`)}
                  >
                    View Customer Profile
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Resolve Complaint Modal */}
        <Modal
          title="Resolve Complaint"
          open={resolveModalVisible}
          onCancel={() => setResolveModalVisible(false)}
          footer={null}
        >
          {selectedComplaint && (
            <Form
              layout="vertical"
              onFinish={(values) => handleResolveComplaint(selectedComplaint.id, values.notes)}
            >
              <Form.Item
                name="notes"
                label="Resolution Notes"
                rules={[{ required: true, message: 'Please enter resolution notes' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Describe how this complaint was resolved. These notes will be visible to customers and other admins." 
                />
              </Form.Item>
              
              <div className="flex justify-end gap-2">
                <Button onClick={() => setResolveModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  Mark as Resolved
                </Button>
              </div>
            </Form>
          )}
        </Modal>
      </div>
    </div>
  );
}