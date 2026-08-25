import React, { useState, useMemo, useRef } from "react";
import {
  Table,
  Form,
  InputGroup,
  Button,
  Row,
  Col,
  Badge,
  Spinner,
  Card,
  Alert,
  Collapse,
} from "react-bootstrap";
import {
  FaSearch,
  FaPlus,
  FaTrash,
  FaHistory,
  FaSave,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { getOwners, getOwnerAssets } from "../../../api/ownerapi";
import { getServicesByCustomer } from "../../../api/serviceapi";
import { getCalendarByCustomer } from "../../../api/calendarapi";
import { createInvoice, getInvoiceItems } from "../../../api/invoiceapi";
import { cancelInvoice, getPayableInvoice } from "../../../api/paymentapi";
import { generateInvoicePdf } from "../../../utils/invoicePdf";
import { searchSpareItems } from "../../../api/spareapi";
import { useNavigate } from "react-router-dom";

const today = () => new Date().toISOString().slice(0, 10);

const MONTHLY = "Monthly Schedule Service";
const PAID = "Paid Service";
const PAID_SUBTYPES = [
  "Modification",
  "Emergency Repair",
  "Inspection",
  "Spare Parts",
  "Installation",
  "Upgrade",
];

const emptyItem = { itemName: "", quantity: "1", unitPrice: "", remark: "" };

// Component name kept as ServiceList so the existing route needs no change
export const ServiceList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const actionBy = user?.userId || user?.userName || user?.username || "WEB";

  // ---- customer ----
  const [customerIdInput, setCustomerIdInput] = useState("");
  const [customer, setCustomer] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [assets, setAssets] = useState([]);
  const [calendar, setCalendar] = useState([]);

  // ---- service details ----
  const [serviceType, setServiceType] = useState(""); // MONTHLY | PAID
  const [paidSubType, setPaidSubType] = useState("");
  const [visitAsset, setVisitAsset] = useState("");
  const [technician, setTechnician] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [visitRemark, setVisitRemark] = useState("");

  // ---- items ----
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestTimer = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastInvoiceNo, setLastInvoiceNo] = useState("");

  // ---- history ----
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [breakdowns, setBreakdowns] = useState({}); // invoiceNo -> items[]

  // ---- derived ----
  const scheduledMonths = useMemo(
    () => calendar.filter((c) => c.serviceStatus === "Scheduled"),
    [calendar]
  );
  const currentMonth = scheduledMonths[0] || null;
  const nextMonth = scheduledMonths[1] || null;
  const isMonthly = serviceType === MONTHLY;

  const itemTotal = (it) =>
    (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0);

  const grandTotal = useMemo(() => {
    let t = items.reduce((sum, it) => sum + itemTotal(it), 0);
    if (isMonthly && currentMonth)
      t += parseFloat(currentMonth.monthlyAmount) || 0;
    return t;
  }, [items, isMonthly, currentMonth]);

  const resetEntry = () => {
    setServiceType("");
    setPaidSubType("");
    setVisitAsset("");
    setTechnician("");
    setInvoiceDate(today());
    setVisitRemark("");
    setItems([]);
    setItemForm(emptyItem);
  };

  // ---- search ----
  const handleSearch = async () => {
    const id = (customerIdInput || "").trim();
    if (!id) return;
    setIsSearching(true);
    setSearchError("");
    setLastInvoiceNo("");
    try {
      const owners = await getOwners();
      const found = owners.find(
        (o) => (o.customerId || "").trim().toLowerCase() === id.toLowerCase()
      );
      if (!found) {
        setCustomer(null);
        setAssets([]);
        setCalendar([]);
        setHistory([]);
        setHistoryLoaded(false);
        resetEntry();
        setSearchError("Customer ID not found");
        return;
      }
      setCustomer(found);
      resetEntry();
      setHistoryLoaded(false);
      setShowHistory(false);
      setExpandedInvoice(null);
      setBreakdowns({});
      const [a, cal] = await Promise.all([
        getOwnerAssets(found.customerId).catch(() => []),
        getCalendarByCustomer(found.customerId).catch(() => []),
      ]);
      setAssets(a);
      setCalendar(cal);
      // Monthly maintenance auto-selected by default (user can switch to Paid)
      if (cal.some((c) => c.serviceStatus === "Scheduled")) {
        setServiceType(MONTHLY);
      }
    } catch (err) {
      setSearchError(err.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  // ---- history ----
  const toggleHistory = async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && !historyLoaded && customer) {
      try {
        setHistory(await getServicesByCustomer(customer.customerId));
        setHistoryLoaded(true);
      } catch (err) {
        toast.error(err.message || "Failed to load history");
      }
    }
  };

  const toggleBreakdown = async (invoiceNo) => {
    if (expandedInvoice === invoiceNo) {
      setExpandedInvoice(null);
      return;
    }
    setExpandedInvoice(invoiceNo);
    if (!breakdowns[invoiceNo]) {
      try {
        const its = await getInvoiceItems(invoiceNo);
        setBreakdowns((prev) => ({ ...prev, [invoiceNo]: its }));
      } catch {
        setBreakdowns((prev) => ({ ...prev, [invoiceNo]: [] }));
      }
    }
  };

  // ---- items ----
  const fi = (name) => (e) =>
    setItemForm((p) => ({ ...p, [name]: e.target.value }));

  // spare-parts type-ahead: query the backend as the user types
  const handleItemNameChange = (e) => {
    const value = e.target.value;
    setItemForm((prev) => ({ ...prev, itemName: value }));
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        const res = await searchSpareItems(value);
        setSuggestions(res);
        setShowSuggest(true);
      } catch (err) {
        console.error("Spare search failed:", err);
        toast.error(err.message || "Spare item search failed", {
          toastId: "spare-search-error",
        });
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 300);
  };

  // selecting a suggestion fills the name AND the price automatically
  const pickSuggestion = (sp) => {
    setItemForm((prev) => ({
      ...prev,
      itemName: sp.itemName,
      unitPrice: sp.salePrice || prev.unitPrice,
    }));
    setShowSuggest(false);
    setSuggestions([]);
  };

  const addItem = () => {
    if (!itemForm.itemName.trim()) return toast.warn("Item name is required");
    if (!itemForm.quantity || parseFloat(itemForm.quantity) <= 0)
      return toast.warn("Quantity must be greater than zero");
    setItems((prev) => [...prev, { ...itemForm }]);
    setItemForm(emptyItem);
  };

  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  // ---- invoice PDF (record copy) ----
  const downloadInvoicePdf = async (invoiceNo, fallback = {}) => {
    try {
      const [inv, invItems] = await Promise.all([
        getPayableInvoice(invoiceNo),
        getInvoiceItems(invoiceNo),
      ]);
      await generateInvoicePdf({
        customer,
        invoice: {
          ...inv,
          technician: inv?.technician || fallback.technician || "",
          serviceMonth: inv?.serviceMonth || fallback.serviceMonth || "",
        },
        items: invItems,
      });
    } catch (err) {
      toast.warn(err.message || "Invoice saved, but the PDF could not be generated");
    }
  };

  // ---- cancel invoice (replaces edit) ----
  const handleCancelInvoice = async (h) => {
    const reason = window.prompt(
      `Cancel invoice ${h.invoiceNo}? This voids the invoice, removes the history record, and reopens the calendar month.\n\nReason (optional):`
    );
    if (reason === null) return; // user aborted
    try {
      await cancelInvoice(h.invoiceNo, reason, actionBy);
      toast.success(`Invoice ${h.invoiceNo} cancelled`);
      const cal = await getCalendarByCustomer(customer.customerId).catch(() => []);
      setCalendar(cal);
      setHistory(await getServicesByCustomer(customer.customerId).catch(() => []));
    } catch (err) {
      toast.error(err.message || "Cancel failed");
    }
  };

  // ---- save ----
  const handleSave = async () => {
    if (!customer) return;
    if (!serviceType) return toast.warn("Select the Service Type");
    if (isMonthly && !currentMonth)
      return toast.warn("No pending calendar month for this customer");
    if (!isMonthly && !paidSubType)
      return toast.warn("Select the Paid Service type");
    const [assetType, model] = (visitAsset || "").split("||");
    if (assetType !== "Lift" && assetType !== "Generator")
      return toast.warn("Select the asset — it decides the invoice number (L/G)");

    const lineItems = [...items];
    if (isMonthly && currentMonth) {
      lineItems.unshift({
        itemName: "Monthly Service",
        quantity: "1",
        unitPrice: currentMonth.monthlyAmount || "0",
        remark: `Calendar month due ${currentMonth.dueDate}`,
      });
    }
    if (lineItems.length === 0)
      return toast.warn("Add at least one item");

    setIsSaving(true);
    try {
      const { invoiceNo } = await createInvoice(
        {
          customerId: customer.customerId,
          assetType,
          model: model || "",
          serviceType: isMonthly ? MONTHLY : paidSubType,
          technician,
          invoiceDate,
          calendarId: isMonthly && currentMonth ? currentMonth.calendarId : null,
          remark: visitRemark,
          items: lineItems,
        },
        actionBy
      );
      setLastInvoiceNo(invoiceNo || "");
      toast.success(
        items.some((it) => it.itemName !== "Monthly Service")
          ? `Invoice ${invoiceNo} sent for management approval`
          : `Invoice ${invoiceNo} generated`
      );
      // auto-download the invoice PDF for the hard-copy record
      // (comment the next line out if you prefer button-only printing)
      // if (invoiceNo)
      //   await downloadInvoicePdf(invoiceNo, {
      //     technician,
      //     serviceMonth:
      //       isMonthly && currentMonth?.serviceMonth
      //         ? currentMonth.serviceMonth
      //         : "",
      //   });
      resetEntry();
      const cal = await getCalendarByCustomer(customer.customerId).catch(() => []);
      setCalendar(cal);
      if (historyLoaded)
        setHistory(await getServicesByCustomer(customer.customerId).catch(() => []));
    } catch (err) {
      toast.error(err.message || "Invoice failed — nothing was saved");
    } finally {
      setIsSaving(false);
    }
  };

  const payBadge = (s) => {
    const variants = { Paid: "success", Partial: "warning", Unpaid: "secondary" };
    return <Badge bg={variants[s] || "secondary"}>{s}</Badge>;
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <div className="p-3">
        {/* ================= 1. CUSTOMER ================= */}
        <Card className="shadow-sm mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center py-2">
            <strong>
              <i className="bx bx-wrench me-2"></i>Service Entry
            </strong>
            {customer && (
              <Button variant="outline-secondary" size="sm" onClick={toggleHistory}>
                <FaHistory className="me-1" />
                {showHistory ? "Hide History" : "Service History"}
              </Button>
            )}
          </Card.Header>
          <Card.Body className="py-3">
            {lastInvoiceNo && (
              <Alert variant="success" className="py-2">
                Invoice generated: <strong>{lastInvoiceNo}</strong>
              </Alert>
            )}
            <Row className="g-3">
              <Col xs={12} md={3}>
                <Form.Label className="fw-semibold">
                  Customer ID <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    value={customerIdInput}
                    onChange={(e) => setCustomerIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="Enter Customer ID"
                    isInvalid={!!searchError}
                  />
                  <Button
                    variant="primary"
                    style={{ backgroundColor: "#055fae" }}
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      <FaSearch />
                    )}
                  </Button>
                  <Form.Control.Feedback type="invalid">
                    {searchError}
                  </Form.Control.Feedback>
                </InputGroup>
              </Col>
              <Col xs={12} md={3}>
                <Form.Label className="fw-semibold">Customer Name</Form.Label>
                <Form.Control
                  readOnly
                  value={customer ? customer.companyName || customer.customerName : ""}
                />
              </Col>
              <Col xs={12} md={4}>
                <Form.Label className="fw-semibold">Address</Form.Label>
                <Form.Control readOnly value={customer?.fullAddress || ""} />
              </Col>
              <Col xs={12} md={2}>
                <Form.Label className="fw-semibold">Zone</Form.Label>
                <Form.Control readOnly value={customer?.area || ""} />
              </Col>
            </Row>

            {customer && (
              <Row className="g-3 mt-1">
                <Col xs={12} md={6}>
                  <div
                    className={`border rounded p-2 ${
                      currentMonth?.overdue ? "border-danger" : ""
                    }`}
                  >
                    <small className="text-muted d-block">
                      This Month's Service
                    </small>
                    {currentMonth ? (
                      <span>
                        Due <strong>{currentMonth.dueDate}</strong> · Amount{" "}
                        <strong>{currentMonth.monthlyAmount}</strong>{" "}
                        {payBadge(currentMonth.paymentStatus)}{" "}
                        {currentMonth.overdue && <Badge bg="danger">Overdue</Badge>}
                      </span>
                    ) : (
                      <span className="text-muted">No pending month</span>
                    )}
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div className="border rounded p-2">
                    <small className="text-muted d-block">
                      Next Service Schedule (auto)
                    </small>
                    <strong>{nextMonth ? nextMonth.dueDate : "—"}</strong>
                  </div>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {customer && (
          <>
            {/* ================= 2. SERVICE DETAILS ================= */}
            <Card className="shadow-sm mb-3">
              <Card.Header className="py-2">
                <strong>Service Details</strong>
              </Card.Header>
              <Card.Body className="py-3">
                <Row className="g-3">
                  <Col xs={12} md={3}>
                    <Form.Label className="fw-semibold">
                      Service Type <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={serviceType}
                      onChange={(e) => {
                        setServiceType(e.target.value);
                        setPaidSubType("");
                      }}
                    >
                      <option value="">Select Service Type</option>
                      <option value={MONTHLY}>{MONTHLY}</option>
                      <option value={PAID}>{PAID}</option>
                    </Form.Select>
                  </Col>

                  {serviceType === PAID && (
                    <Col xs={12} md={3}>
                      <Form.Label className="fw-semibold">
                        Paid Service Type <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        value={paidSubType}
                        onChange={(e) => setPaidSubType(e.target.value)}
                      >
                        <option value="">Select Type</option>
                        {PAID_SUBTYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  )}

                  <Col xs={12} md={3}>
                    <Form.Label className="fw-semibold">
                      Asset <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={visitAsset}
                      onChange={(e) => setVisitAsset(e.target.value)}
                    >
                      <option value="">Select Asset</option>
                      {assets.map((a, idx) => (
                        <option
                          key={`${a.assetType}-${a.model}-${idx}`}
                          value={`${a.assetType}||${a.model}`}
                        >
                          {a.assetType} — {a.model}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col xs={12} md={serviceType === PAID ? 2 : 3}>
                    <Form.Label className="fw-semibold">Technician</Form.Label>
                    <Form.Control
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                      placeholder="Name"
                    />
                  </Col>

                  <Col xs={12} md={serviceType === PAID ? 1 : 3}>
                    <Form.Label className="fw-semibold">Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </Col>
                </Row>

                {isMonthly && !currentMonth && (
                  <Alert variant="warning" className="py-2 mt-3 mb-0">
                    No pending month in the calendar — choose Paid Service instead.
                  </Alert>
                )}
              </Card.Body>
            </Card>

            {/* ================= 3. INVOICE ITEMS ================= */}
            <Card className="shadow-sm mb-3">
              <Card.Header className="py-2">
                <strong>Invoice Items</strong>{" "}
                
                {isMonthly && (
                  <small className="text-muted ms-2">
                    (Monthly service is auto-added;)
                  </small>
                )}
              </Card.Header>
              <Card.Body className="py-3">
                <Row className="g-2 align-items-end mb-3">
                  <Col xs={12} md={3} style={{ position: "relative" }}>
                    <Form.Label>Item</Form.Label>
                    <Form.Control
                      value={itemForm.itemName}
                      onChange={handleItemNameChange}
                      onFocus={() =>
                        suggestions.length > 0 && setShowSuggest(true)
                      }
                      onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
                      placeholder="Type to search spare parts..."
                      autoComplete="off"
                    />
                    {showSuggest && (
                      <div
                        className="border bg-white shadow-sm rounded"
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 1060,
                          maxHeight: "240px",
                          overflowY: "auto",
                        }}
                      >
                        {suggestLoading && (
                          <div className="px-2 py-1 text-muted small">
                            Searching...
                          </div>
                        )}
                        {!suggestLoading && suggestions.length === 0 && (
                          <div className="px-2 py-1 text-muted small">
                            No matching item — free text is allowed
                          </div>
                        )}
                        {suggestions.map((sp) => (
                          <div
                            key={sp.itemId}
                            className="px-2 py-1 border-bottom suggestion-row"
                            style={{ cursor: "pointer" }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              pickSuggestion(sp);
                            }}
                          >
                            <div className="fw-semibold small">
                              {sp.itemName}
                            </div>
                            <div
                              className="d-flex justify-content-between text-muted"
                              style={{ fontSize: "11px" }}
                            >
                              <span>
                                {sp.groupName || ""}
                                {sp.unitName ? ` · ${sp.unitName}` : ""}
                              </span>
                              <span className="fw-semibold">
                                Tk {sp.salePrice || "-"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Col>
                  <Col xs={4} md={1}>
                    <Form.Label>Qty</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={itemForm.quantity}
                      onChange={fi("quantity")}
                    />
                  </Col>
                  <Col xs={4} md={2}>
                    <Form.Label>Price</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={itemForm.unitPrice}
                      onChange={fi("unitPrice")}
                      placeholder="Per unit"
                    />
                  </Col>
                  <Col xs={4} md={2}>
                    <Form.Label>Total</Form.Label>
                    <Form.Control readOnly value={itemTotal(itemForm) || ""} />
                  </Col>
                  <Col xs={10} md={3}>
                    <Form.Label>Remark</Form.Label>
                    <Form.Control value={itemForm.remark} onChange={fi("remark")} />
                  </Col>
                  <Col xs={2} md={1}>
                    <Button
                      variant="outline-primary"
                      className="w-100"
                      onClick={addItem}
                    >
                      <FaPlus />
                    </Button>
                  </Col>
                </Row>

                <div className="table-responsive">
                  <Table bordered size="sm" className="mb-2">
                    <thead style={{ backgroundColor: "#e7e7ff" }}>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total Amount</th>
                        <th>Remark</th>
                        <th style={{ width: "50px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isMonthly && currentMonth && (
                        <tr className="table-primary">
                          <td>
                            Monthly Service
                          </td>
                          <td>1</td>
                          <td>{currentMonth.monthlyAmount}</td>
                          <td>{currentMonth.monthlyAmount}</td>
                          <td>Due {currentMonth.dueDate}</td>
                          <td></td>
                        </tr>
                      )}
                      {items.length === 0 && !(isMonthly && currentMonth) ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-3">
                            No items added yet
                          </td>
                        </tr>
                      ) : (
                        items.map((it, idx) => (
                          <tr key={idx}>
                            <td>{it.itemName}</td>
                            <td>{it.quantity}</td>
                            <td>{it.unitPrice || "-"}</td>
                            <td>{itemTotal(it)}</td>
                            <td>{it.remark || "-"}</td>
                            <td className="text-center">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeItem(idx)}
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                      {(items.length > 0 || (isMonthly && currentMonth)) && (
                        <tr className="fw-bold">
                          <td colSpan={3} className="text-end">
                            Grand Total
                          </td>
                          <td>{grandTotal}</td>
                          <td colSpan={2}></td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                <Row className="g-2">
                  <Col xs={12} md={9}>
                    <Form.Control
                      placeholder="Invoice remark (optional)"
                      value={visitRemark}
                      onChange={(e) => setVisitRemark(e.target.value)}
                    />
                  </Col>
                  <Col xs={12} md={3} className="d-grid">
                    <Button
                      variant="primary"
                      style={{ backgroundColor: "#055fae" }}
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Spinner size="sm" animation="border" className="me-1" />
                      ) : (
                        <FaSave className="me-1" />
                      )}
                      Save 
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* ================= 4. HISTORY ================= */}
            <Collapse in={showHistory}>
              <div>
                <Card className="shadow-sm mb-3">
                  <Card.Header className="py-2">
                    <strong>
                      Service History —{" "}
                      {customer.companyName || customer.customerName}
                    </strong>
                  </Card.Header>
                  <Card.Body className="py-3">
                    <div className="table-responsive">
                      <Table striped bordered size="sm" className="mb-0">
                        <thead style={{ backgroundColor: "#e7e7ff" }}>
                          <tr>
                            <th style={{ width: "30px" }}></th>
                            <th>Date</th>
                            <th>Invoice No</th>
                            <th>Service Type</th>
                            <th>Item</th>
                            <th>Asset</th>
                            <th>Technician</th>
                            <th>Total Cost</th>
                            <th>Status</th>
                            <th style={{ width: "130px" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="text-center text-muted py-3">
                                No service history yet
                              </td>
                            </tr>
                          ) : (
                            history.map((h) => (
                              <React.Fragment key={h.serviceId}>
                                <tr
                                  style={{ cursor: h.invoiceNo ? "pointer" : "default" }}
                                  onClick={() =>
                                    h.invoiceNo && toggleBreakdown(h.invoiceNo)
                                  }
                                >
                                  <td className="text-center">
                                    {h.invoiceNo &&
                                      (expandedInvoice === h.invoiceNo ? (
                                        <FaChevronDown size={11} />
                                      ) : (
                                        <FaChevronRight size={11} />
                                      ))}
                                  </td>
                                  <td>{h.serviceDate}</td>
                                  <td>{h.invoiceNo || "-"}</td>
                                  <td>{h.serviceType}</td>
                                  <td>{h.itemsSummary || "-"}</td>
                                  <td>
                                    {h.assetType
                                      ? `${h.assetType} — ${h.model || ""}`
                                      : "All"}
                                  </td>
                                  <td>{h.technician || "-"}</td>
                                  <td className="fw-semibold">{h.cost || "-"}</td>
                                  <td>
                                    {h.invoiceNo ? (
                                      <>
                                        <Badge
                                          bg={
                                            h.paymentStatus === "Paid"
                                              ? "success"
                                              : h.paymentStatus === "Partial"
                                              ? "warning"
                                              : "secondary"
                                          }
                                        >
                                          {h.paymentStatus || "Unpaid"}
                                        </Badge>
                                        {h.approvalStatus === "Pending" && (
                                          <Badge
                                            bg="warning"
                                            text="dark"
                                            className="d-block mt-1"
                                          >
                                            Awaiting Approval
                                          </Badge>
                                        )}
                                      </>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td onClick={(e) => e.stopPropagation()}>
                                    {h.invoiceNo && (
                                      <div className="d-flex gap-1">
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          title="Download invoice PDF"
                                          onClick={() =>
                                            downloadInvoicePdf(h.invoiceNo, {
                                              technician: h.technician,
                                            })
                                          }
                                        >
                                          PDF
                                        </Button>
                                        {h.paymentStatus !== "Paid" && h.approvalStatus !== "Pending" && (
                                          <Button
                                            variant="outline-success"
                                            size="sm"
                                            title="Receive payment"
                                            onClick={() =>
                                              navigate(
                                                `/blil/payments?invoice=${h.invoiceNo}`
                                              )
                                            }
                                          >
                                            Pay
                                          </Button>
                                        )}
                                        {(!h.paymentStatus ||
                                          h.paymentStatus === "Unpaid") && (
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            title="Cancel invoice"
                                            onClick={() => handleCancelInvoice(h)}
                                          >
                                            Cancel
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                                {h.invoiceNo && expandedInvoice === h.invoiceNo && (
                                  <tr>
                                    <td></td>
                                    <td colSpan={9} className="p-2 bg-light">
                                      {!breakdowns[h.invoiceNo] ? (
                                        <Spinner size="sm" animation="border" />
                                      ) : breakdowns[h.invoiceNo].length === 0 ? (
                                        <span className="text-muted">
                                          No item breakdown found
                                        </span>
                                      ) : (
                                        <Table size="sm" bordered className="mb-0">
                                          <thead>
                                            <tr>
                                              <th>Item</th>
                                              <th>Quantity</th>
                                              <th>Price</th>
                                              <th>Total</th>
                                              <th>Remark</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {breakdowns[h.invoiceNo].map((it) => (
                                              <tr key={it.itemId}>
                                                <td>{it.itemName}</td>
                                                <td>{it.quantity}</td>
                                                <td>{it.unitPrice}</td>
                                                <td>{it.totalAmount}</td>
                                                <td>{it.remark || "-"}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </Table>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Collapse>
          </>
        )}

        {!customer && !searchError && (
          <Alert variant="light" className="text-center text-muted border">
            Search a Customer ID to start a service entry
          </Alert>
        )}
      </div>
    </>
  );
};
