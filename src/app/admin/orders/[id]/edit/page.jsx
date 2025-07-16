'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Form, Input, Select, Button, Card, Space, Tag, DatePicker, Switch, message, Descriptions, Divider, Modal, Tabs, Table, Collapse } from 'antd';
import { SaveOutlined, CloseOutlined, ExclamationCircleOutlined, HistoryOutlined, ShopOutlined, DollarOutlined } from '@ant-design/icons';
import moment from 'moment';
import api from '@/app/lib/api/axios';

const { Option } = Select;
const { confirm } = Modal;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const parseData = (dateString) => {
  if (!dateString) return null;
  const date = moment.utc(dateString);
  return date.isValid() ? date.local() : null;
};

const OrderEditPage = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [orderVendors, setOrderVendors] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orderRes, vendorsRes] = await Promise.all([
          api.get(`/api/admin/getOrderById/${id}`),
          api.get(`/api/admin/getVendorResponse/${id}`),
        ]);
        
        const orderData = orderRes.data.data.order;
        setOrder(orderData);
        setOrderVendors(vendorsRes.data.data);
        
        const formValues = {
          ...orderData,
          requiredByDate: orderData.requiredByDate ? parseData(orderData.requiredByDate) : null,
          // Map all timestamps
          ...Object.fromEntries(
            Object.entries(orderData.orderStatusTimestamp || {})
              .filter(([_, value]) => value !== null)
              .map(([key, value]) => [`timestamp_${key}`, parseData(value)])
          ),
          // Map all boolean flags
          ...Object.fromEntries(
            Object.entries(orderData.orderStatusTimestamp || {})
              .filter(([key]) => key.endsWith('At') === false)
              .map(([key, value]) => [`flag_${key}`, value])
          )
        };
        
        form.setFieldsValue(formValues);
      } catch (error) {
        message.error('Failed to fetch order data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, form]);

  const handleUpdate = async (values) => {
    try {
      // Prepare timestamps
      const timestamps = Object.fromEntries(
        Object.entries(values)
          .filter(([key]) => key.startsWith('timestamp_'))
          .map(([key, value]) => [
            key.replace('timestamp_', ''),
            value?.utc().format() || null
          ])
      );
      
      // Prepare boolean flags
      const flags = Object.fromEntries(
        Object.entries(values)
          .filter(([key]) => key.startsWith('flag_'))
          .map(([key, value]) => [
            key.replace('flag_', ''),
            value
          ])
      );

      const payload = {
        ...values,
        requiredByDate: values.requiredByDate?.utc().format(),
        orderStatusTimestamp: {
          ...timestamps,
          ...flags
        }
      };
      
      // Remove internal fields from payload
      Object.keys(payload).forEach(key => {
        if (key.startsWith('timestamp_') || key.startsWith('flag_')) {
          delete payload[key];
        }
      });

      await api.patch(`/api/admin/orders/${id}`, payload);
      message.success('Order updated successfully');
      router.refresh();
    } catch (error) {
      message.error('Failed to update order');
    }
  };

  const handleStatusChange = async (newStatus) => {
    confirm({
      title: `Change order status to ${newStatus}?`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>This action will trigger notifications and system updates.</p>
          <Form.Item label="Status Change Timestamp">
            <DatePicker 
              showTime 
              format="YYYY-MM-DD HH:mm:ss"
              value={statusChangeTime}
              onChange={setStatusChangeTime}
              getPopupContainer={trigger => trigger.parentNode}
            />
          </Form.Item>
        </div>
      ),
      onOk: async () => {
        try {
          await api.post(`/api/admin/orders/${id}/status`, { 
            status: newStatus,
            timestamp: statusChangeTime.utc().format()
          });
          message.success(`Order status updated to ${newStatus}`);
          router.refresh();
        } catch (error) {
          message.error('Failed to update status');
        }
      }
    });
  };
  const handleVendorStatusUpdate = async (vendorId, newStatus) => {
    try {
      await api.patch(`/api/admin/orders/${id}/vendors/${vendorId}`, { status: newStatus });
      message.success(`Vendor status updated to ${newStatus}`);
      router.refresh();
    } catch (error) {
      message.error('Failed to update vendor status');
    }
  };

  const handleQuoteUpdate = async (quoteId, updates) => {
    try {
      await api.patch(`/api/admin/quotes/${quoteId}`, updates);
      message.success('Quote updated successfully');
      router.refresh();
    } catch (error) {
      message.error('Failed to update quote');
    }
  };

  const renderStatusFields = () => {
    if (!order) return null;
    
    const isTwoWay = order.clothProvided;
    const commonFields = [
      { key: 'paidAt', label: 'Paid At', type: 'timestamp' },
      { key: 'orderConfirmedAt', label: 'Order Confirmed At', type: 'timestamp' },
    //   { key: 'cancelledAt', label: 'Cancelled', type: 'times' },
      { key: 'cancelledAt', label: 'Cancelled At', type: 'timestamp' },
      { key: 'orderInProgressAt', label: 'Order In Progress At', type: 'timestamp' },
      { key: 'taskCompletedAt', label: 'Task Completed At', type: 'timestamp' },
      { key: 'readyForPickupFromVendor', label: 'Ready for Pickup (Vendor)', type: 'boolean' },
      { key: 'outForPickupFromVendorAt', label: 'Out for Pickup (Vendor) At', type: 'timestamp' },
      { key: 'itemPickedFromVendorAt', label: 'Item Picked (Vendor) At', type: 'timestamp' },
      { key: 'itemDeliveredToCustomerAt', label: 'Item Delivered (To Customer) At', type: 'timestamp' },
      { key: 'refundRequestedAt', label: 'Refund Requested At', type: 'timestamp' },
      { key: 'refundProcessedAt', label: 'Refund Processed At', type: 'timestamp' },
      { key: 'completedAt', label: 'Completed At', type: 'timestamp' }
    ];

    const twoWayFields = [
      { key: 'readyForPickupFromCustomer', label: 'Ready for Customer Pickup', type: 'boolean' },
      { key: 'outForPickupFromCustomerAt', label: 'Out for Customer Pickup At', type: 'timestamp' },
      { key: 'itemPickedFromCustomerAt', label: 'Item Picked from Customer At', type: 'timestamp' },
      { key: 'itemDeliveredToVendorAt', label: 'Item Delivered to Vendor At', type: 'timestamp' },
      { key: 'vendorAcknowledgedItemAt', label: 'Vendor Acknowledged At', type: 'timestamp' }
    ];

    const allFields = isTwoWay ? [...commonFields, ...twoWayFields] : commonFields;

    return (
      <Collapse defaultActiveKey={['timestamps']} className="mb-6">
        <Panel header="Order Status Timeline" key="timestamps">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allFields.map((field) => (
              field.type === 'timestamp' ? (
                <Form.Item
                  key={field.key}
                  label={field.label}
                  name={`timestamp_${field.key}`}
                >
                  <DatePicker 
                    showTime 
                    format="YYYY-MM-DD HH:mm:ss"
                    style={{ width: '100%' }}
                    getPopupContainer={trigger => trigger.parentNode}
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  key={field.key}
                  label={field.label}
                  name={`flag_${field.key}`}
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              )
            ))}
          </div>
        </Panel>
      </Collapse>
    );
  };

  const vendorColumns = [
    {
      title: 'Vendor',
      dataIndex: ['vendorId'],
      key: 'vendorId',
      render: (text, record) => (
        <a href={`/admin/vendors/${record.vendorId}`}>{text}</a>
      )
    },
    {
      title: 'Current Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'ACCEPTED' ? 'green' :
          status === 'REJECTED' ? 'red' :
          status === 'FINALIZED' ? 'blue' : 'orange'
        }>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Select
          defaultValue={record.status}
          style={{ width: 120 }}
          onChange={(value) => handleVendorStatusUpdate(record.id, value)}
        >
          <Option value="PENDING">Pending</Option>
          <Option value="ACCEPTED">Accepted</Option>
          <Option value="REJECTED">Rejected</Option>
          <Option value="FINALIZED">Finalized</Option>
          <Option value="FROZEN">Frozen</Option>
          <Option value="EXPIRED">Expired</Option>
        </Select>
      )
    }
  ];

  const quoteColumns = [
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'shopName'],
      key: 'vendor'
    },
    {
      title: 'Quoted Price',
      dataIndex: 'quotedPrice',
      key: 'price',
      render: (value) => `₹${value}`
    },
    {
      title: 'Status',
      dataIndex: 'isProcessed',
      key: 'processed',
      render: (processed) => (
        <Switch 
          checked={processed}
          onChange={(checked) => handleQuoteUpdate(record.id, { isProcessed: checked })}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          size="small"
          onClick={() => router.push(`/admin/quotes/${record.id}/edit`)}
        >
          Edit
        </Button>
      )
    }
  ];

  if (loading) return <Card loading />;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="p-6">
      <Button onClick={() => router.push('/admin/orders')} className="mb-4">
        Back to Orders
      </Button>

      <Card 
        title={`Edit Order #${order.id}`} 
        loading={loading}
        extra={
          <Tag color={
            order.orderStatus === 'COMPLETED' ? 'green' :
            order.orderStatus === 'CANCELLED' ? 'red' : 'blue'
          }>
            {order.orderStatus}
          </Tag>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Details" key="details">
            <Form form={form} layout="vertical" onFinish={handleUpdate}>
              <Descriptions bordered column={2} className="mb-6">
                <Descriptions.Item label="Customer">
                  <a href={`/admin/customers/${order.customerId}`}>{order.customerId}</a>
                </Descriptions.Item>
                <Descriptions.Item label="Vendor">
                  <a href={`/admin/vendors/${order.selectedVendorId}`}>
                    {orderVendors.find(v => v.vendorId === order.selectedVendorId)?.vendor?.shopName || order.selectedVendorId}
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="Payment">
                  {order.isPaid ? (
                    <Tag color="green">PAID</Tag>
                  ) : (
                    <Tag color="red">UNPAID</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Delivery Type">
                  {order.clothProvided ? 'Two-Way' : 'One-Way'}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Order Information</Divider>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Form.Item label="Required By Date" name="requiredByDate">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="Cloth Provided" name="clothProvided" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>

                <Form.Item label="Payment Status" name="isPaid" valuePropName="checked">
                  <Switch checkedChildren="Paid" unCheckedChildren="Unpaid" />
                </Form.Item>

                <Form.Item label="Refund Status" name="isRefunded" valuePropName="checked">
                  <Switch checkedChildren="Refunded" unCheckedChildren="Not Refunded" />
                </Form.Item>
              </div>

              <Form.Item label="Special Instructions" name="specialInstructions">
                <Input.TextArea rows={4} />
              </Form.Item>

              <Divider orientation="left">Status Management</Divider>
              
              <Space size="middle" className="mb-4">
                {[
                  'PENDING', 'ORDER_CONFIRMED', 'IN_PROGRESS', 
                  'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED', 'REFUNDED'
                ].map(status => (
                  <Button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    type={order.orderStatus === status ? 'primary' : 'default'}
                    danger={status === 'CANCELLED'}
                  >
                    {status.replace(/_/g, ' ')}
                  </Button>
                ))}
              </Space>

              <Divider orientation="left">Timestamps</Divider>
              {renderStatusFields()}

              <Divider />
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    Save Changes
                  </Button>
                  <Button onClick={() => form.resetFields()} icon={<CloseOutlined />}>
                    Reset
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="Vendors" key="vendors" icon={<ShopOutlined />}>
            <Table
              columns={vendorColumns}
              dataSource={orderVendors}
              rowKey="id"
              pagination={false}
            />
          </TabPane>

          <TabPane tab="Quotes" key="quotes" icon={<DollarOutlined />}>
            <Table
              columns={quoteColumns}
              dataSource={quotes}
              rowKey="id"
              pagination={false}
            />
          </TabPane>

          <TabPane tab="Timeline" key="timeline" icon={<HistoryOutlined />}>
            <div className="p-4">
              {Object.entries(order.orderStatusTimestamp || {})
                .filter(([_, value]) => value)
                .sort((a, b) => new Date(a[1]) - new Date(b[1]))
                .map(([key, value]) => (
                  <div key={key} className="mb-4">
                    <div className="font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="text-gray-500">
                      {new Date(value).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default OrderEditPage;