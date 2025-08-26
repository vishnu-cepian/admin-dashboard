'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from "@/app/lib/api/axios";
import { 
  Button, 
  Card, 
  Form, 
  Input, 
  Select, 
  message, 
  Modal, 
  Skeleton, 
  Space, 
  Typography,
  Divider,
  Upload,
  Tag
} from 'antd';
import { 
  EnvironmentOutlined, 
  BankOutlined, 
  IdcardOutlined, 
  ShopOutlined,
  UploadOutlined 
} from '@ant-design/icons';

import { v4 as uuidv4 } from 'uuid';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function EditVendorPage({ params }) {
  const [form] = Form.useForm();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const resolvedParams = React.use(params);

  // Shop types and service types for dropdowns
  const shopTypes = ['in-home', 'outlet'];
  const serviceTypes = ['tailors', 'laundry', 'other'];
  const ownershipTypes = ['single', 'partnership', 'private limited', 'limited liability partnership'];

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await api.get(`/api/admin/getVendorById/${resolvedParams.id}`);
        setVendor(response.data.data);
        form.setFieldsValue({
          // Basic Info
          shopName: response.data.data.shopName,
          shopType: response.data.data.shopType,
          serviceType: response.data.data.serviceType,
          ownershipType: response.data.data.ownershipType,
          vendorServices: response.data.data.vendorServices,
          shopDescription: response.data.data.shopDescription,

          // Contact Info
          name: response.data.data.user.name,
          email: response.data.data.user.email,
          phoneNumber: response.data.data.user.phoneNumber,
          addressLine1: response.data.data.addressLine1,
          addressLine2: response.data.data.addressLine2,
          district: response.data.data.district,
          street: response.data.data.street,
          city: response.data.data.city,
          state: response.data.data.state,
          pincode: response.data.data.pincode,
          landmark: response.data.data.landmark,

          // Bank Details
          razorpay_contact_id: response.data.data.razorpay_contact_id,
          razorpay_fund_account_id: response.data.data.razorpay_fund_account_id,
          accountHolderName: response.data.data.accountHolderName,
          accountNumber: response.data.data.accountNumber,
          ifscCode: response.data.data.ifscCode,

          // Documents
          aadhaarNumber: response.data.data.aadhaarNumber,
        });
      } catch (error) {
        console.error('Failed to fetch vendor:', error);
        message.error('Failed to load vendor details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendor();
  }, [resolvedParams.id, form]);

