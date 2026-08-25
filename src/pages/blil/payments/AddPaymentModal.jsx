import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

export const AddPaymentModal = ({ show, onHide, payment, onSave }) => {
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    serviceType: "",
    amount: "",
    paid: "",
    due: "0",
    paymentDate: "",
    transactionNumber: "",
    paymentMethod: "",
    status: "Unpaid"
  });

  const [errors, setErrors] = useState({});

 

  // Mock service types
  const serviceTypes = [
    "Preventive Maintenance",
    "Repair",
    "Emergency Repair",
    "Inspection",
    "Installation",
    "Upgrade"
  ];

  useEffect(() => {
    if (payment) {
      setFormData(payment);
    } else {
      setFormData({
        customerId: "",
        customerName: "",
        serviceType: "",
        amount: "",
        paid: "",
        due: "0",
        paymentDate: "",
        transactionNumber: "",
        paymentMethod: "",
        status: "Unpaid"
      });
    }
    setErrors({});
  }, [payment, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If customer is selected, auto-fill customer name
    if (name === "customerId") {
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer) {
        setFormData(prev => ({ ...prev, customerName: selectedCustomer.name }));
      }
    }
    
    // Calculate due when amount or paid changes
    if (name === "amount" || name === "paid") {
      const amount = parseFloat(name === "amount" ? value : formData.amount) || 0;
      const paid = parseFloat(name === "paid" ? value : formData.paid) || 0;
      const due = Math.max(0, amount - paid);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        due: due.toString()
      }));
      
      // Auto update status based on payment
      if (amount > 0 && paid > 0) {
        if (paid >= amount) {
          setFormData(prev => ({ ...prev, status: "Paid" }));
        } else {
          setFormData(prev => ({ ...prev, status: "Partial" }));
        }
      }
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customerId) newErrors.customerId = "Customer is required";
    if (!formData.serviceType) newErrors.serviceType = "Service Type is required";
    if (!formData.amount) newErrors.amount = "Amount is required";
    else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }
    if (!formData.paid) newErrors.paid = "Paid amount is required";
    else if (isNaN(formData.paid) || parseFloat(formData.paid) < 0) {
      newErrors.paid = "Please enter a valid paid amount";
    }
    else if (parseFloat(formData.paid) > parseFloat(formData.amount)) {
      newErrors.paid = "Paid amount cannot exceed total amount";
    }
    if (!formData.paymentDate) newErrors.paymentDate = "Payment date is required";
    if (!formData.paymentMethod) newErrors.paymentMethod = "Payment method is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton style={{ backgroundColor: "#055fae" }}>
        <Modal.Title className="text-white">
          {payment ? "Edit Payment" : "Add New Payment"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <h6 className="text-primary border-bottom pb-2">Payment Information</h6>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Customer <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  isInvalid={!!errors.customerId}
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.id} - {customer.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.customerId}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Customer Name</Form.Label>
                <Form.Control
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  disabled
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Service Type <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  isInvalid={!!errors.serviceType}
                >
                  <option value="">Select Service Type</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.serviceType}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Overdue">Overdue</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Total Amount (BDT) <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  isInvalid={!!errors.amount}
                  placeholder="Enter total amount"
                  min="0"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.amount}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Paid Amount (BDT) <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="paid"
                  value={formData.paid}
                  onChange={handleChange}
                  isInvalid={!!errors.paid}
                  placeholder="Enter paid amount"
                  min="0"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.paid}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Due Amount (BDT)</Form.Label>
                <Form.Control
                  type="number"
                  name="due"
                  value={formData.due}
                  disabled
                  className="text-danger fw-bold"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Payment Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  isInvalid={!!errors.paymentDate}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.paymentDate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Payment Method <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  isInvalid={!!errors.paymentMethod}
                >
                  <option value="">Select Payment Method</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Mobile Banking">Mobile Banking</option>
                  <option value="Check">Check</option>
                  <option value="Credit Card">Credit Card</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.paymentMethod}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label>Transaction Number</Form.Label>
                <Form.Control
                  type="text"
                  name="transactionNumber"
                  value={formData.transactionNumber}
                  onChange={handleChange}
                  placeholder="Enter transaction number (if applicable)"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" style={{ backgroundColor: "#055fae" }}>
            {payment ? "Update" : "Save"} Payment
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};