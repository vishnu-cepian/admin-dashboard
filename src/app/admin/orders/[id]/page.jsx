'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {  Card,  Descriptions,  Tag,  Tabs,  Table,  Button,  Space, Statistic, Timeline,Badge,Alert,Collapse } from 'antd';
import { StarOutlined, ShopOutlined,CreditCardOutlined,  UserOutlined,  DollarOutlined,  ClockCircleOutlined,  CheckCircleOutlined , CloseCircleOutlined} from '@ant-design/icons';
import api from '@/app/lib/api/axios';
const { Panel } = Collapse;
const OrderDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [orderVendors, setOrderVendors] = useState([]);
  const [allQuotes, setAllQuotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orderRes, vendorsRes, paymentsRes] = await Promise.all([
          api.get(`/api/admin/getOrderById/${id}`),
          api.get(`/api/admin/getVendorResponse/${id}`),
          api.get(`/api/admin/getPayments/${id}`)
        ]);
       
        setOrder(orderRes.data.data.order);
        setOrderVendors(vendorsRes.data.data);
        setPayments(paymentsRes.data.data)

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
  }
  )
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
    const items = [];
    const ts = order?.orderStatusTimestamp || {};

    // Common for both delivery types
    if (ts.paidAt) items.push({ children: 'Payment Received', color: 'green', time: ts.paidAt });
    if (ts.orderConfirmedAt) items.push({ children: 'Order Confirmed', color: 'green', time: ts.orderConfirmedAt });
    if (ts.cancelledAt) items.push({ children: 'Order Cancelled', color: 'red', time: ts.cancelledAt });

    // Two-way delivery specific
    if (order?.clothProvided) {
      if (ts.outForPickupFromCustomerAt) items.push({ children: 'Out for Pickup (Customer)', color: 'blue', time: ts.outForPickupFromCustomerAt });
      if (ts.itemPickedFromCustomerAt) items.push({ children: 'Item Picked (Customer)', color: 'blue', time: ts.itemPickedFromCustomerAt });
      if (ts.itemDeliveredToVendorAt) items.push({ children: 'Delivered to Vendor', color: 'blue', time: ts.itemDeliveredToVendorAt });
      if (ts.vendorAcknowledgedItemAt) items.push({ children: 'Vendor Acknowledged', color: 'green', time: ts.vendorAcknowledgedItemAt });
    }

    // Common progress
    if (ts.orderInProgressAt) items.push({ children: 'Work Started', color: 'purple', time: ts.orderInProgressAt });
    if (ts.taskCompletedAt) items.push({ children: 'Work Completed', color: 'purple', time: ts.taskCompletedAt });

    // Delivery back to customer
    if (ts.outForPickupFromVendorAt) items.push({ children: 'Out for Pickup (Vendor)', color: 'cyan', time: ts.outForPickupFromVendorAt });
    if (ts.itemPickedFromVendorAt) items.push({ children: 'Item Picked (Vendor)', color: 'cyan', time: ts.itemPickedFromVendorAt });
    if (ts.itemDeliveredToCustomerAt) items.push({ children: 'Delivered to Customer', color: 'green', time: ts.itemDeliveredToCustomerAt });

    // Refunds
    if (ts.refundRequestedAt) items.push({ children: 'Refund Requested', color: 'orange', time: ts.refundRequestedAt });
    if (ts.refundProcessedAt) items.push({ children: 'Refund Processed', color: 'red', time: ts.refundProcessedAt });
    if (ts.completedAt) items.push({ children: 'Order Completed', color: 'green', time: ts.completed });

    return (
      <Timeline mode="alternate" items={items.map(item => ({
        color: item.color,
        children: (
          <div>
            <p>{item.children}</p>
            <small>{new Date(item.time).toLocaleString()}</small>
          </div>
        )
      }))} />
    );
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
          {record.paymentStatus === 'captured' && (
            <Button size="small" onClick={() => handleRefund(record.id)}>
              Refund
            </Button>
          )}
          <Button size="small" onClick={() => viewPaymentDetails(record)}>
            Details
          </Button>
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
  ];

  if (loading) return <Card loading />;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="p-6">
      {/* <Button onClick={() => router.push('/admin/orders')} className="mb-4">
        Back to Orders
      </Button> */}
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
      <Card title={`Order #${order.id}`} loading={loading}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Customer">
            <a href={`/admin/customers/${order.customerId}`}>
              {order.customerId}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="Vendor">
            <a href={`/admin/vendors/${order.selectedVendorId}`}>
              {order.selectedVendorId}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {renderStatusTag(order.orderStatus)}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Status">
            <Space>
              <Tag color={order.isPaid ? 'green' : 'red'}>
                {order.isPaid ? 'PAID' : 'UNPAID'}
              </Tag>
              {order.isRefunded && <Tag color="orange">REFUNDED</Tag>}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Required By">
            {new Date(order.requiredByDate).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Delivery Type">
            {order.clothProvided ? 'Two-Way' : 'One-Way'}
          </Descriptions.Item>
          <Descriptions.Item label="Final Quote Id">
            {/* <a href={`/admin/quotes/${order.finalQuoteId}`}> */}
              {order.finalQuoteId}
            {/* </a> */}
          </Descriptions.Item>
          <Descriptions.Item label="Final Payment Id">
            {/* <a href={`/admin/payments/${order.paymentId}`}> */}
              {order.paymentId}
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