const [uploadStates, setUploadStates] = useState({
    aadhaarDocument: { uploading: false, progress: 0 },
    shopDocument: { uploading: false, progress: 0 },
    bankPassbook: { uploading: false, progress: 0 }
  });

  const handleFileUpload = async (file, fieldName) => {
    setUploadStates(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], uploading: true }
    }));

    try {
      let key;
      const ext = file.name.split('.').pop();
      const uniqueId = uuidv4();
      if (fieldName === 'aadhaarDocument') {
        key = `aadhaar-documents/${uniqueId}.${ext}`;
      } else if (fieldName === 'shopDocument') {
        key = `shop-documents/${uniqueId}.${ext}`;
      } else if (fieldName === 'bankPassbook') {
        key = `bank-passbook-documents/${uniqueId}.${ext}`;
      }

      // 1. Get presigned URL from backend
      const presignedResponse = await api.post(`/api/s3/s3-presigned-url`, {
          fileName: key,
          fileType: file.type,
      });

    //   // 2. Upload directly to S3 using the presigned URL    
      const uploadResult = await fetch(presignedResponse.data.data.presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      },(progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadStates(prev => ({
            ...prev,
            [fieldName]: { ...prev[fieldName], progress: percentCompleted }
          }));
        });
        if (!uploadResult.ok) {
            throw new Error('Failed to upload file to S3');
        }

      // 3. Return the S3 URL to be stored in form values
      return key; // or the full URL depending on your backend response
    } catch (error) {
        alert(error.response?.data?.message || 'Failed to upload file');
      console.error(`Error uploading ${fieldName}:`, error);
      message.error(`Failed to upload ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      return null;
    } finally {
      setUploadStates(prev => ({
        ...prev,
        [fieldName]: { uploading: false, progress: 0 }
      }));
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    
    try {
      // Handle file uploads first
      const uploadResults = {};
      if (values.aadhaarDocument?.[0]?.originFileObj) {
        uploadResults.aadhaarUrlPath = await handleFileUpload(
          values.aadhaarDocument[0].originFileObj,
          'aadhaarDocument'
        );
      }
      
      if (values.shopDocument?.[0]?.originFileObj) {
        uploadResults.shopDocumentUrlPath = await handleFileUpload(
          values.shopDocument[0].originFileObj,
          'shopDocument'
        );
      }
      
      if (values.bankPassbook?.[0]?.originFileObj) {
        uploadResults.bankPassbookUrlPath = await handleFileUpload(
          values.bankPassbook[0].originFileObj,
          'bankPassbook'
        );
      }

      // Prepare the data to send to backend
      const dataToSend = {
        ...values,
        ...uploadResults,
        // Remove the file objects as we only need the URLs
        aadhaarDocument: undefined,
        shopDocument: undefined,
        bankPassbook: undefined
      };

      // Send the update request
      await api.patch(`/api/admin/updateVendor/${resolvedParams.id}`, dataToSend);
      
      message.success('Vendor details updated successfully');
      router.push(`/admin/vendors/${resolvedParams.id}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update vendor details');
      console.error('Failed to update vendor:', error);
      message.error(error.response?.data?.message || 'Failed to update vendor details');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProps = (fieldName) => (console.log("uploadProps called for field:", form.getFieldValue(fieldName)), {
    beforeUpload: (file) => {
      // Prevent automatic upload
      return false;
    },
    maxCount: 1,
    onChange: async (info) => {
      if (info.file.status === 'removed') {
        form.setFieldsValue({ [fieldName]: undefined });
      }
    },
    showUploadList: {
      showRemoveIcon: true,
    },

    fileList: form.getFieldValue(fieldName),
  });

  const showConfirmModal = () => {
    form.validateFields()
      .then(() => {
        setIsModalOpen(true);
      })
      .catch(() => {
        // Validation errors will be shown automatically
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

  if (!vendor) {
    return (
      <div className="p-6">
        <Title level={2}>Vendor Not Found</Title>
        <Button type="primary" onClick={() => router.push('/admin/vendors')}>
          Back to Vendors List
        </Button>
      </div>
    );
  }

return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <Title level={2}>Edit Vendor Details</Title>
            <Space>
                <Button onClick={() => router.push(`/admin/vendors/${resolvedParams.id}`)}>
                    Back to Details
                </Button>
            </Space>
        </div>

        <Form
            form={form}
            layout="vertical"
            onFinish={values => {
                // If ownershipType is '', set it to null before submitting
                const submitValues = {
                    ...values,
                    ownershipType: values.ownershipType === '' ? null : values.ownershipType,
                };
                handleSubmit(submitValues);
            }}
        >
            <Card title="Basic Information" className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                        label="Shop Name"
                        name="shopName"
                        rules={[{ required: true, message: 'Please input the shop name!' }]}
                    >
                        <Input placeholder="Enter shop name" />
                    </Form.Item>

                    <Form.Item
                        label="Shop Type"
                        name="shopType"
                        rules={[{ required: true, message: 'Please select shop type!' }]}
                    >
                        <Select placeholder="Select shop type">
                            {shopTypes.map(type => (
                                <Option key={type} value={type}>{type}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Service Type"
                        name="serviceType"
                        rules={[{ required: true, message: 'Please select service type!' }]}
                    >
                        <Select placeholder="Select service type">
                            {serviceTypes.map(type => (
                                <Option key={type} value={type}>{type}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Ownership Type"
                        name="ownershipType"
                        rules={[{ required: false , message: 'Please select ownership type!' }]}
                    >
                        <Select placeholder="Select ownership type" allowClear>
                            <Option value="">None</Option>
                            {ownershipTypes.map(type => (
                                <Option key={type} value={type}>{type}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Vendor Services"
                        name="vendorServices"
                        rules={[{ required: true, message: 'Please input vendor services!' }]}
                    >
                        <Input placeholder="Enter services offered" />
                    </Form.Item>

                    <Form.Item
                        label="Shop Description"
                        name="shopDescription"
                        rules={[{ required: true, message: 'Please input shop description!' }]}
                    >
                        <TextArea rows={4} placeholder="Enter shop description" />
                    </Form.Item>
                </div>
            </Card>

            <Card title="Contact Details" className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                        label="Owner Name"
                        name="name"
                        rules={[{ required: true, message: 'Please input owner name!' }]}
                    >
                        <Input placeholder="Enter owner name" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Please input email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>

                    <Form.Item
                        label="Phone Number"
                        name="phoneNumber"
                        rules={[
                            { required: true, message: 'Please input phone number!' },
                            { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number!' }
                        ]}
                    >
                        <Input placeholder="Enter phone number" maxLength={10} />
                    </Form.Item>

                    <Form.Item
                        label="Address Line 1"
                        name="addressLine1"
                        rules={[{ required: true, message: 'Please input address line 1!' }]}
                    >
                        <Input placeholder="Enter address line 1" />
                    </Form.Item>

                    <Form.Item
                        label="Address Line 2"
                        name="addressLine2"
                    >
                        <Input placeholder="Enter address line 2" />
                    </Form.Item>

                    <Form.Item
                        label="District"
                        name="district"
                        rules={[{ required: true, message: 'Please input district!' }]}
                    >
                        <Input placeholder="Enter district" />
                    </Form.Item>

                    <Form.Item
                        label="Street"
                        name="street"
                        rules={[{ required: true, message: 'Please input street!' }]}
                    >
                        <Input placeholder="Enter street" />
                    </Form.Item>

                    <Form.Item
                        label="City"
                        name="city"
                        rules={[{ required: true, message: 'Please input city!' }]}
                    >
                        <Input placeholder="Enter city" />
                    </Form.Item>

                    <Form.Item
                        label="State"
                        name="state"
                        rules={[{ required: true, message: 'Please input state!' }]}
                    >
                        <Input placeholder="Enter state" />
                    </Form.Item>

                    <Form.Item
                        label="Pincode"
                        name="pincode"
                        rules={[{ required: true, message: 'Please input pincode!' }]}
                    >
                        <Input placeholder="Enter pincode" />
                    </Form.Item>

                    <Form.Item
                        label="Landmark"
                        name="landmark"
                    >
                        <Input placeholder="Enter landmark" />
                    </Form.Item>
                </div>
            </Card>

            <Card title="Bank Details" className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Form.Item
                        label="Razorpay Contact ID"
                        name="razorpay_contact_id"
                        rules={[{ required: true, message: 'Please input Razorpay contact ID!' }]}
                    >
                        <Input placeholder="Enter Razorpay contact ID" />
                    </Form.Item>
                     <Form.Item
                        label="Razorpay Fund Account ID"
                        name="razorpay_fund_account_id"
                        rules={[{ required: true, message: 'Please input Razorpay fund account ID!' }]}
                    >
                        <Input placeholder="Enter Razorpay fund account ID" />
                    </Form.Item>
                    <Form.Item
                        label="Account Holder Name"
                        name="accountHolderName"
                        rules={[{ required: true, message: 'Please input account holder name!' }]}
                    >
                        <Input placeholder="Enter account holder name" />
                    </Form.Item>

                    <Form.Item
                        label="Account Number"
                        name="accountNumber"
                        rules={[{ required: true, message: 'Please input account number!' }]}
                    >
                        <Input placeholder="Enter account number" />
                    </Form.Item>

                    <Form.Item
                        label="IFSC Code"
                        name="ifscCode"
                        rules={[{ required: true, message: 'Please input IFSC code!' }]}
                    >
                        <Input placeholder="Enter IFSC code" />
                    </Form.Item>
                </div>
            </Card>

            <Card title="Documents" className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <Form.Item
                        label="Aadhaar Number"
                        name="aadhaarNumber"
                        rules={[{ required: true, message: 'Please input Aadhaar number!' }]}
                    >
                        <Input placeholder="Enter Aadhaar number" />
                    </Form.Item>

                     <Form.Item 
                        label="Aadhaar Document" 
                        name="aadhaarDocument"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                        if (Array.isArray(e)) return e;
                        return e?.fileList;
                        }}
                    >
                        <Upload  beforeUpload={() => false} // Prevent automatic upload
                            maxCount={1}
                            onChange={({ fileList }) => {
                            // Update the form field value manually
                            form.setFieldsValue({ aadhaarDocument: fileList });
                            }}>


                        <Button icon={<UploadOutlined />}>
                            {uploadStates.aadhaarDocument.uploading 
                            ? `Uploading ${uploadStates.aadhaarDocument.progress}%` 
                            : 'Click to Upload'}
                        </Button>
                        </Upload>
                        {vendor.aadhaarUrlPath && !form.getFieldValue('aadhaarDocument')?.length && (
                        <div className="mt-2">
                            <Tag color="blue">Document Exists</Tag>
                            <Button 
                            type="link" 
                            onClick={() => handleViewDocument(vendor.aadhaarUrlPath)}
                            hidden
                            >
                            View
                            </Button>
                            <Button 
                            type="link" 
                            danger
                            hidden
                            onClick={() => {
                                // Option to remove existing document
                                form.setFieldsValue({ aadhaarUrlPath: null });
                            }}
                            >
                            Remove
                            </Button>
                        </div>
                        )}
                    </Form.Item>
                  
                    <Form.Item 
                        label="Shop Document" 
                        name="shopDocument"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                        if (Array.isArray(e)) return e;
                        return e?.fileList;
                        }}
                    >
                        <Upload  beforeUpload={() => false} // Prevent automatic upload
                            maxCount={1}
                            onChange={({ fileList }) => {
                            // Update the form field value manually
                            form.setFieldsValue({ shopDocument: fileList });
                            }}>


                        <Button icon={<UploadOutlined />}>
                            {uploadStates.shopDocument.uploading 
                            ? `Uploading ${uploadStates.shopDocument.progress}%` 
                            : 'Click to Upload'}
                        </Button>
                        </Upload>
                        {vendor.shopDocumentUrlPath && !form.getFieldValue('shopDocument')?.length && (
                        <div className="mt-2">
                            <Tag color="blue">Document Exists</Tag>
                            <Button 
                            type="link" 
                            onClick={() => handleViewDocument(vendor.shopDocumentUrlPath)}
                            hidden
                            >
                            View
                            </Button>
                            <Button 
                            type="link" 
                            danger
                            hidden
                            onClick={() => {
                                // Option to remove existing document
                                form.setFieldsValue({ shopDocumentUrlPath: null });
                            }}
                            >
                            Remove
                            </Button>
                        </div>
                        )}
                    </Form.Item>
                     <Form.Item 
                        label="bank passbook" 
                        name="bankPassbook"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                        if (Array.isArray(e)) return e;
                        return e?.fileList;
                        }}
                    >
                        <Upload  beforeUpload={() => false} // Prevent automatic upload
                            maxCount={1}
                            onChange={({ fileList }) => {
                            // Update the form field value manually
                            form.setFieldsValue({ bankPassbook: fileList });
                            }}>


                        <Button icon={<UploadOutlined />}>
                            {uploadStates.bankPassbook.uploading 
                            ? `Uploading ${uploadStates.bankPassbook.progress}%` 
                            : 'Click to Upload'}
                        </Button>
                        </Upload>
                        {vendor.bankPassbookUrlPath && !form.getFieldValue('bankPassbook')?.length && (
                        <div className="mt-2">
                            <Tag color="blue">Document Exists</Tag>
                            <Button 
                            type="link" 
                            onClick={() => handleViewDocument(vendor.bankPassbookUrlPath)}
                            hidden
                            >
                            View
                            </Button>
                            <Button 
                            type="link" 
                            danger
                            hidden
                            onClick={() => {
                                // Option to remove existing document
                                form.setFieldsValue({ bankPassbookUrlPath: null });
                            }}
                            >
                            Remove
                            </Button>
                        </div>
                        )}
                    </Form.Item>
                </div>
            </Card>

            <Divider />

            <div className="flex justify-end gap-4">
                <Button 
                    onClick={() => router.push(`/admin/vendors/${resolvedParams.id}`)}
                >
                    Cancel
                </Button>
                <Button 
                    type="primary" 
                    onClick={showConfirmModal}
                    loading={submitting}
                >
                    Update Vendor
                </Button>
            </div>
        </Form>

        <Modal
            title="Confirm Update"
            open={isModalOpen}
            onOk={() => form.submit()}
            onCancel={handleCancel}
            okText="Confirm Update"
            cancelText="Cancel"
            confirmLoading={submitting}
        >
            <p>Are you sure you want to update this vendor's details?</p>
        </Modal>
    </div>
);
}