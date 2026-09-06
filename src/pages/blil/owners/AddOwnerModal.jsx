import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { getCurrentDate } from "../../../utils/helper";
import { getLookups } from "../../../api/lookupapi";
import { getOwnerAssets } from "../../../api/ownerapi";
import { getOwnerDocs, downloadOwnerDoc, viewOwnerDoc } from "../../../api/ownerdocapi";
import { DateInput } from "../../../components/DateInput";  

import { use } from "react";

export const AddOwnerModal = ({ show, onHide, owner, onSave, viewMode = false }) => {
  const [agreementFile, setAgreementFile] = useState(null);
  const [agreementDocs, setAgreementDocs] = useState([]);
 
  const [lookups, setLookups] = useState({
    zones: [],
    districts: [],
    thanas: [],
    concernPersons: [],
  });
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

 useEffect(() => {
  if (!show) return;
  setLookupsLoading(true);
  setLookupError("");
  getLookups()
    .then((data) => {
      setLookups(data);
    })
    .catch((err) => {
      console.error("Lookup load failed", err);
      setLookupError("Address lists could not be loaded. Please try again.");
    })
    .finally(() => {
      setLookupsLoading(false);
    });
}, [show]);

  const [formData, setFormData] = useState({
    customerId: "",
    customerType: "",
    companyName: "",
    customerName: "",
    contactNumber: "",
    contactNumber2: "",
    area: "",
    district: "",
    districtCode: "",
    thana: "",
    thanaCode: "",
    fullAddress: "",
    receivedBy: "",
    agreementStart: "",
    freeServiceStartDate: "",
    freeServiceEndDate: "",
    serviceAmount: "",
    advanceAmount: "",
    adjustmentAmount: "",
    netpayableAmount: "",
    paidServiceStartDate: "",
    paidServiceEndDate: "",
    incrementAfterMonths: "",
    incrementAmount: "",
    totalIncrement: "",
    amendmentDate: "",
    assetType: "",
    liftModel: "",
    TotalLift: "",
    liftSize: "",
    capacity: "",
    quantity: "",
    handOverDate: "",
    maintenanceSchedule: "",
    paymentMethod: "",
    accountNumber: "",
    bankName: "",
    branchName: "",
    routingNumber: "",

    status: "Active",
  });

  const [errors, setErrors] = useState({});
  const [zoneSearch, setZoneSearch] = useState('');

 
  const emptyAsset = {
    assetId: "",
    assetType: "Lift",
    model: "",
    capacity: "",
    liftSize: "",
    handOverDate: "",
    maintenanceSchedule: "Monthly",
    status: "Active",
  };
  const [assets, setAssets] = useState([]);
  const [assetError, setAssetError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
  area: false,
  district: false,
  thana: false
});

