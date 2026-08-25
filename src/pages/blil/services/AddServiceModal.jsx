import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import { getOwnerAssets } from "../../../api/ownerapi";

const emptyForm = {
  serviceId: null,
  customerId: "",
  assetType: "",
  model: "",
  serviceType: "",
  serviceDate: "",
  nextServiceDate: "",
  technician: "",
  cost: "",
  status: "Pending",
  remark: "",
};

const SERVICE_TYPES = [
  "Monthly Schedule Servicing",
  "Spare Parts",
  "Emergency Repair",
  "Inspection",
  "Modification",
  "Installation",
  "Other",
];

const STATUSES = ["Pending", "Completed", "Cancelled"];

export const AddServiceModal = ({
  show,
  onHide,
  service,      
  owners,       
  viewMode = false,
  onSave,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [assets, setAssets] = useState([]);
  const [errors, setErrors] = useState({});

  // Customer ID search box (formData.customerId is only set after a valid search)
  const [customerIdInput, setCustomerIdInput] = useState("");
  const [foundCustomer, setFoundCustomer] = useState(null);

  // Populate on open
  useEffect(() => {
    if (show && service) {
      setFormData({ ...emptyForm, ...service });
      setCustomerIdInput(service.customerId || "");
      const owner = (owners || []).find(
        (o) =>
          (o.customerId || "").trim().toLowerCase() ===
          (service.customerId || "").trim().toLowerCase()
      );
      setFoundCustomer(owner || null);
    }
    if (show && !service) {
      setFormData(emptyForm);
      setCustomerIdInput("");
      setFoundCustomer(null);
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, show]);

  // Load the selected customer's assets for the asset dropdown
  useEffect(() => {
    if (show && formData.customerId) {
      getOwnerAssets(formData.customerId)
        .then(setAssets)
        .catch(() => setAssets([]));
    } else {
      setAssets([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, formData.customerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Search customer by ID; on success auto-fill name/address and unlock assets.
  // A new search resets the asset selection (old asset may not belong to new customer).
  const handleCustomerSearch = () => {
    const id = (customerIdInput || "").trim();
    if (!id) {
      setFoundCustomer(null);
      setFormData((prev) => ({ ...prev, customerId: "", assetType: "", model: "" }));
      setErrors((prev) => ({ ...prev, customerId: "Enter a Customer ID to search" }));
      return;
    }
    const owner = (owners || []).find(
      (o) => (o.customerId || "").trim().toLowerCase() === id.toLowerCase()
    );
    if (owner) {
      setFoundCustomer(owner);
      setFormData((prev) => ({
        ...prev,
        customerId: owner.customerId,
        assetType: "",
        model: "",
      }));
      setErrors((prev) => ({ ...prev, customerId: "" }));
    } else {
      setFoundCustomer(null);
      setFormData((prev) => ({ ...prev, customerId: "", assetType: "", model: "" }));
      setErrors((prev) => ({ ...prev, customerId: "Customer ID not found" }));
    }
  };

  // Asset dropdown value is "assetType||model" — split into the two fields
  const handleAssetChange = (e) => {
    const { value } = e.target;
    const [assetType, model] = value ? value.split("||") : ["", ""];
    setFormData((prev) => ({ ...prev, assetType, model }));
    if (errors.asset) setErrors((prev) => ({ ...prev, asset: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customerId) newErrors.customerId = "Customer is required";
    if (!formData.serviceType) newErrors.serviceType = "Service Type is required";
    if (!formData.serviceDate) newErrors.serviceDate = "Service Date is required";
    if (formData.cost !== "" && formData.cost != null) {
      if (isNaN(formData.cost) || parseFloat(formData.cost) < 0)
        newErrors.cost = "Please enter a valid cost";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (viewMode) return;
    if (validate()) onSave(formData);
  };

  const assetValue =
    formData.assetType && formData.model
      ? `${formData.assetType}||${formData.model}`
      : "";

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton style={{ backgroundColor: "#055fae" }}>
        <Modal.Title className="text-white">
          {viewMode
            ? "Service Record"
            : service
            ? "Edit Service Record"
            : "Add New Service Entry"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <h6 className="text-primary border-bottom pb-2">
                Service Information
              </h6>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>
                  Customer ID <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={customerIdInput}
                    onChange={(e) => setCustomerIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomerSearch();
                      }
                    }}
                    disabled={viewMode}
                    isInvalid={!!errors.customerId}
                    placeholder="Enter Customer ID"
                  />
                  <Button
                    variant="outline-primary"
                    onClick={handleCustomerSearch}
                    disabled={viewMode}
                    title="Search Customer"
                  >
                    <FaSearch />
                  </Button>
                  <Form.Control.Feedback type="invalid">
                    {errors.customerId}
                  </Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Customer Name</Form.Label>
                <Form.Control
                  type="text"
                  value={
                    foundCustomer
                      ? foundCustomer.companyName || foundCustomer.customerName || ""
                      : ""
                  }
                  readOnly
                  disabled
                  placeholder="Auto-filled after search"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  value={foundCustomer ? foundCustomer.fullAddress || "" : ""}
                  readOnly
                  disabled
                  placeholder="Auto-filled after search"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Asset (Lift / Generator)</Form.Label>
                <Form.Select
                  name="asset"
                  value={assetValue}
                  onChange={handleAssetChange}
                  disabled={viewMode || !formData.customerId}
                >
                  <option value="">
                    {formData.customerId
                      ? assets.length
                        ? "Select Asset"
                        : "No assets for this customer"
                      : "Search Customer ID first"}
                  </option>
                  {assets.map((a, idx) => (
                    <option
                      key={`${a.assetType}-${a.model}-${idx}`}
                      value={`${a.assetType}||${a.model}`}
                    >
                      {a.assetType} — {a.model}
                      {a.capacity ? ` (${a.capacity})` : ""}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>
                  Service Type <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="serviceType"
                  value={formData.serviceType || ""}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.serviceType}
                >
                  <option value="">Select Service Type</option>
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.serviceType}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>
                  Service Date <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  name="serviceDate"
                  value={formData.serviceDate || ""}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.serviceDate}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.serviceDate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Next Service Date</Form.Label>
                <Form.Control
                  type="date"
                  name="nextServiceDate"
                  value={formData.nextServiceDate || ""}
                  onChange={handleChange}
                  disabled={viewMode}
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Technician</Form.Label>
                <Form.Control
                  type="text"
                  name="technician"
                  value={formData.technician || ""}
                  onChange={handleChange}
                  disabled={viewMode}
                  placeholder="Technician name"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Cost</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  name="cost"
                  value={formData.cost || ""}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.cost}
                  placeholder="Service cost"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.cost}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status || "Pending"}
                  onChange={handleChange}
                  disabled={viewMode}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label>Remark</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="remark"
                  value={formData.remark || ""}
                  onChange={handleChange}
                  disabled={viewMode}
                  placeholder="Notes about the servicing"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            {viewMode ? "Close" : "Cancel"}
          </Button>
          {!viewMode && (
            <Button
              type="submit"
              variant="primary"
              style={{ backgroundColor: "#055fae" }}
            >
              {service ? "Update" : "Save"}
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
