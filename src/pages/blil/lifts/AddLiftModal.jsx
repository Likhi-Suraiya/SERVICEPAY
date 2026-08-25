import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

export const AddLiftModal = ({ show, onHide, lift, onSave }) => {
  const [formData, setFormData] = useState({
    type: "",
    brand: "",
    capacity: "",
    status: "Active",
   
  });

  const [errors, setErrors] = useState({});

  // Mock customers for dropdown
  const customers = [
    { id: "CUST-001", name: "ABC Corporation" },
    { id: "CUST-002", name: "XYZ Ltd." },
    { id: "CUST-003", name: "PQR Enterprises" },
    { id: "CUST-004", name: "LMN Corporation" }
  ];

  useEffect(() => {
    if (lift) {
      setFormData(lift);
    } else {
      setFormData({
        type: "",
        brand: "",
        capacity: "",
        status: "Active",
        
      });
    }
    setErrors({});
  }, [lift, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    
    if (name === "customerId") {
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer) {
        setFormData(prev => ({ ...prev, customerName: selectedCustomer.name }));
      }
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.type) newErrors.type = "Lift Type is required";
    if (!formData.brand) newErrors.brand = "Brand is required";
    if (!formData.capacity) newErrors.capacity = "Capacity is required";
    
    
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
          {lift ? "Edit Lift" : "Add New Lift"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <h6 className="text-primary border-bottom pb-2">Lift Information</h6>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Lift Type <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  isInvalid={!!errors.type}
                >
                  <option value="">Select Type</option>
                  <option value="Passenger">Passenger</option>
                  <option value="Cargo">Cargo</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Service">Service</option>
                  <option value="Escalator">Escalator</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.type}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Brand <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  isInvalid={!!errors.brand}
                  placeholder="Enter brand name"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.brand}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Capacity <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  isInvalid={!!errors.capacity}
                  placeholder="e.g., 800 kg"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.capacity}
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Pending Installation">Pending Installation</option>
                  <option value="Out of Service">Out of Service</option>
                </Form.Select>
              </Form.Group>
            </Col>

            
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" style={{ backgroundColor: "#055fae" }}>
            {lift ? "Update" : "Save"} Lift
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};