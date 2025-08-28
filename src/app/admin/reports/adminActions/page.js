'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Table, Tag, Space, Button, Typography, Select, DatePicker,
   Avatar, Tooltip, message, Modal, Descriptions,
} from 'antd';
import {
  EyeOutlined, FilterOutlined, ReloadOutlined, UserOutlined,
  ClockCircleOutlined, CloseOutlined, CopyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from "@/app/lib/api/axios";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function AdminActionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [adminActions, setAdminActions] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    dateRange: [dayjs().subtract(30, 'days'), dayjs()],
    action: 'all',
  });
  const [selectedAction, setSelectedAction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Wrap fetchAdminActions in useCallback
  const fetchAdminActions = useCallback(async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/getAdminActions", {
        params: {
          page,
          limit: pageSize,
          from: filters.dateRange[0].toISOString(),
          to: filters.dateRange[1].toISOString(),
          action: filters.action !== 'all' ? filters.action : undefined,
        }
      });

      setAdminActions(res.data.data.adminActions);
      setFilteredData(res.data.data.adminActions);
      setPagination({
        current: res.data.data.pagination.currentPage,
        pageSize: res.data.data.pagination.itemsPerPage,
        total: res.data.data.pagination.totalItems
      });
    } catch (err) {
      console.error(err);
      message.error("Failed to load admin actions");
    } finally {
      setLoading(false);
    }
  }, [filters]); // Add filters as dependency

  useEffect(() => {
    fetchAdminActions();
  }, [fetchAdminActions]);

  const handleTableChange = (pagination, filters, sorter) => {
    fetchAdminActions(pagination.current, pagination.pageSize);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchAdminActions(1, pagination.pageSize);
  };

  const resetFilters = () => {
    const newFilters = {
      dateRange: [dayjs().subtract(30, 'days'), dayjs()],
      action: 'all',
    };
    setFilters(newFilters);
    // We need to wait for state update before refetching
    setTimeout(() => fetchAdminActions(1, pagination.pageSize), 0);
  };

  const getActionTypeTag = (type) => {
    const typeConfig = {
      updateVendor: { color: 'blue', text: 'Update Vendor' },
      deleteVendor: { color: 'red', text: 'Delete Vendor' },
      blockOrUnblockVendor: { color: 'orange', text: 'Block/Unblock Vendor' },
      blockOrUnblockCustomer: { color: 'orange', text: 'Block/Unblock Customer' },
      verifyVendor: { color: 'orange', text: 'Verify Vendor' },
      resolveComplaint: { color: 'orange', text: 'Resolve Complaint' },
      updateSettings: { color: 'green', text: 'Update Settings' },
    };
    const config = typeConfig[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatActionData = (data) => {
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return data;
  };

  const handleViewDetails = (record) => {
    setSelectedAction(record);
    setModalVisible(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('Copied to clipboard!');
      })
      .catch(() => {
        message.error('Failed to copy to clipboard');
      });
  };

  const ActionDetailsModal = () => {
    if (!selectedAction) return null;

    return (
      <Modal
        title={
          <div className="flex items-center justify-between">
            <span>
              <UserOutlined className="mr-2 text-blue-500" />
              Action Details
            </span>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setModalVisible(false)}
            />
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="copy" 
            type="primary" 
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(formatActionData(selectedAction.actionData))}
          >
            Copy Details
          </Button>
        ]}
        width={800}
      >
        <Descriptions bordered column={1} size="middle" className="mt-4">
          <Descriptions.Item label="Action ID">
            <Text copyable>{selectedAction.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Admin User">
            {selectedAction.adminUserId || 'Unknown'}
          </Descriptions.Item>
          <Descriptions.Item label="Action Type">
            {getActionTypeTag(selectedAction.action)}
          </Descriptions.Item>
          <Descriptions.Item label="Date & Time">
            {dayjs(selectedAction.createdAt).format('MMMM D, YYYY h:mm:ss A')}
          </Descriptions.Item>
          <Descriptions.Item label="Full Details">
            <div className="bg-gray-50 p-3 rounded-md mt-2">
              <pre className="whitespace-pre-wrap overflow-auto max-h-60">
                {formatActionData(selectedAction.actionData)}
              </pre>
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    );
  };

  const columns = [
    {
      title: 'Admin',
      dataIndex: 'adminUserId',
      key: 'adminUserId',
      width: 200,
      render: (adminUserId) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} src={adminUserId?.avatar} />
          <Text>{adminUserId || 'Unknown'}</Text>
        </Space>
      )
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action) => getActionTypeTag(action)
    },
    {
      title: 'Details',
      dataIndex: 'actionData',
      key: 'actionData',
      ellipsis: true,
      render: (data) => (
        <Tooltip title={formatActionData(data)}>
          <Text code className="truncate">
            {formatActionData(data).substring(0, 50)}
            {formatActionData(data).length > 50 ? '...' : ''}
          </Text>
        </Tooltip>
      )
    },
    {
      title: 'Date & Time',
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <Title level={2} className="flex items-center mb-2">
              <UserOutlined className="mr-3 text-blue-600" />
              Admin Actions Log
            </Title>
            <Text type="secondary" className="text-lg">
              Monitor and review all administrative activities
            </Text>
          </div>
          
          <Space className="mt-4 lg:mt-0">
            <Button 
              icon={<ReloadOutlined />} 
              size="large"
              onClick={() => fetchAdminActions(pagination.current, pagination.pageSize)}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <Card className="mb-6 rounded-xl shadow-sm border-0 bg-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Text strong className="flex items-center whitespace-nowrap">
              <FilterOutlined className="mr-2" />
              Filter Actions:
            </Text>
            
            <Space direction="vertical" size="middle" className="w-full lg:w-auto">
              <RangePicker
                value={filters.dateRange}
                onChange={(value) => handleFilterChange('dateRange', value)}
                size="large"
                className="w-full lg:w-auto"
              />
              
              <Select
                value={filters.action}
                onChange={(value) => handleFilterChange('action', value)}
                size="large"
                className="w-full lg:w-60"
              >
                <Option value="all">All</Option>
                <Option value="blockOrUnblockVendor">block or unblock vendor</Option>
                <Option value="updateVendor">Update Vendor</Option>
                <Option value="deleteVendor">Delete Vendor</Option>
                <Option value="verifyVendor">Verify Vendor</Option>
                <Option value="updateCustomer">Update Customer</Option>
                <Option value="blockOrUnblockCustomer">block or unblock customer</Option>
                <Option value="resolveComplaint">Resolve Complaint</Option>
                <Option value="updateSettings">Update Settings</Option>
                <Option value="payout_initiated">Payout Initiated</Option>
                <Option value="payout_retried">Payout Retried</Option>
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

        {/* Actions Table */}
        <Card 
          title={
            <span className="flex items-center">
              <UserOutlined className="mr-2" />
              Admin Actions History
            </span>
          }
          className="rounded-xl shadow-sm border-0"
          extra={
            <Text type="secondary">
              Sorted by: Most Recent
            </Text>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={pagination}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="middle"
          />
        </Card>

        {/* Details Modal */}
        <ActionDetailsModal />
      </div>
    </div>
  );
}