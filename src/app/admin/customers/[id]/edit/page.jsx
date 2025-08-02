'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from "@/app/lib/api/axios";
import { Alert, Button, Card, Form, Input, message, Modal, Skeleton, Space, Typography } from 'antd';
const { Title } = Typography;

export default function EditCustomerPage({ params }) {
  const [form] = Form.useForm();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const resolvedParams = React.use(params);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await api.get(`/api/admin/getCustomerById/${resolvedParams.id}`);
        setCustomer(response.data.data.customer);
        form.setFieldsValue({
          name: response.data.data.customer.user.name,
          email: response.data.data.customer.user.email,
          phoneNumber: response.data.data.customer.user.phoneNumber
        });
      } catch (error) {
        console.error('Failed to fetch customer:', error);
        message.error('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }, [resolvedParams.id, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await api.patch(`/api/admin/updateCustomer/${resolvedParams.id}`, {
        name: values.name,
        email: values.email,
        phoneNumber: values.phoneNumber
      });
      message.success('Customer details updated successfully');
      router.push(`/admin/customers/${resolvedParams.id}`);
    } catch (error) {
    Modal.error({
      title: 'Update Failed',
      content: error.response?.data?.message || 'Failed to update customer details',
    });
      console.error('Failed to update customer:', error);
      message.error(error.response?.data?.message || 'Failed to update customer details');
    } finally {
      setSubmitting(false);
      setIsModalOpen(false);
    }
  };

  const showModal = () => {
    form.validateFields()
      .then(() => {
        setIsModalOpen(true);
      })
      .catch(() => {
        // Validation errors will be shown automatically by Ant Design
      });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Title level={2}>Customer Not Found</Title>
        <Button type="primary" onClick={() => router.push('/admin/customers')}>
          Back to Customers List
        </Button>
      </div>
    );
  }

return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <Title level={2} style={{ color: '#fff' }}>Edit Customer Details</Title>
            <Button onClick={() => router.push(`/admin/customers/${resolvedParams.id}`)}>
                Back to Details
            </Button>
        </div>

        <Card>
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    name: customer.user.name,
                    email: customer.user.email,
                    phoneNumber: customer.user.phoneNumber
                }}
            >
                <Form.Item
                    label="Name"
                    name="name"
                    rules={[{ required: true, message: 'Please input the customer name!' }]}
                >
                    <Input placeholder="Enter customer name" />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: 'Please input the customer email!' },
                        { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                >
                    <Input placeholder="Enter customer email" />
                </Form.Item>

                <Form.Item
                    label="Phone Number"
                    name="phoneNumber"
                    rules={[
                        { required: true, message: 'Please input the phone number!' },
                        { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number!' }
                    ]}
                >
                    <Input placeholder="Enter phone number" maxLength={10} />
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button 
                            type="primary" 
                            onClick={showModal}
                            loading={submitting}
                        >
                            Update Customer
                        </Button>
                        <Button 
                            onClick={() => router.push(`/admin/customers/${resolvedParams.id}`)}
                        >
                            Cancel
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>

        <Modal
            title="Confirm Update"
            open={isModalOpen}
            onOk={handleSubmit}
            onCancel={handleCancel}
            okText="Confirm"
            cancelText="Cancel"
            confirmLoading={submitting}
        >
            <p>Are you sure you want to update this customer's details?</p>
        </Modal>
    </div>
);
}