const handleFieldBlur = (e) => {
  const { name, value } = e.target;
  
  
  if (name === 'area') {
    if (value.trim()) {
      const zoneExists = lookups.zones.some(z => 
        z.zoneName.toLowerCase() === value.trim().toLowerCase()
      );
      if (!zoneExists) {
        setErrors(prev => ({ ...prev, area: "Invalid Zone selected" }));
        setValidationErrors(prev => ({ ...prev, area: true }));
      } else {
        setErrors(prev => ({ ...prev, area: "" }));
        setValidationErrors(prev => ({ ...prev, area: false }));
      }
    }
  }
  
  if (name === 'district') {
    if (value.trim()) {
      const districtExists = lookups.districts.some(d => 
        d.districtName.toLowerCase() === value.trim().toLowerCase()
      );
      if (!districtExists) {
        setErrors(prev => ({ ...prev, district: "Invalid District selected" }));
        setValidationErrors(prev => ({ ...prev, district: true }));
        
        setFormData(prev => ({ ...prev, thana: "", thanaCode: "" }));
      } else {
        setErrors(prev => ({ ...prev, district: "" }));
        setValidationErrors(prev => ({ ...prev, district: false }));
      }
    }
  }
  
  if (name === 'thana') {
    if (value.trim() && formData.districtCode) {
      const thanaExists = lookups.thanas.some(t => 
        t.thanaName.toLowerCase() === value.trim().toLowerCase() &&
        t.districtCode === formData.districtCode
      );
      if (!thanaExists) {
        setErrors(prev => ({ ...prev, thana: "Invalid Thana selected" }));
        setValidationErrors(prev => ({ ...prev, thana: true }));
      } else {
        setErrors(prev => ({ ...prev, thana: "" }));
        setValidationErrors(prev => ({ ...prev, thana: false }));
      }
    }
  }
};

  // ---- inline asset grid: rows are edited directly in the table ----
  const updateAsset = (idx, name, value) => {
    setAssets((prev) =>
      prev.map((a, i) =>
        i !== idx
          ? a
          : {
              ...a,
              [name]: value,
              ...(name === "assetType" && value === "Generator"
                ? { liftSize: "" }
                : {}),
            }
      )
    );
    setAssetError("");
  };

  // new row pre-filled from the previous one (fast repeated entry)
  const addAssetRow = () => {
    setAssets((prev) => {
      const last = prev[prev.length - 1];
      const row = last ? { ...last, assetId: "" } : { ...emptyAsset, quantity: "1" };
      return [...prev, row];
    });
    setAssetError("");
  };

  const duplicateAsset = (idx) => {
    setAssets((prev) => {
      const copy = { ...prev[idx], assetId: "" };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  };

  const removeAsset = (idx) => {
    setAssets((prev) => prev.filter((_, i) => i !== idx));
  };

  // Load existing assets when editing
  useEffect(() => {
    if (show && owner?.customerId) {
      getOwnerAssets(owner.customerId)
        .then(setAssets)
        .catch(() => setAssets([]));
    }
    if (!show || !owner) setAssets([]);
    setAssetError("");
  }, [owner, show]);
  const [districtSearch, setDistrictSearch] = useState('');
  const [thanaSearch, setThanaSearch] = useState('');

 
  // useEffect(() => {
  //   if (!formData.freeServiceStartDate) return;
  //   if (!formData.freeServiceEndDate) {
  //     const d = new Date(formData.freeServiceStartDate);
  //     d.setFullYear(d.getFullYear() + 1);
  //     d.setDate(d.getDate() - 1);
  //     setFormData((prev) => ({
  //       ...prev,
  //       freeServiceEndDate: "",
  //     }));
  //   }
   
  // }, [formData.freeServiceStartDate]);

  // useEffect(() => {
  //   if (!formData.freeServiceEndDate || formData.paidServiceStartDate) return;
  //   const d = new Date(formData.freeServiceEndDate);
  //   d.setDate(d.getDate() + 1);
  //   setFormData((prev) => ({
  //     ...prev,
  //     paidServiceStartDate: "",
  //   }));
   
  // }, [formData.freeServiceEndDate]);

  // Auto-calculate net payable amount
useEffect(() => {
  const serviceAmount = parseFloat(formData.serviceAmount) || 0;
  const adjustmentAmount = parseFloat(formData.adjustmentAmount) || 0;
  const netPayable = serviceAmount - adjustmentAmount;
  

  const currentNetPayable = parseFloat(formData.netpayableAmount) || 0;
  if (Math.abs(netPayable - currentNetPayable) > 0.01) {
    setFormData(prev => ({
      ...prev,
      netpayableAmount: netPayable >= 0 ? netPayable.toFixed(2) : '0'
    }));
  }
}, [formData.serviceAmount, formData.adjustmentAmount]);

  // <input type="date"> only accepts yyyy-MM-dd; normalize whatever the API sends
  const toDateInput = (v) => {
    if (!v) return "";
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); // already ISO
    const d = new Date(s);
    if (isNaN(d)) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  useEffect(() => {
    setAgreementFile(null);
    if (owner?.customerId) {
      getOwnerDocs(owner.customerId)
        .then(setAgreementDocs)
        .catch(() => setAgreementDocs([]));
    } else {
      setAgreementDocs([]);
    }
    if (owner) {
      setFormData({
        ...owner,
        districtCode: owner.districtCode == null ? "" : String(owner.districtCode),
        thanaCode: owner.thanaCode == null ? "" : String(owner.thanaCode),
        receivedBy: owner.receivedBy == null ? "" : String(owner.receivedBy),
        agreementStart: toDateInput(owner.agreementStart),
        amendmentDate: toDateInput(owner.amendmentDate),
        freeServiceStartDate: toDateInput(owner.freeServiceStartDate),
        freeServiceEndDate: toDateInput(owner.freeServiceEndDate),
        paidServiceStartDate: toDateInput(owner.paidServiceStartDate),
        paidServiceEndDate: toDateInput(owner.paidServiceEndDate),
      });
    } else {
      setFormData({
        customerId: "",
        customerType: "",
        companyName: "",
        customerName: "",
        contactNumber: "",
        contactNumber2: "",
        area: "",
        district: "",
        districtCode: "",
        thana: "",
        thanaCode: "",
        fullAddress: "",
        agreementStart: getCurrentDate(),
        serviceAmount: "",
        advanceAmount: "",
        adjustmentAmount: "",
        netpayableAmount: "",
        incrementAfterMonths: "",
        incrementAmount: "",
        totalIncrement: "",
        amendmentDate: "",
        paidServiceStartDate: getCurrentDate(),
        paidServiceEndDate: "",
        paymentMethod: "",
        paymentType: "",
        accountNumber: "",
        bankName: "",
        branchName: "",
        routingNumber: "",
        receivedBy: "",
        status: "Active",
      });
    }
    setErrors({});
    setValidationErrors({ area: false, district: false, thana: false });
  }, [owner, show]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // District select: store code + display name, reset dependent thana
 const handleZoneChange = (e) => {
  const value = e.target.value;
  setFormData((prev) => ({ ...prev, area: value }));
  setZoneSearch(value);
  if (errors.area) {
    setErrors((prev) => ({ ...prev, area: "" }));
    setValidationErrors(prev => ({ ...prev, area: false }));
  }
};

// Handle District change with search
const handleDistrictChangeWithSearch = (e) => {
  const inputValue = e.target.value;
  setDistrictSearch(inputValue);
  
  // Find district by name
  const selectedDistrict = lookups.districts.find(
    d => d.districtName.toLowerCase() === inputValue.toLowerCase()
  );
  
  setFormData((prev) => ({
    ...prev,
    districtCode: selectedDistrict ? selectedDistrict.districtCode : "",
    district: inputValue,
    thanaCode: "",
    thana: "",
  }));
  
   setErrors((prev) => ({ ...prev, district: "", thana: "" }));
  setValidationErrors(prev => ({ ...prev, district: false, thana: false }));
};

// Handle Thana change with search
const handleThanaChangeWithSearch = (e) => {
  const inputValue = e.target.value;
  setThanaSearch(inputValue);
  
  // Find thana by name in current district
  const selectedThana = lookups.thanas.find(
    t => t.thanaName.toLowerCase() === inputValue.toLowerCase() && 
    t.districtCode === formData.districtCode
  );
  
  setFormData((prev) => ({
    ...prev,
    thanaCode: selectedThana ? selectedThana.thanaCode : "",
    thana: inputValue,
  }));
  
  // Clear error
  if (errors.thana) {
    setErrors((prev) => ({ ...prev, thana: "" }));
    setValidationErrors(prev => ({ ...prev, thana: false }));
  }
};



// Filter zones based on search
const filteredZones = useMemo(() => {
  if (!zoneSearch) return lookups.zones;
  return lookups.zones.filter(z => 
    z.zoneName.toLowerCase().includes(zoneSearch.toLowerCase())
  );
}, [lookups.zones, zoneSearch]);

// Filter districts based on search
const filteredDistricts = useMemo(() => {
  if (!districtSearch) return lookups.districts;
  return lookups.districts.filter(d => 
    d.districtName.toLowerCase().includes(districtSearch.toLowerCase())
  );
}, [lookups.districts, districtSearch]);

// Filter thanas based on search and district
const filteredThanas = useMemo(() => {
  let thanas = lookups.thanas.filter(
    t => t.districtCode === formData.districtCode
  );
  if (thanaSearch) {
    thanas = thanas.filter(t => 
      t.thanaName.toLowerCase().includes(thanaSearch.toLowerCase())
    );
  }
  return thanas;
}, [lookups.thanas, formData.districtCode, thanaSearch]);

  const validate = () => {
  const newErrors = {};
  const newValidationErrors = {
    area: false,
    district: false,
    thana: false
  };

  // Required field checks
  if (!formData.customerId || !formData.customerId.trim())
    newErrors.customerId = "Customer ID is required";
  if (!formData.customerType || !formData.customerType.trim())
    newErrors.customerType = "Customer Type is required";
  if (!formData.companyName)
    newErrors.companyName = "Company/House Name is required";
  if (!formData.customerName)
    newErrors.customerName = "Customer Name is required";
  if (!formData.contactNumber)
    newErrors.contactNumber = "Contact Number is required";
  
  // Check if Zone exists in lookup
  if (!formData.area) {
    newErrors.area = "Area/Zone is required";
    newValidationErrors.area = true;
  } else {
    const zoneExists = lookups.zones.some(z => 
      z.zoneName.toLowerCase() === formData.area.toLowerCase()
    );
    if (!zoneExists) {
      newErrors.area = "Invalid Zone selected.";
      newValidationErrors.area = true;
    }
  }

  // Check if District exists in lookup
  if (!formData.district) {
    newErrors.district = "District is required";
    newValidationErrors.district = true;
  } else {
    const districtExists = lookups.districts.some(d => 
      d.districtName.toLowerCase() === formData.district.toLowerCase()
    );
    if (!districtExists) {
      newErrors.district = "Invalid District selected";
      newValidationErrors.district = true;
    }
  }

  // Check if Thana exists in lookup
  if (!formData.thana) {
    newErrors.thana = "Thana is required";
    newValidationErrors.thana = true;
  } else {
    const thanaExists = lookups.thanas.some(t => 
      t.thanaName.toLowerCase() === formData.thana.toLowerCase() &&
      t.districtCode === formData.districtCode
    );
    if (!thanaExists) {
      newErrors.thana = "Invalid Thana selected";
      newValidationErrors.thana = true;
    }
  }

  // Other validations
  if (!formData.agreementStart)
    newErrors.agreementStart = "Agreement Start Date is required";
  if (!formData.paidServiceStartDate)
    newErrors.paidServiceStartDate = "Paid Service Start Date is required";
  if (!formData.paidServiceEndDate)
    newErrors.paidServiceEndDate = "Paid Service End Date is required";
  if (!formData.paymentMethod)
    newErrors.paymentMethod = "Payment Method is required";

  setErrors(newErrors);
  setValidationErrors(newValidationErrors);
  return Object.keys(newErrors).length === 0;
};
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting form with data:", formData, "and assets:", assets);
    const formOk = validate();
    console.log("Form validation result:", formOk);
    console.log("Asset validation result:", assets.length > 0);
    if (assets.length === 0) {
      setAssetError("Add at least one lift or generator");
    }
    if (formOk && assets.length > 0) {
      onSave({
        ...formData,
        assets: assets.filter((a) => (a.model || "").trim()),
        agreementFile,
      });
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static">
      <Modal.Header closeButton style={{ backgroundColor: "#055fae" }}>
        <Modal.Title className="text-white">
          {owner ? "Edit Owner" : "Add New Owner"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            {/* Personal Information */}
            <Col xs={12}>
              <h6 className="text-primary border-bottom pb-2">
                Personal Information
              </h6>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Customer ID<span className="text-danger">*</span> </Form.Label>
                <Form.Control
                  type="text"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  disabled={viewMode}
                />
              </Form.Group>
            </Col>

             <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>Customer Type<span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="customerType"
                  value={formData.customerType || ''}
                  onChange={handleChange}
                  disabled={viewMode}
                >
                  <option value="">Select Customer Type</option>
                  <option value="Private">Private</option>
                  <option value="Government">Government</option>
                  <option value="Inter Company">Inter Company</option>
                  
                </Form.Select>
              </Form.Group>
            </Col>

              <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>
                  Customer Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  disabled={viewMode} 
                  isInvalid={!!errors.customerName}
                  placeholder="Enter customer name"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.customerName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>
                  Company/House Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.companyName}
                  placeholder="Enter company/house name"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.companyName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

          

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>
                  Contact Number-1 <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  disabled={viewMode} 
                  isInvalid={!!errors.contactNumber}
                  placeholder="Enter contact number"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.contactNumber}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

             <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>
                  Contact Number-2
                </Form.Label>
                <Form.Control
                  type="text"
                  name="contactNumber2"
                  value={formData.contactNumber2}
                  onChange={handleChange}
                  isInvalid={!!errors.contactNumber2}
                  placeholder="Enter contact number"
                  disabled={viewMode}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.contactNumber2}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={viewMode}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Expired">Expired</option>
                </Form.Select>
              </Form.Group>
            </Col>


            {lookupError && (
              <Col xs={12} md={2}>
                <Alert variant="warning" className="py-2 mb-0">
                  {lookupError}
                </Alert>
              </Col>
            )}

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>
                  Area/Zone <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  list="zoneList"
                  name="area"
                  value={formData.area}
                  onChange={handleZoneChange}
                  onBlur={handleFieldBlur}
                  isInvalid={!!errors.area || validationErrors.area}
                  disabled={lookupsLoading || viewMode}
                  placeholder={lookupsLoading ? "Loading..." : "Type to search zone"}
                  autoComplete="off"
                />
                <datalist id="zoneList">  
                  {filteredZones.map((z) => (  
                    <option key={z.zoneId} value={z.zoneName} />
                  ))}
                </datalist>
                <Form.Control.Feedback type="invalid">
                  {errors.area}
                </Form.Control.Feedback>
                {errors.area && validationErrors.area && (
                  <div className="text-danger" style={{ fontSize: "0.875em" }}>
                    Please select from the list.
                  </div>
                )}
              </Form.Group>
            </Col>

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>
                  District <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  list="districtList"  
                  name="district"
                  value={formData.district}  
                  onChange={handleDistrictChangeWithSearch}
                  onBlur={handleFieldBlur}  
                  isInvalid={!!errors.district || validationErrors.district}
                  disabled={lookupsLoading || viewMode}
                  placeholder={lookupsLoading ? "Loading..." : "Type to search district"}  
                  autoComplete="off"  
                />
                <datalist id="districtList">  
                  {filteredDistricts.map((d) => (  
                    <option key={d.districtCode} value={d.districtName} />
                  ))}
                </datalist>
                <Form.Control.Feedback type="invalid">
                  {errors.district}
                </Form.Control.Feedback>
                {errors.district && validationErrors.district && (
                  <div className="text-danger" style={{ fontSize: "0.875em" }}>
                    Please select from the list.
                  </div>
                )}
              </Form.Group>
            </Col>

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>
                  Thana <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  list="thanaList"  
                  name="thana"
                  value={formData.thana}  
                  onChange={handleThanaChangeWithSearch} 
                  onBlur={handleFieldBlur} 
                  isInvalid={!!errors.thana || validationErrors.thana}
                  disabled={lookupsLoading || !formData.districtCode || viewMode}
                  placeholder={
                    lookupsLoading
                      ? "Loading..."
                      : !formData.districtCode
                      ? "Select district first"
                      : "Type to search thana"
                  }
                  autoComplete="off"  
                />
                <datalist id="thanaList">  
                  {filteredThanas.map((t) => ( 
                    <option key={t.thanaCode} value={t.thanaName} />
                  ))}
                </datalist>
                <Form.Control.Feedback type="invalid">
                  {errors.thana}
                </Form.Control.Feedback>
                {errors.thana && validationErrors.thana && (
                  <div className="text-danger" style={{ fontSize: "0.875em" }}>
                    Please select from the list.
                  </div>
                )}
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Full Address</Form.Label>
                <Form.Control
                  type="text"
                  name="fullAddress"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  isInvalid={!!errors.fullAddress}
                  disabled={viewMode}
                  placeholder="Enter full address"
                />
              </Form.Group>
            </Col>

            {/* Agreement Information */}
            <Col xs={12}>
              <h6 className="text-primary border-bottom pb-2 mt-2">
                Agreement Information
              </h6>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>
                  Agreement Start <span className="text-danger">*</span>
                </Form.Label>
                <DateInput
                  name="agreementStart"
                  value={formData.agreementStart}
                  onChange={handleChange}
                  disabled={viewMode} 
                  isInvalid={!!errors.agreementStart}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.agreementStart}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Monthly Service Amount </Form.Label>
                <Form.Control
                  type="text"
                  name="serviceAmount"
                  value={formData.serviceAmount}
                  onChange={handleChange}
                  disabled={viewMode} 
                  isInvalid={!!errors.serviceAmount}
                  placeholder="Enter service amount"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.serviceAmount}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Advance Amount</Form.Label>
                <Form.Control
                  type="text"
                  name="advanceAmount"
                  value={formData.advanceAmount}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.advanceAmount}
                  placeholder="Enter advance amount"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.advanceAmount}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Adjustment Amount</Form.Label>
                <Form.Control
                  type="text"
                  name="adjustmentAmount"
                  value={formData.adjustmentAmount}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.adjustmentAmount}
                  placeholder="Enter adjustment amount"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.adjustmentAmount}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Net Payable Amount</Form.Label>
                <Form.Control
                  type="text-readonly"
                  name="netpayableAmount"
                  value={formData.netpayableAmount}
                  onChange={handleChange}
                  disabled={true}
                  isInvalid={!!errors.netpayableAmount}
                  
                />
                <Form.Control.Feedback type="invalid">
                  {errors.netpayableAmount}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>
                  Payment Type <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="paymentType"
                  value={formData.paymentType || ''}
                  onChange={handleChange}
                  isInvalid={!!errors.paymentType}
                  disabled={viewMode}
                >
                  <option value="">Select Payment Type</option>
                  <option value="Bkash">On Service</option>
                  <option value="Nagad">Next Month</option>
                  <option value="Rocket">Quarterly</option>

                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Increment After Months </Form.Label>
                <Form.Control
                  type="text"
                  name="incrementAfterMonths"
                  value={formData.incrementAfterMonths}
                  onChange={handleChange}
                  disabled={viewMode} 
                  isInvalid={!!errors.incrementAfterMonths}
                  placeholder="Enter increment after months"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.incrementAfterMonths}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Increment Amount </Form.Label>
                <Form.Control
                  type="text"
                  name="incrementAmount"
                  value={formData.incrementAmount}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.incrementAmount}
                  placeholder="Enter increment amount"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.incrementAmount}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Free Service Start </Form.Label>
                <DateInput
                  name="freeServiceStartDate"
                  value={formData.freeServiceStartDate}
                  onChange={handleChange}
                  disabled={viewMode}
                />
               
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Free Service End</Form.Label>
                <DateInput
                  name="freeServiceEndDate"
                  value={formData.freeServiceEndDate}
                  onChange={handleChange}
                  disabled={viewMode}
                />
               
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>
                  Paid Service Start Date <span className="text-danger">*</span>
                </Form.Label>
                <DateInput
                  name="paidServiceStartDate"
                  value={formData.paidServiceStartDate}
                  onChange={handleChange}
                  disabled={viewMode}
                  placeholder="DD-MM-YYYY"
                  isInvalid={!!errors.paidServiceStartDate}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.paidServiceStartDate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>
                  Paid Service End Date <span className="text-danger">*</span>
                </Form.Label>
                <DateInput
                  name="paidServiceEndDate"
                  value={formData.paidServiceEndDate}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.paidServiceEndDate}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.paidServiceEndDate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Amendment Date</Form.Label>
                <DateInput
                  name="amendmentDate"
                  value={formData.amendmentDate}
                  onChange={handleChange}
                  disabled={viewMode}
                />
              </Form.Group>
            </Col>

            {/* Assets: multiple lifts / generators per customer */}
            <Col xs={12}>
              <h6 className="text-primary border-bottom pb-2 mt-2">
                Asset Information{" "}
                
              </h6>
            </Col>

            <Col xs={12}>
              <table className="table table-sm table-bordered align-middle mb-2">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "40px" }}>#</th>
                    <th style={{ minWidth: "110px" }}>Type</th>
                    <th style={{ minWidth: "150px" }}>Model</th>
                    <th style={{ minWidth: "110px" }}>Capacity</th>
                    <th style={{ minWidth: "110px" }}>Size</th>
                    <th style={{ width: "80px" }}>Qty</th>
                    <th style={{ minWidth: "140px" }}>Handover</th>
                    <th style={{ minWidth: "110px" }}>Schedule</th>
                    <th style={{ width: "80px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-2">
                        No assets yet
                      </td>
                    </tr>
                  )}
                  {assets.map((a, idx) => (
                    <tr key={a.assetId || `row-${idx}`}>
                      <td className="text-center">{idx + 1}</td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={a.assetType || ""}
                          onChange={(e) => updateAsset(idx, "assetType", e.target.value)}
                          disabled={viewMode}
                        >
                          <option value="Lift">Lift</option>
                          <option value="Generator">Generator</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={a.model || ""}
                          onChange={(e) => updateAsset(idx, "model", e.target.value)}
                          disabled={viewMode}
                        >
                          <option value="">Select Model</option>
                          {(lookups.assetModels || [])
                            .filter((m) => m.assetType === a.assetType)
                            .map((m) => (
                              <option key={m.modelId} value={m.modelName}>
                                {m.modelName}
                              </option>
                            ))}
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          value={a.capacity || ""}
                          onChange={(e) => updateAsset(idx, "capacity", e.target.value)}
                          disabled={viewMode}
                          placeholder={a.assetType === "Lift" ? "1000 kg" : "500 kVA"}
                        />
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          value={a.liftSize || ""}
                          onChange={(e) => updateAsset(idx, "liftSize", e.target.value)}
                          disabled={viewMode || a.assetType === "Generator"}
                          placeholder="8 Passengers"
                        />
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          min="1"
                          value={a.quantity || "1"}
                          onChange={(e) => updateAsset(idx, "quantity", e.target.value)}
                          disabled={viewMode}
                        />
                      </td>
                      <td>
                        <DateInput
                          size="sm"
                          name="handOverDate"
                          value={a.handOverDate || ""}
                          onChange={(e) => updateAsset(idx, "handOverDate", e.target.value)}
                          disabled={viewMode}
                        />
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={a.maintenanceSchedule || "Monthly"}
                          onChange={(e) =>
                            updateAsset(idx, "maintenanceSchedule", e.target.value)
                          }
                          disabled={viewMode}
                        >
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Yearly">Yearly</option>
                        </Form.Select>
                      </td>
                      <td className="text-center text-nowrap">
                        {!viewMode && (
                          <>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="me-1"
                              title="Duplicate this row"
                              onClick={() => duplicateAsset(idx)}
                            >
                              ⧉
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              title="Remove row"
                              onClick={() => removeAsset(idx)}
                            >
                              &times;
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!viewMode && (
                <div className="d-flex align-items-center gap-3">
                  <Button variant="outline-primary" size="sm" onClick={addAssetRow}>
                    + Add Asset Row
                  </Button>
                 
                </div>
              )}
              {assetError && <div className="text-danger small mt-1">{assetError}</div>}
            </Col>

            {/* Payment details */}
            <Col xs={12}>
              <h6 className="text-primary border-bottom pb-2 mt-2">
                Payment Details
              </h6>
            </Col>

            <Col xs={12} md={2}>
              <Form.Group>
                <Form.Label>
                  Payment Method <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="paymentMethod"
                  value={formData.paymentMethod || ''}
                  onChange={handleChange}
                  disabled={viewMode}
                >
                  <option value="">Select Payment Method</option>
                  <option value="Bkash">Bkash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="BEFTN">BEFTN</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </Form.Select>
              </Form.Group>
            </Col>

            
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Account Number</Form.Label>
                <Form.Control
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.accountNumber}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.accountNumber}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Bank Name</Form.Label>
                <Form.Control
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  disabled={viewMode} 
                  isInvalid={!!errors.bankName}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.bankName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

              <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Routing Number</Form.Label>
                <Form.Control
                  type="text"
                  name="routingNumber"
                  value={formData.routingNumber}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.routingNumber}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.routingNumber}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

              <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Branch Name</Form.Label>
                <Form.Control
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.branchName}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.branchName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label>Received By</Form.Label>
                <Form.Select
                  name="receivedBy"
                  value={formData.receivedBy || ""}
                  onChange={handleChange}
                  disabled={viewMode}
                  isInvalid={!!errors.receivedBy}
                >
                  <option value="">Select Employee</option>
                  {lookups.concernPersons.map((p) => (
                    <option key={p.staffId} value={String(p.staffId)}>
                      {p.staffName} ({p.staffId})
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.receivedBy}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          

          </Row>

          <Col xs={12}>
              <Form.Group>
                <Form.Label>Agreement Copy</Form.Label>
                {!viewMode && (
                  <Form.Control
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                  />
                )}
                {agreementDocs.length > 0 && (
                  <table className="table table-sm table-bordered align-middle mt-2 mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>File</th>
                        <th style={{ width: "110px" }}>Uploaded</th>
                        <th style={{ width: "110px" }}>By</th>
                        <th style={{ width: "130px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {agreementDocs.map((d) => (
                        <tr key={d.docId}>
                          <td className="text-truncate" style={{ maxWidth: "180px" }}>
                            {d.fileName}
                          </td>
                          <td>{d.uploadedDate || "-"}</td>
                          <td>{d.uploadedBy || "-"}</td>
                          <td className="text-nowrap">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              title="View in new tab"
                              onClick={() => viewOwnerDoc(d.docId)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              title="Download"
                              onClick={() => downloadOwnerDoc(d.docId, d.fileName)}
                            >
                              Save
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!viewMode && (
                  <Form.Text className="text-muted">
                    PDF / JPG / PNG 
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
        </Modal.Body>

       
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={onHide}>
            
            {viewMode ? "Close" : "Cancel"}
          </Button>
          {!viewMode && (  
      <Button
        variant="primary"
        size="sm"
        type="submit"
        style={{ backgroundColor: "#055fae" }}
      >
        {owner ? "Update" : "Save"} Owner
      </Button>
    )}
  </Modal.Footer>
      </Form>
    </Modal>
  );
};
