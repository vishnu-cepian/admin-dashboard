'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Tabs, 
  Table, 
  Button, 
  Space, 
  Statistic, 
  Timeline, 
  Badge, 
  Alert, 
  Collapse, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber,
  message 
} from 'antd';
import { 
  StarOutlined, 
  ShopOutlined, 
  CreditCardOutlined, 
  UserOutlined, 
  DollarOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ShopTwoTone, 
  ClockCircleTwoTone, 
  EnvironmentOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import api from '@/app/lib/api/axios';
import Divider from 'antd/lib/divider';

const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;

const OrderDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [orderVendors, setOrderVendors] = useState([]);
  const [orderStatusTimeline, setOrderStatusTimeline] = useState([]);
  const [deliveryTracking, setDeliveryTracking] = useState([]);
  const [allQuotes, setAllQuotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orderRes, vendorsRes, paymentsRes, statusTimelineRes, deliveryRes] = await Promise.all([
          api.get(`/api/admin/getOrderById/${id}`),
          api.get(`/api/admin/getVendorResponse/${id}`),
          api.get(`/api/admin/getPayments/${id}`),
          api.get(`/api/admin/getOrderTimeline/${id}`),
          api.get(`/api/admin/getDeliveryDetails/${id}`),
        ]);

        setOrder(orderRes.data.data.order);
        setOrderVendors(vendorsRes.data.data);
        setPayments(paymentsRes.data.data);
        setOrderStatusTimeline(statusTimelineRes.data.data);
        setDeliveryTracking(deliveryRes.data.data);

        const quotesPromise = vendorsRes.data.data.map(vendor => 
          api.get(`/api/admin/getQuotes/${vendor.id}`)
          .catch(error => {
            console.error(`Failed to fetch quotes for vendor ${vendor.id}:`, error);
            return null;
          })
        )
        const quotesResponse = await Promise.allSettled(quotesPromise);
      
        const successfulQuotes = quotesResponse
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value.data.data);

        setAllQuotes(successfulQuotes);

      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Get the selected vendor's quote
  const selectedVendorQuote = allQuotes.find(quote => {
    const matchingOrderVendor = orderVendors.find(ov => 
      ov.vendorId === order?.selectedVendorId
    );
    return quote.orderVendorId === matchingOrderVendor?.id;
  });
  
  // Get other vendors' quotes
  const otherVendorsQuotes = allQuotes.filter(quote => {
    const matchingOrderVendor = orderVendors.find(ov => 
      ov.vendorId === order?.selectedVendorId
    );
    return quote.orderVendorId !== matchingOrderVendor?.id
  });

  const handleRefund = (payment) => {
    setSelectedPayment(payment);
    form.setFieldsValue({
      amount: payment.paymentAmount,
      speed: 'normal',
      reason: ''
    });
    setRefundModalVisible(true);
  };

  const handleRefundSubmit = async (values) => {
    try {
      setRefundLoading(true);
      const response = await api.post('/api/admin/refundRazorpayPaymentByAdmin', {
        orderId: id,
        paymentId: selectedPayment.id,
        razorpayPaymentId: selectedPayment.razorpayPaymentId,
        amount: values.amount,
        speed: values.speed,
        reason: values.reason
      });

      if (response.data.message === "Success") {
        message.success('Refund processed successfully');
        setRefundModalVisible(false);
        form.resetFields();
        
        // Refresh the data to update the UI
        const orderRes = await api.get(`/api/admin/getOrderById/${id}`);
        setOrder(orderRes.data.data.order);
        
        const paymentsRes = await api.get(`/api/admin/getPayments/${id}`);
        setPayments(paymentsRes.data.data);
      } else {
        message.error(response.data.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Refund error:', error);
      message.error(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  const renderStatusTag = (status) => {
    const statusMap = {
      PENDING: { color: 'orange', text: 'Pending' },
      ORDER_CONFIRMED: { color: 'blue', text: 'Confirmed' },
      OUT_FOR_PICKUP: { color: 'geekblue', text: 'Out for Pickup' },
      IN_PROGRESS: { color: 'purple', text: 'In Progress' },
      OUT_FOR_DELIVERY: { color: 'cyan', text: 'Out for Delivery' },
      COMPLETED: { color: 'green', text: 'Completed' },
      REFUNDED: { color: 'red', text: 'Refunded' },
      CANCELLED: { color: 'gray', text: 'Cancelled' }
    };
    
    const statusInfo = statusMap[status] || { color: 'gray', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const renderVendorStatus = (status) => {
    const statusMap = {
      PENDING: { color: 'orange', icon: <ClockCircleOutlined /> },
      ACCEPTED: { color: 'blue', icon: <CheckCircleOutlined /> },
      REJECTED: { color: 'red', icon: <CloseCircleOutlined /> },
      FINALIZED: { color: 'green', icon: <CheckCircleOutlined /> },
      FROZEN: { color: 'gray', icon: <ClockCircleOutlined /> },
      EXPIRED: { color: 'gray', icon: <CloseCircleOutlined /> }
    };
    
    const statusInfo = statusMap[status] || { color: 'gray', icon: null };
    return (
      <Badge 
        color={statusInfo.color} 
        text={status} 
        status="processing"
      />
    );
  };

  const renderPaymentStatus = (status) => {
    const statusMap = {
      created: { color: 'blue', text: 'Created' },
      captured: { color: 'green', text: 'Captured' },
      failed: { color: 'red', text: 'Failed' },
      refunded: { color: 'orange', text: 'Refunded' },
      partially_refunded: { color: 'gold', text: 'Partially Refunded' }
    };
    
    const statusInfo = statusMap[status] || { color: 'gray', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

 const renderTimeline = () => {
  if (!orderStatusTimeline || orderStatusTimeline.length === 0) {
    return <p>No timeline data available</p>;
  }

  // Map status to display text and color
  const statusMap = {
    PENDING: { text: 'Order Created', color: 'gray' },
    IN_PROGRESS: { text: 'Payment Successful', color: 'green' },
    ITEM_PICKUP_FROM_CUSTOMER_SCHEDULED: { text: 'Pickup Scheduled', color: 'blue' },
    ITEM_PICKED_UP_FROM_CUSTOMER: { text: 'Item Picked Up', color: 'blue' },
    ITEM_DELIVERED_TO_VENDOR: { text: 'Delivered to Vendor', color: 'blue' },
    ITEM_RECEIVED: { text: 'Vendor Received Item', color: 'green' },
    WORK_STARTED: { text: 'Work Started', color: 'purple' },
    ITEM_READY_FOR_PICKUP: { text: 'Work Completed', color: 'purple' },
    ITEM_PICKED_UP_FROM_VENDOR: { text: 'Picked Up from Vendor', color: 'cyan' },
    ITEM_DELIVERED_TO_CUSTOMER: { text: 'Delivered to Customer', color: 'green' },
    CANCELLED: { text: 'Order Cancelled', color: 'red' },
    REFUNDED: { text: 'Order Refunded', color: 'orange' }
  };

  // Sort timeline by timestamp
  const sortedTimeline = [...orderStatusTimeline].sort((a, b) => 
    new Date(a.changedAt) - new Date(b.changedAt)
  );

  return (
    <Timeline mode="alternate">
      {sortedTimeline.map((entry) => {
        const statusInfo = statusMap[entry.newStatus] || { 
          text: entry.newStatus, 
          color: 'gray' 
        };
        
        return (
          <Timeline.Item 
            key={entry.id} 
            color={statusInfo.color}
            label={new Date(entry.changedAt).toLocaleString()}
          >
            <div className="font-medium">{statusInfo.text}</div>
            <div className="text-xs text-gray-500">
              {entry.notes || `Changed from ${entry.previousStatus || 'N/A'}`}
            </div>
            <div className="text-xs mt-1">
              <Tag color="blue">{entry.changedByRole}</Tag>
              {entry.changedBy && (
                <Tag color="geekblue" className="ml-1">
                  {entry.changedBy}
                </Tag>
              )}
            </div>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
};

const renderDeliveryTracking = () => {
  if (!deliveryTracking || deliveryTracking.length === 0) {
    return <p>No delivery tracking data available</p>;
  }

  return (
    <div className="space-y-6">
      {deliveryTracking.map((tracking) => (
        <Card 
          key={tracking.id}
          title={`${tracking.deliveryType === 'TO_VENDOR' ? 'To Vendor' : 'To Customer'} Delivery`}
          className="mb-4"
        >
          <Timeline mode="left">
            {renderDeliverySteps(tracking)}
          </Timeline>

          <Divider />
          
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Initiated By">
              {tracking.from === 'VENDOR' ? 'Vendor' : 'Customer'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={tracking.status === 'DELIVERY_COMPLETE' ? 'green' : 'orange'}>
                {tracking.status.replace('_', ' ')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Delivery ID">
              {tracking.id}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ))}
    </div>
  );
};

const renderDeliverySteps = (tracking) => {
  const steps = [];
  const details = tracking.statusUpdateTimeStamp;
  
  // Add pickup steps
  if (details.pickup_assigned_at) {
    steps.push({
      color: 'blue',
      label: formatDateTime(details.pickup_assigned_at),
      children: 'Pickup assigned'
    });
  }
  
  if (details.pickup_in_transit_at) {
    steps.push({
      color: 'blue',
      label: formatDateTime(details.pickup_in_transit_at),
      children: 'Pickup in transit'
    });
  }
  
  if (details.pickup_completed_at) {
    steps.push({
      color: 'green',
      label: formatDateTime(details.pickup_completed_at),
      children: 'Pickup completed'
    });
  }
  
  // Add delivery steps
  if (details.delivery_in_transit_at) {
    steps.push({
      color: 'blue',
      label: formatDateTime(details.delivery_in_transit_at),
      children: 'Delivery in transit'
    });
  }
  
  if (details.delivery_completed_at) {
    steps.push({
      color: 'green',
      label: formatDateTime(details.delivery_completed_at),
      children: 'Delivery completed'
    });
  }
  
  // Add failed/cancelled steps if applicable
  if (details.delivery_failed_at) {
    steps.push({
      color: 'red',
      label: formatDateTime(details.delivery_failed_at),
      children: 'Delivery failed'
    });
  }
  
  if (details.delivery_cancelled_at) {
    steps.push({
      color: 'red',
      label: formatDateTime(details.delivery_cancelled_at),
      children: 'Delivery cancelled'
    });
  }

  // Sort steps by time
  steps.sort((a, b) => new Date(a.label) - new Date(b.label));

  return steps.map((step, index) => (
    <Timeline.Item key={index} color={step.color}>
      <div className="font-medium">{step.children}</div>
      <div className="text-sm text-gray-500">{step.label}</div>
    </Timeline.Item>
  ));
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

  const vendorColumns = [
    {
      title: 'Vendor',
      dataIndex: ['vendorId'],
      key: 'vendor',
      render: (text, record) => (
        <a href={`/admin/vendors/${record.vendorId}`}>{text}</a>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: renderVendorStatus
    },
    {
      title: 'Response Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString()
    },
     {
      title: 'Status Updated Time',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: "Order Vendor Reference id (QUOTE identificator)",
      dataIndex: 'id',
      key: 'id',
       render: (record) => (
        <Tag color='cyan'>
          {record}
        </Tag>
      )
    }
  ];

   const quoteColumns = [
      {
      title: 'Quote Id',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Quoted Days',
      dataIndex: 'quotedDays',
      key: 'quotedDays'
    },
    {
      title: 'Quoted Price',
      dataIndex: 'quotedPrice',
      key: 'quotedPrice',
      render: (price) => `₹${price}`
    },
    {
      title: 'Vendor Payout',
      dataIndex: 'vendorPayoutAfterCommission',
      key: 'vendorPayout',
      render: (price) => `₹${price}`
    },
    {
      title: 'Price After Platform Fee',
      dataIndex: 'priceAfterPlatformFee',
      key: 'platformFee',
      render: (price) => `₹${price}`
    },
    {
      title: 'Delivery Charge',
      dataIndex: 'deliveryCharge',
      key: 'deliveryCharge',
      render: (charge) => `₹${charge}`
    },
    {
      title: 'Final Price',
      dataIndex: 'finalPrice',
      key: 'finalPrice',
      render: (price) => <strong>₹{price}</strong>
    },
    {
      title: 'Processed',
      dataIndex: 'isProcessed',
      key: 'isProcessed',
      render: (processed) => (
        <Tag color={processed ? 'green' : 'orange'}>
          {processed ? 'Yes' : 'No'}
        </Tag>
      )
    },
    {
      title: 'Order Vendor Reference id (QUOTE identificator)',
      dataIndex: 'orderVendorId',
      key: 'orderVendorId',
      render: (record) => (
        <Tag color='cyan'>
          {record}
        </Tag>
      )
    }
  ];
 const paymentColumns = [
    {
      title: 'Payment ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Tag>{id}</Tag>
    },
    {
      title: 'Razorpay ID',
      dataIndex: 'razorpayPaymentId',
      key: 'razorpayId',
      render: (id) => id || 'N/A'
    },
    {
      title: 'Amount',
      dataIndex: 'paymentAmount',
      key: 'amount',
      render: (amount) => `₹${amount}`
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'status',
      render: renderPaymentStatus
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'method',
      render: (method) => method?.toUpperCase() || 'N/A'
    },
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'date',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.paymentStatus === 'captured' && !order?.isRefunded && (
            <Button 
              size="small" 
              onClick={() => handleRefund(record)}
              icon={<ExclamationCircleOutlined />}
            >
              Refund
            </Button>
          )}
        </Space>
      )
    }
  ];
  const tabItems = [
    {
      key: 'timeline',
      label: 'Order Timeline',
      icon: <ClockCircleOutlined />,
      children: renderTimeline()
    },
    {
      key: 'delivery',
      label: 'Delivery Tracking',
      icon: <EnvironmentOutlined />,
      children: renderDeliveryTracking()
    },
    {
      key: 'vendors',
      label: 'Vendor Responses',
      icon: <ShopOutlined />,
      children: (
        <Table
          columns={vendorColumns}
          dataSource={orderVendors}
          rowKey="id"
          pagination={false}
        />
      )
    },
      {
      key: 'quotes',
      label: 'Quotes',
      icon: <DollarOutlined />,
      children: (
        <div>
          {/* Selected Vendor's Quote */}
          {selectedVendorQuote && (
            <Card 
              title={
                <Space>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <span>Selected Vendor's Quote</span>
                  <Tag color="green">Finalized</Tag>
                </Space>
              }
              className="mb-4"
            >
              <Table
                columns={quoteColumns}
                dataSource={[selectedVendorQuote]}
                rowKey="id"
                pagination={false}
                // showHeader={false}
              />
            </Card>
          )}

          {/* Other Vendors' Quotes */}
          <Collapse ghost>
            <Panel header={`Other Vendor Quotes (${otherVendorsQuotes.length})`} key="otherQuotes">
              <Table
                columns={quoteColumns}
                dataSource={otherVendorsQuotes}
                rowKey="id"
                pagination={false}
              />
            </Panel>
          </Collapse>
        </div>
      )
    },
    {
      key: 'payments',
      label: 'Payments',
      icon: <CreditCardOutlined />,
      children: (
        <Table
          columns={paymentColumns}
          dataSource={payments}
          rowKey="id"
          pagination={false}
          bordered
          title={() => (
            <div className="flex justify-between items-center">
              <span>Payment History</span>
              <Statistic
                title="Total Paid"
                value={payments
                  .filter(p => p.paymentStatus === 'captured')
                  .reduce((sum, p) => sum + parseFloat(p.paymentAmount), 0)}
                prefix="₹"
              />
            </div>
          )}
        />
      )
    },
    {
      key: 'Additional',
      label: 'Shipment Address & Other Details',
      icon: <ShopTwoTone />,
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Full Name">{order?.fullName}</Descriptions.Item>
          <Descriptions.Item label="Phone Number">{order?.phoneNumber}</Descriptions.Item>
          <Descriptions.Item label="Address Line 1">{order?.addressLine1}</Descriptions.Item>
          <Descriptions.Item label="Address Line 2">{order?.addressLine2}</Descriptions.Item>
          <Descriptions.Item label="District">{order?.district}</Descriptions.Item>
          <Descriptions.Item label="State">{order?.state}</Descriptions.Item>
          <Descriptions.Item label="Street">{order?.street}</Descriptions.Item>
          <Descriptions.Item label="City">{order?.city}</Descriptions.Item>
          <Descriptions.Item label="Pincode">{order?.pincode}</Descriptions.Item>
          <Descriptions.Item label="Landmark">{order?.landmark}</Descriptions.Item>
          <Descriptions.Item label="Address Type">{order?.addressType}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'stats',
      label: 'Order Stats',
      icon: <ClockCircleTwoTone />,
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Order Pending At">{order?.orderStatusTimestamp?.pendingAt}</Descriptions.Item>
          <Descriptions.Item label="Order In-Progress At">{order?.orderStatusTimestamp?.inProgressAt}</Descriptions.Item>
          <Descriptions.Item label="Order Completed At">{order?.orderStatusTimestamp?.completedAt}</Descriptions.Item>
        </Descriptions>
      ),
    },
  ];

  if (loading) return <Card loading />;
  if (!order) return <div>Order not found</div>;

 return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <Space>
          <Button onClick={() => router.push('/admin/orders')}>
            Back to Orders
          </Button>
          <Button type="primary" onClick={() => router.push(`/admin/orders/${id}/edit`)}>
            Edit Order
          </Button>
        </Space>
      </div>
      
      <Card title={`Order #${order?.id}`} loading={loading}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Customer">
            <a href={`/admin/customers/${order?.customerId}`}>
              {order?.customerId}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="Vendor">
            <a href={`/admin/vendors/${order?.selectedVendorId}`}>
              {order?.selectedVendorId}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {renderStatusTag(order?.orderStatus)}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Status">
            <Space>
              <Tag color={order?.isPaid ? 'green' : 'red'}>
                {order?.isPaid ? 'PAID' : 'UNPAID'}
              </Tag>
              {order?.isRefunded && <Tag color="orange">REFUNDED</Tag>}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Required By">
            {new Date(order.requiredByDate).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Delivery Type">
            {order.clothProvided ? 'Two-Way' : 'One-Way'}
          </Descriptions.Item>
          <Descriptions.Item label="Order Name">
            {order?.orderName}
          </Descriptions.Item>
          <Descriptions.Item label="Order Type">
            {order?.orderType}
          </Descriptions.Item>
          <Descriptions.Item label="Order Preference">
            {order?.orderPreference}
          </Descriptions.Item>
          <Descriptions.Item label="Finish By Date">
            {order?.finishByDate}
          </Descriptions.Item>
          <Descriptions.Item label="Final Quote Id">
            {/* <a href={`/admin/quotes/${order.finalQuoteId}`}> */}
              {order?.finalQuoteId}
            {/* </a> */}
          </Descriptions.Item>
          <Descriptions.Item label="Final Payment Id">
            {/* <a href={`/admin/payments/${order.paymentId}`}> */}
              {order?.paymentId}
            {/* </a> */}
          </Descriptions.Item>
          <Descriptions.Item label="Total Paid">
            <strong>
              ₹{payments
                .filter(p => p.paymentStatus === 'captured')
                .reduce((sum, p) => sum + parseFloat(p.paymentAmount), 0)}
            </strong>
          </Descriptions.Item>
        </Descriptions>

        <Tabs
          defaultActiveKey="timeline"
          items={tabItems}
          className="mt-6"
        />
      </Card>
<Modal
          title="Process Refund"
          open={refundModalVisible}
          onCancel={() => {
            setRefundModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Alert
            message="Warning"
            description="This action will refund the payment to the customer. This cannot be undone."
            type="warning"
            showIcon
            className="mb-4"
          />
          
          {selectedPayment && (
            <Descriptions bordered column={1} className="mb-4">
              <Descriptions.Item label="Payment ID">{selectedPayment.id}</Descriptions.Item>
              <Descriptions.Item label="Razorpay ID">{selectedPayment.razorpayPaymentId || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Original Amount">₹{selectedPayment.paymentAmount}</Descriptions.Item>
            </Descriptions>
          )}
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleRefundSubmit}
          >
            <Form.Item
              label="Refund Amount (₹)"
              name="amount"
              rules={[
                { required: true, message: 'Please enter refund amount' },
                {
                  validator: (_, value) => {
                    if (value && selectedPayment && value > selectedPayment.paymentAmount) {
                      return Promise.reject(new Error('Refund amount cannot exceed original payment amount'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                min={0.01}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder="Enter refund amount"
              />
            </Form.Item>
            
            <Form.Item
              label="Refund Speed"
              name="speed"
              rules={[{ required: true, message: 'Please select refund speed' }]}
            >
              <Select placeholder="Select refund speed">
                <Option value="normal">Normal (5-7 business days)</Option>
                <Option value="optimum">Optimum (Instant to 24 hours)</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              label="Refund Reason"
              name="reason"
              rules={[{ required: true, message: 'Please enter refund reason' }]}
            >
              <TextArea
                rows={4}
                placeholder="Enter reason for refund"
                maxLength={500}
                showCount
              />
            </Form.Item>
            
            <Form.Item className="text-right mb-0">
              <Space>
                <Button 
                  onClick={() => {
                    setRefundModalVisible(false);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={refundLoading}
                  danger
                >
                  Process Refund
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      {order.orderStatus === 'PENDING' && (
        <Alert
          message="Action Required"
          description="This order is still pending confirmation"
          type="warning"
          showIcon
          className="mt-4"
        />
      )}
    </div>
  );
};

export default OrderDetailPage;