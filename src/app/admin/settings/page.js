'use client';
import React, { useState, useEffect, useCallback } from 'react';
import api from "@/app/lib/api/axios";
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space, 
  message, 
  Modal, 
  Skeleton,
  Statistic,
  Alert,
  Divider,
  Row,
  Col,
  Grid
} from 'antd';
import { 
  PercentageOutlined, 
  SafetyCertificateOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  RocketOutlined,
  DashboardOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Item } = Form;
const { useBreakpoint } = Grid;

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeEdit, setActiveEdit] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [settings, setSettings] = useState({
    vendorFeePercentage: 0,
    platformFeePercentage: 0
  });

  const screens = useBreakpoint();

  // Wrap fetchSettings in useCallback to prevent unnecessary recreations
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response1 = await api.get('/api/admin/getOrSetSettings/platform_fee_percent');
      const response2 = await api.get('/api/admin/getOrSetSettings/vendor_fee_percent');
      
      const data = {
        vendorFeePercentage: response2.data.data,
        platformFeePercentage: response1.data.data
      };
      
      setSettings({
        vendorFeePercentage: data.vendorFeePercentage,
        platformFeePercentage: data.platformFeePercentage
      });

      form.setFieldsValue({
        vendorFeePercentage: data.vendorFeePercentage,
        platformFeePercentage: data.platformFeePercentage
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      message.error('Failed to load fee settings');
    } finally {
      setLoading(false);
    }
  }, [form]);

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]); // Added fetchSettings to dependency array

  const handleEdit = (feeType) => {
    setActiveEdit(feeType);
  };

  const handleCancel = () => {
    setActiveEdit(null);
    form.resetFields();
  };

  const showConfirmModal = (feeType) => {
    form.validateFields([feeType])
      .then(() => {
        setSelectedFee(feeType);
        setConfirmModalVisible(true);
      })
      .catch((errors) => {
        console.log('Validation errors:', errors);
      });
  };

  const handleConfirmCancel = () => {
    setConfirmModalVisible(false);
    setSelectedFee(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      const frontendPayload = {};
      const apiPayload = {};

      if (selectedFee === 'vendorFeePercentage') {
        const feeValue = parseFloat(values.vendorFeePercentage);
        apiPayload.vendor_fee_percent = feeValue;
        frontendPayload.vendorFeePercentage = feeValue;
      } else if (selectedFee === 'platformFeePercentage') {
        const feeValue = parseFloat(values.platformFeePercentage);
        apiPayload.platform_fee_percent = feeValue;
        frontendPayload.platformFeePercentage = feeValue;
      }

      await api.patch('/api/admin/updateSettings', apiPayload);

      message.success('Fee percentage updated successfully!');
      setSettings(prev => ({
        ...prev,
        ...frontendPayload
      }));
      setActiveEdit(null);
      setConfirmModalVisible(false);
      setSelectedFee(null);
    } catch (error) {
      console.error('Failed to update settings:', error);
      message.error(error.response?.data?.message || 'Failed to update fee percentage');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalFee = () => {
    const value = parseFloat(settings.vendorFeePercentage) + parseFloat(settings.platformFeePercentage);
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  // Card actions with proper keys
  const vendorCardActions = activeEdit === 'vendorFeePercentage' ? [
    <Button 
      key="cancel-vendor"
      type="text" 
      icon={<CloseOutlined style={{ fontSize: '18px' }} />} 
      onClick={handleCancel}
      size="large"
      className="flex items-center justify-center text-base"
    >
      Cancel
    </Button>,
    <Button 
      key="save-vendor"
      type="text" 
      icon={<SaveOutlined style={{ fontSize: '18px' }} />} 
      onClick={() => showConfirmModal('vendorFeePercentage')}
      size="large"
      className="flex items-center justify-center text-base text-green-600"
    >
      Save
    </Button>
  ] : [
    <Button 
      key="edit-vendor"
      type="text" 
      icon={<EditOutlined style={{ fontSize: '18px' }} />} 
      onClick={() => handleEdit('vendorFeePercentage')}
      size="large"
      className="flex items-center justify-center text-base"
    >
      Edit
    </Button>
  ];

  const platformCardActions = activeEdit === 'platformFeePercentage' ? [
    <Button 
      key="cancel-platform"
      type="text" 
      icon={<CloseOutlined style={{ fontSize: '18px' }} />} 
      onClick={handleCancel}
      size="large"
      className="flex items-center justify-center text-base"
    >
      Cancel
    </Button>,
    <Button 
      key="save-platform"
      type="text" 
      icon={<SaveOutlined style={{ fontSize: '18px' }} />} 
      onClick={() => showConfirmModal('platformFeePercentage')}
      size="large"
      className="flex items-center justify-center text-base text-green-600"
    >
      Save
    </Button>
  ] : [
    <Button 
      key="edit-platform"
      type="text" 
      icon={<EditOutlined style={{ fontSize: '18px' }} />} 
      onClick={() => handleEdit('platformFeePercentage')}
      size="large"
      className="flex items-center justify-center text-base"
    >
      Edit
    </Button>
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Title level={2} className="m-0 text-gray-800 flex items-center">
            <DashboardOutlined className="mr-2" /> Fee Settings
          </Title>
          <Text type="secondary" className="text-sm">
            Manage platform and vendor fee structures
          </Text>
        </div>
        <Button 
          icon={<SyncOutlined />}
          onClick={fetchSettings}
          className="flex items-center"
          size="large"
        >
          Refresh
        </Button>
      </div>

      <Alert
        message="Fee Management"
        description="Changes to fee percentages will affect all future transactions. Please verify the impact before updating."
        type="info"
        showIcon
        className="mb-8 rounded-lg border-none bg-blue-50"
      />

      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={8}>
          <Card 
            className="h-full border-none rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-blue-50"
            actions={vendorCardActions}
          >
            <div className="flex justify-between items-start mb-4">
              <Statistic
                title="Vendor Fee"
                value={settings.vendorFeePercentage}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#3f8600', fontSize: screens.xs ? '24px' : '30px' }}
                prefix={<PercentageOutlined />}
              />
              <div className={`p-3 rounded-full ${activeEdit === 'vendorFeePercentage' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <RocketOutlined style={{ fontSize: '20px' }} className={activeEdit === 'vendorFeePercentage' ? 'text-green-600' : 'text-gray-600'} />
              </div>
            </div>
            
            {activeEdit === 'vendorFeePercentage' ? (
              <Form form={form} layout="vertical">
                <Item
                  name="vendorFeePercentage"
                  initialValue={settings.vendorFeePercentage}
                  rules={[
                    { required: true, message: 'Vendor fee is required!' },
                    { 
                      pattern: /^\d+(\.\d{1,2})?$/, 
                      message: 'Use up to 2 decimal places!' 
                    },
                    { 
                      validator: (_, value) => {
                        if (parseFloat(value) < 0) {
                          return Promise.reject(new Error('Fee cannot be negative!'));
                        }
                        if (parseFloat(value) > 50) {
                          return Promise.reject(new Error('Vendor fee cannot exceed 50%!'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    step="0.01"
                    placeholder="Enter vendor fee"
                    suffix="%"
                    disabled={submitting}
                    className="rounded-lg"
                    size="large"
                  />
                </Item>
              </Form>
            ) : (
              <Text type="secondary" className="text-sm">
                Fee charged to vendors per transaction
              </Text>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card 
            className="h-full border-none rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-pink-50"
            actions={platformCardActions}
          >
            <div className="flex justify-between items-start mb-4">
              <Statistic
                title="Platform Fee"
                value={settings.platformFeePercentage}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#cf1322', fontSize: screens.xs ? '24px' : '30px' }}
                prefix={<PercentageOutlined />}
              />
              <div className={`p-3 rounded-full ${activeEdit === 'platformFeePercentage' ? 'bg-red-100' : 'bg-gray-100'}`}>
                <SafetyCertificateOutlined style={{ fontSize: '20px' }} className={activeEdit === 'platformFeePercentage' ? 'text-red-600' : 'text-gray-600'} />
              </div>
            </div>
            
            {activeEdit === 'platformFeePercentage' ? (
              <Form form={form} layout="vertical">
                <Item
                  name="platformFeePercentage"
                  initialValue={settings.platformFeePercentage}
                  rules={[
                    { required: true, message: 'Platform fee is required!' },
                    { 
                      pattern: /^\d+(\.\d{1,2})?$/, 
                      message: 'Use up to 2 decimal places!' 
                    },
                    { 
                      validator: (_, value) => {
                        if (parseFloat(value) < 0) {
                          return Promise.reject(new Error('Fee cannot be negative!'));
                        }
                        if (parseFloat(value) > 50) {
                          return Promise.reject(new Error('Platform fee cannot exceed 50%!'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    step="0.01"
                    placeholder="Enter platform fee"
                    suffix="%"
                    disabled={submitting}
                    className="rounded-lg"
                    size="large"
                  />
                </Item>
              </Form>
            ) : (
              <Text type="secondary" className="text-sm">
                Platform service fee per transaction
              </Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="h-full border-none rounded-xl shadow-md bg-gradient-to-br from-white to-purple-50">
            <div className="flex justify-between items-start mb-4">
              <Statistic
                title="Total Fee"
                value={calculateTotalFee()}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#1890ff', fontSize: screens.xs ? '24px' : '30px' }}
                prefix={<SafetyCertificateOutlined />}
              />
              <div className="p-3 rounded-full bg-purple-100">
                <SafetyCertificateOutlined style={{ fontSize: '20px' }} className="text-purple-600" />
              </div>
            </div>
            <Text type="secondary" className="text-sm">
              Combined fee charged to customers
            </Text>
            <Divider className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text>Vendor Fee:</Text>
                <Text strong>{settings.vendorFeePercentage}%</Text>
              </div>
              <div className="flex justify-between">
                <Text>Platform Fee:</Text>
                <Text strong>{settings.platformFeePercentage}%</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="⚠️ Confirm Fee Change"
        open={confirmModalVisible}
        onOk={handleSubmit}
        onCancel={handleConfirmCancel}
        okText="Confirm Update"
        cancelText="Cancel"
        confirmLoading={submitting}
        okButtonProps={{ 
          danger: true,
          disabled: submitting,
          size: 'large',
          className: 'rounded-lg flex items-center'
        }}
        cancelButtonProps={{
          disabled: submitting,
          size: 'large',
          className: 'rounded-lg flex items-center'
        }}
        width={600}
        className="rounded-lg"
      >
        <div className="space-y-4 py-2">
          <Alert
            message="Critical Action"
            description="You are about to change a fee percentage for all future transactions."
            type="warning"
            showIcon
            className="rounded-lg"
          />

          {selectedFee === 'vendorFeePercentage' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <Text strong>Current Vendor Fee:</Text>
                <br />
                <Text className="text-lg">{settings.vendorFeePercentage}%</Text>
              </div>
              <div>
                <Text strong>New Vendor Fee:</Text>
                <br />
                <Text type="danger" className="text-lg">
                  {form.getFieldValue('vendorFeePercentage')}%
                </Text>
              </div>
            </div>
          )}

          {selectedFee === 'platformFeePercentage' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-pink-50 rounded-lg">
              <div>
                <Text strong>Current Platform Fee:</Text>
                <br />
                <Text className="text-lg">{settings.platformFeePercentage}%</Text>
              </div>
              <div>
                <Text strong>New Platform Fee:</Text>
                <br />
                <Text type="danger" className="text-lg">
                  {form.getFieldValue('platformFeePercentage')}%
                </Text>
              </div>
            </div>
          )}

          <Divider />

          <div className="bg-gray-50 p-4 rounded-lg">
            <Text strong>New Total Fee:</Text>
            <Text className="text-lg block mt-1">
              {(
                parseFloat(selectedFee === 'vendorFeePercentage' ? 
                  form.getFieldValue('vendorFeePercentage') || 0 : settings.vendorFeePercentage) + 
                parseFloat(selectedFee === 'platformFeePercentage' ? 
                  form.getFieldValue('platformFeePercentage') || 0 : settings.platformFeePercentage)
              ).toFixed(2)}%
            </Text>
          </div>

          <Alert
            message="This action will immediately affect all new transactions."
            type="error"
            showIcon
            className="rounded-lg"
          />
        </div>
      </Modal>
    </div>
  );
}