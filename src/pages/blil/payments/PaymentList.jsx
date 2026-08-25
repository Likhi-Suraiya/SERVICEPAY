import React, { useState, useEffect, useMemo } from "react";
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
import { FaSearch, FaHistory, FaSave, FaMoneyBillWave } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getOwners } from "../../../api/ownerapi";
import { getLookups } from "../../../api/lookupapi";
import {
  receivePayment,
  getUnpaidInvoices,
  getPaymentHistory,
  getPayableInvoice,
  getAdvance,
  receiveBulkPayment,
} from "../../../api/paymentapi";
import { getInvoiceItems } from "../../../api/invoiceapi";
import { generatePaymentReceipt, generateBulkPaymentReceipt } from "../../../utils/receiptPdf";
import { FaFilePdf } from "react-icons/fa";

const today = () => new Date().toISOString().slice(0, 10);
const PAYMENT_METHODS = ["Cash", "Cheque", "Bkash", "Rocket", "Nagad", "Bank Transfer", "Advance Adjustment"];

// Company receiving accounts shown to the user so they can tell the
// customer where to send money. >>> EDIT THESE with your real numbers <<<
const PAYMENT_CHANNELS = {
  Bkash: { label: "bKash (Merchant)", number: "01XXX-XXXXXX" },
  Rocket: { label: "Rocket", number: "01XXX-XXXXXX-X" },
  Nagad: { label: "Nagad", number: "01XXX-XXXXXX" },
  "Bank Transfer": {
    label: "Bank A/C",
    number: "A/C 0000000000",
  },
};

const emptyPay = {
  invoiceNo: "",
  amount: "",
  payDate: today(),
  method: "",
  refNo: "",
  receiveAccount: "",
  receivedBy: "",
  remark: "",
};

export const PaymentList = () => {
  const { user } = useAuth();
  const actionBy = user?.userId || user?.userName || user?.username || "WEB";
  const [searchParams, setSearchParams] = useSearchParams();

  // customer
  const [customerIdInput, setCustomerIdInput] = useState("");
  const [customer, setCustomer] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // data
  const [unpaid, setUnpaid] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [concernPersons, setConcernPersons] = useState([]);
  const [advance, setAdvance] = useState(null); // {advanceAmount, usedAmount, remainingAmount}

  // payment form
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [checked, setChecked] = useState([]); // bulk selection (invoice nos)
  const [pay, setPay] = useState(emptyPay);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getLookups()
      .then((l) => setConcernPersons(l.concernPersons || []))
      .catch(() => {});
  }, []);

  // ---- deep link: /blil/payments?invoice=LZ080000001 ----
  useEffect(() => {
    const inv = searchParams.get("invoice");
    if (inv) {
      (async () => {
        try {
          const invoice = await getPayableInvoice(inv);
          if (!invoice) return;
          const owners = await getOwners();
          const found = owners.find((o) => o.customerId === invoice.customerId);
          if (found) {
            setCustomer(found);
            setCustomerIdInput(found.customerId);
            await loadCustomerData(found.customerId);
            selectInvoice(invoice);
          }
        } catch (err) {
          toast.error(err.message || "Failed to load invoice");
        } finally {
          setSearchParams({}, { replace: true });
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCustomerData = async (customerId) => {
    const u = await getUnpaidInvoices(customerId).catch(() => []);
    setUnpaid(u);
    getAdvance(customerId).then(setAdvance).catch(() => setAdvance(null));
    setHistoryLoaded(false);
    return u;
  };

  const totals = useMemo(() => {
    const due = unpaid.reduce((s, i) => s + (parseFloat(i.dueAmount) || 0), 0);
    const billed = unpaid.reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0);
    const paid = unpaid.reduce((s, i) => s + (parseFloat(i.paidAmount) || 0), 0);
    return { due, billed, paid };
  }, [unpaid]);

  // ---- customer search ----
  const handleSearch = async () => {
    const id = (customerIdInput || "").trim();
    if (!id) return;
    setIsSearching(true);
    setSearchError("");
    setSelectedInvoice(null);
    setPay(emptyPay);
    try {
      const owners = await getOwners();
      const found = owners.find(
        (o) => (o.customerId || "").trim().toLowerCase() === id.toLowerCase()
      );
      if (!found) {
        setCustomer(null);
        setUnpaid([]);
        setPayments([]);
        setSearchError("Customer ID not found");
        return;
      }
      setCustomer(found);
      setShowHistory(false);
      await loadCustomerData(found.customerId);
    } catch (err) {
      setSearchError(err.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleHistory = async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && !historyLoaded && customer) {
      try {
        setPayments(await getPaymentHistory(customer.customerId));
        setHistoryLoaded(true);
      } catch (err) {
        toast.error(err.message || "Failed to load payment history");
      }
    }
  };

  // ---- bulk selection (FIFO) ----
  const checkedInvs = useMemo(() => {
    const list = unpaid.filter((i) => checked.includes(i.invoiceNo));
    return [...list].sort((a, b) =>
      (a.invoiceDate || "").localeCompare(b.invoiceDate || "") ||
      (a.invoiceNo || "").localeCompare(b.invoiceNo || "")
    );
  }, [unpaid, checked]);

  const checkedDue = useMemo(
    () => checkedInvs.reduce((t, i) => t + (parseFloat(i.dueAmount) || 0), 0),
    [checkedInvs]
  );

  // live FIFO allocation preview of pay.amount across the selection
  const allocation = useMemo(() => {
    let rem = parseFloat(pay.amount) || 0;
    return checkedInvs.map((inv) => {
      const due = parseFloat(inv.dueAmount) || 0;
      const now = Math.max(Math.min(due, rem), 0);
      rem -= now;
      return {
        invoiceNo: inv.invoiceNo,
        service: inv.serviceMonth || inv.serviceType || "-",
        dueBefore: due,
        payNow: now,
        remaining: due - now,
      };
    });
  }, [checkedInvs, pay.amount]);

  const toggleCheck = (invNo) => {
    setSelectedInvoice(null);
    setChecked((prev) => {
      const next = prev.includes(invNo)
        ? prev.filter((n) => n !== invNo)
        : [...prev, invNo];
      const list = unpaid.filter((i) => next.includes(i.invoiceNo));
      const total = list.reduce((t, i) => t + (parseFloat(i.dueAmount) || 0), 0);
      setPay((pp) => ({
        ...pp,
        invoiceNo: "",
        amount: next.length ? String(total) : "",
        payDate: pp.payDate || today(),
      }));
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedInvoice(null);
    setChecked((prev) => {
      const next =
        prev.length === unpaid.length ? [] : unpaid.map((i) => i.invoiceNo);
      const total = next.length
        ? unpaid.reduce((t, i) => t + (parseFloat(i.dueAmount) || 0), 0)
        : 0;
      setPay((pp) => ({
        ...pp,
        invoiceNo: "",
        amount: next.length ? String(total) : "",
        payDate: pp.payDate || today(),
      }));
      return next;
    });
  };

  // ---- select invoice to receive ----
  const selectInvoice = (inv) => {
    setChecked([]);
    setSelectedInvoice(inv);
    setPay({
      ...emptyPay,
      invoiceNo: inv.invoiceNo,
      amount: inv.dueAmount || "",
      payDate: today(),
    });
  };

  const fp = (name) => (e) => setPay((p) => ({ ...p, [name]: e.target.value }));

  // ---- save bulk payment (FIFO across selection) ----
  const handleBulkSave = async () => {
    if (checked.length === 0) return;
    const amt = parseFloat(pay.amount);
    if (!amt || amt <= 0) return toast.warn("Enter a valid amount");
    if (amt > checkedDue)
      return toast.warn(`Amount exceeds the selected total due (${checkedDue})`);
    if (!pay.method) return toast.warn("Select the payment method");
    if (PAYMENT_CHANNELS[pay.method] && !pay.receiveAccount.trim())
      return toast.warn(`Enter the receiving ${pay.method} number`);

    setIsSaving(true);
    try {
      const order = allocation.map((a) => a.invoiceNo);
      const res = await receiveBulkPayment(
        {
          invoiceNos: order,
          amount: pay.amount,
          payDate: pay.payDate,
          method: pay.method,
          refNo: pay.refNo,
          receiveAccount: pay.receiveAccount,
          receivedBy: pay.receivedBy,
          remark: pay.remark,
        },
        actionBy
      );
      toast.success(
        `Payment received across ${res.allocated} invoice(s) — Batch ${res.batchNo}`
      );
      // one money receipt for the whole collection
      try {
        const receiver = concernPersons.find(
          (cp) => String(cp.staffId) === String(pay.receivedBy)
        );
        await generateBulkPaymentReceipt({
          customer,
          payment: { ...pay, batchNo: res.batchNo },
          allocations: allocation.filter((a) => a.payNow > 0),
          receivedByName: receiver?.staffName || "",
        });
      } catch (pdfErr) {
        toast.warn("Payment saved, but the receipt PDF could not be generated");
      }
      setChecked([]);
      setPay(emptyPay);
      const u = await loadCustomerData(customer.customerId);
      if (historyLoaded)
        setPayments(await getPaymentHistory(customer.customerId).catch(() => []));
      if (u.length === 0) toast.info("No dues left for this customer");
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setIsSaving(false);
    }
  };

  // ---- save payment ----
  const handleSave = async () => {
    if (!selectedInvoice) return;
    if (!pay.amount || parseFloat(pay.amount) <= 0)
      return toast.warn("Enter a valid amount");
    if (parseFloat(pay.amount) > parseFloat(selectedInvoice.dueAmount))
      return toast.warn(`Amount exceeds the due (${selectedInvoice.dueAmount})`);
    if (!pay.method) return toast.warn("Select the payment method");
    if (PAYMENT_CHANNELS[pay.method] && !pay.receiveAccount.trim())
      return toast.warn(`Enter the receiving ${pay.method} number`);
    if (
      pay.method === "Advance Adjustment" &&
      advance &&
      parseFloat(pay.amount) > parseFloat(advance.remainingAmount || 0)
    )
      return toast.warn(
        `Amount exceeds the remaining advance (${advance.remainingAmount})`
      );

    setIsSaving(true);
    try {
      await receivePayment(pay, actionBy);
      toast.success(`Payment received against ${pay.invoiceNo}`);
      // generate & download the money receipt PDF
      // try {
      //   const [freshInv, items] = await Promise.all([
      //     getPayableInvoice(pay.invoiceNo),
      //     getInvoiceItems(pay.invoiceNo),
      //   ]);
      //   const receiver = concernPersons.find(
      //     (cp) => String(cp.staffId) === String(pay.receivedBy)
      //   );
      //   generatePaymentReceipt({
      //     customer,
      //     invoice: freshInv || selectedInvoice,
      //     items,
      //     payment: pay,
      //     receivedByName: receiver?.staffName || "",
      //     technician: selectedInvoice?.technician || "",
      //   });
      // } catch (pdfErr) {
      //   toast.warn("Payment saved, but the PDF could not be generated");
      // }
      setSelectedInvoice(null);
      setPay(emptyPay);
      const u = await loadCustomerData(customer.customerId);
      if (historyLoaded)
        setPayments(await getPaymentHistory(customer.customerId).catch(() => []));
      if (u.length === 0) toast.info("No dues left for this customer");
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setIsSaving(false);
    }
  };

  // re-print a receipt for a past payment
  const downloadReceipt = async (pm) => {
    try {
      const [inv, items] = await Promise.all([
        getPayableInvoice(pm.invoiceNo),
        getInvoiceItems(pm.invoiceNo),
      ]);
      await generatePaymentReceipt({
        customer,
        invoice: inv,
        items,
        payment: {
          amount: pm.amount,
          payDate: pm.payDate,
          method: pm.method,
          refNo: pm.refNo,
          receiveAccount: pm.receiveAccount,
          remark: pm.remark,
        },
        receivedByName: pm.receivedByName || pm.receivedBy || "",
        technician: inv?.technician || "",
      });
    } catch (err) {
      toast.error(err.message || "Could not generate the PDF");
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
              <i className="bx bx-money me-2"></i>Receive Payment
            </strong>
            {customer && (
              <Button variant="outline-secondary" size="sm" onClick={toggleHistory}>
                <FaHistory className="me-1" />
                {showHistory ? "Hide History" : "Payment History"}
              </Button>
            )}
          </Card.Header>
          <Card.Body className="py-3">
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
              <Row className="g-2 mt-1">
                <Col xs={12}>
                  <div className="border rounded p-2 d-flex flex-wrap gap-4">
                    <span>
                      Open bills: <strong>{totals.billed}</strong>
                    </span>
                    <span>
                      Paid on open bills: <strong>{totals.paid}</strong>
                    </span>
                    <span className="text-danger">
                      Outstanding: <strong>{totals.due}</strong>
                    </span>
                    {advance && parseFloat(advance.advanceAmount) > 0 && (
                      <span className="text-success">
                        Advance balance:{" "}
                        <strong>{advance.remainingAmount}</strong>{" "}
                        <small className="text-muted">
                          (of {advance.advanceAmount})
                        </small>
                      </span>
                    )}
                  </div>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {customer && (
          <>
            {/* ================= 2. UNPAID INVOICES ================= */}
            <Card className="shadow-sm mb-3">
              <Card.Header className="py-2">
                <strong>Unpaid / Partial Invoices</strong>
              </Card.Header>
              <Card.Body className="py-3">
                <div className="table-responsive">
                  <Table striped bordered size="sm" className="mb-0">
                    <thead style={{ backgroundColor: "#e7e7ff" }}>
                      <tr>
                        <th style={{ width: "34px" }}>
                          <Form.Check
                            type="checkbox"
                            checked={unpaid.length > 0 && checked.length === unpaid.length}
                            onChange={toggleAll}
                            title="Select all"
                          />
                        </th>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Service Type</th>
                        {/* <th>Item</th> */}
                        <th>Asset</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Due</th>
                        <th>Status</th>
                        <th style={{ width: "100px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaid.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center text-muted py-3">
                            No dues — all invoices are paid
                          </td>
                        </tr>
                      ) : (
                        unpaid.map((inv) => (
                          <tr
                            key={inv.invoiceNo}
                            className={
                              selectedInvoice?.invoiceNo === inv.invoiceNo
                                ? "table-primary"
                                : ""
                            }
                          >
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={checked.includes(inv.invoiceNo)}
                                onChange={() => toggleCheck(inv.invoiceNo)}
                              />
                            </td>
                            <td>{inv.invoiceNo}</td>
                            <td>{inv.invoiceDate}</td>
                            <td>{inv.serviceType || "-"}</td>
                            {/* <td>
                              <small>{inv.itemsSummary || "-"}</small>
                            </td> */}
                            <td>
                              {inv.assetType
                                ? `${inv.assetType} — ${inv.model || ""}`
                                : "-"}
                            </td>
                            <td>{inv.totalAmount}</td>
                            <td>{inv.paidAmount}</td>
                            <td className="fw-semibold text-danger">
                              {inv.dueAmount}
                            </td>
                            <td>{payBadge(inv.paymentStatus)}</td>
                            <td>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => selectInvoice(inv)}
                              >
                                <FaMoneyBillWave className="me-1" />
                                Receive
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>

            {/* ============ 3a. RECEIVE PAYMENT — MULTIPLE INVOICES ============ */}
            {checked.length > 0 && (
              <Card className="shadow-sm mb-3 border-primary">
                <Card.Header className="py-2 bg-primary bg-opacity-10">
                  <strong>
                    Receive Payment — {checked.length} invoice
                    {checked.length > 1 ? "s" : ""} selected
                  </strong>{" "}
                  <span className="text-muted">
                    (Total Due{" "}
                    <strong className="text-danger">{checkedDue}</strong> — paid
                    oldest invoice first)
                  </span>
                </Card.Header>
                <Card.Body className="py-3">
                  <Row className="g-3">
                    <Col xs={12} md={2}>
                      <Form.Label className="fw-semibold">
                        Amount <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={pay.amount}
                        onChange={fp("amount")}
                      />
                    
                    </Col>
                    <Col xs={12} md={2}>
                      <Form.Label className="fw-semibold">Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={pay.payDate}
                        onChange={fp("payDate")}
                      />
                    </Col>
                    <Col xs={12} md={2}>
                      <Form.Label className="fw-semibold">
                        Method <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        value={pay.method}
                        onChange={(e) => {
                          const m = e.target.value;
                          setPay((pp) => ({
                            ...pp,
                            method: m,
                            receiveAccount: PAYMENT_CHANNELS[m]?.number || "",
                          }));
                        }}
                      >
                        <option value="">Select Method</option>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    {PAYMENT_CHANNELS[pay.method] && (
                      <Col xs={12} md={2}>
                        <Form.Label className="fw-semibold">
                          Receiving A/C <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          value={pay.receiveAccount}
                          onChange={fp("receiveAccount")}
                          placeholder={`Company ${pay.method} number`}
                        />
                      </Col>
                    )}
                    <Col xs={12} md={2}>
                      <Form.Label className="fw-semibold">Ref / Trx No</Form.Label>
                      <Form.Control value={pay.refNo} onChange={fp("refNo")} />
                    </Col>
                    <Col xs={12} md={2}>
                      <Form.Label className="fw-semibold">Received By</Form.Label>
                      <Form.Select
                        value={pay.receivedBy}
                        onChange={fp("receivedBy")}
                      >
                        <option value="">Select Employee</option>
                        {concernPersons.map((cp) => (
                          <option key={cp.staffId} value={String(cp.staffId)}>
                            {cp.staffName}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>

                    {/* FIFO allocation preview */}
                    <Col xs={12} md={8}>
                      <div className="border rounded p-2">
                        <small className="fw-semibold text-muted d-block mb-1">
                          How this amount will be applied
                        </small>
                        <Table size="sm" borderless className="mb-0">
                          <thead>
                            <tr className="text-muted small">
                              <th>Invoice</th>
                              <th>Service</th>
                              <th className="text-end">Due</th>
                              <th className="text-end">Pay Now</th>
                              <th className="text-end">Remaining</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allocation.map((a) => (
                              <tr key={a.invoiceNo}>
                                <td>{a.invoiceNo}</td>
                                <td>
                                  <small>{a.service}</small>
                                </td>
                                <td className="text-end">{a.dueBefore}</td>
                                <td
                                  className={
                                    a.payNow > 0
                                      ? "text-end fw-semibold text-success"
                                      : "text-end text-muted"
                                  }
                                >
                                  {a.payNow}
                                </td>
                                <td
                                  className={
                                    a.remaining > 0
                                      ? "text-end text-danger"
                                      : "text-end text-muted"
                                  }
                                >
                                  {a.remaining}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Col>

                    <Col xs={12} md={4} className="d-flex flex-column justify-content-end gap-2">
                      <Form.Control
                        placeholder="Remark (optional)"
                        value={pay.remark}
                        onChange={fp("remark")}
                      />
                      <div className="d-flex gap-2">
                        <Button
                          className="w-100"
                          variant="success"
                          onClick={handleBulkSave}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Spinner size="sm" animation="border" className="me-1" />
                          ) : (
                            <FaSave className="me-1" />
                          )}
                          Save Payment
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            setChecked([]);
                            setPay(emptyPay);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* ================= 3. RECEIVE PAYMENT ================= */}
            {selectedInvoice && (
              <Card className="shadow-sm mb-3 border-success">
                <Card.Header className="py-2 bg-success bg-opacity-10">
                  <strong>
                    Receive Payment — {selectedInvoice.invoiceNo}
                  </strong>{" "}
                  {selectedInvoice.itemsSummary && (
                    <span className="text-muted">
                      [{selectedInvoice.itemsSummary}]
                    </span>
                  )}{" "}
                  <span className="text-muted">
                    (Total {selectedInvoice.totalAmount} · Paid{" "}
                    {selectedInvoice.paidAmount} · Due{" "}
                    <strong className="text-danger">
                      {selectedInvoice.dueAmount}
                    </strong>
                    )
                  </span>
                </Card.Header>
                <Card.Body className="py-3">
                  <Row className="g-3">
                    <Col xs={12} md={2}>
                      <Form.Label className="fw-semibold">
                        Amount <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={pay.amount}
                        onChange={fp("amount")}
                      />
                    </Col>
                    <Col xs={12} md={2}>
                      <Form.Label className="fw-semibold">Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={pay.payDate}
                        onChange={fp("payDate")}
                      />
                    </Col>
                    <Col xs={12} md={2}>
                      <Form.Label className="fw-semibold">
                        Method <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        value={pay.method}
                        onChange={(e) => {
                          const m = e.target.value;
                          setPay((p) => ({
                            ...p,
                            method: m,
                            receiveAccount: PAYMENT_CHANNELS[m]?.number || "",
                          }));
                        }}
                      >
                        <option value="">Select Method</option>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>

                    {pay.method === "Advance Adjustment" && advance && (
                      <Col xs={12}>
                        <Alert variant="success" className="py-2 mb-0">
                          Adjusting from advance — remaining balance:{" "}
                          <strong>{advance.remainingAmount}</strong>
                        </Alert>
                      </Col>
                    )}

                    {PAYMENT_CHANNELS[pay.method] && (
                      <Col xs={12} md={3}>
                        <Form.Label className="fw-semibold">
                          Receiving A/C / Number{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          value={pay.receiveAccount}
                          onChange={fp("receiveAccount")}
                          placeholder={`Company ${pay.method} number`}
                        />
                       
                      </Col>
                    )}
                    <Col xs={12} md={2}>
                      <Form.Label className="fw-semibold">Ref / Trx No</Form.Label>
                      <Form.Control value={pay.refNo} onChange={fp("refNo")} />
                    </Col>
                    <Col xs={12} md={2}>
                      <Form.Label className="fw-semibold">Received By</Form.Label>
                      <Form.Select
                        value={pay.receivedBy}
                        onChange={fp("receivedBy")}
                      >
                        <option value="">Select Employee</option>
                        {concernPersons.map((p) => (
                          <option key={p.staffId} value={String(p.staffId)}>
                            {p.staffName}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col xs={12} md={2} className="d-flex align-items-end">
                      <Button
                        className="w-100"
                        variant="success"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Spinner size="sm" animation="border" className="me-1" />
                        ) : (
                          <FaSave className="me-1" />
                        )}
                        Save Payment
                      </Button>
                    </Col>
                    <Col xs={12}>
                      <Form.Control
                        placeholder="Remark (optional)"
                        value={pay.remark}
                        onChange={fp("remark")}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* ================= 4. PAYMENT HISTORY ================= */}
            <Collapse in={showHistory}>
              <div>
                <Card className="shadow-sm mb-3">
                  <Card.Header className="py-2">
                    <strong>
                      Payment History —{" "}
                      {customer.companyName || customer.customerName}
                    </strong>
                  </Card.Header>
                  <Card.Body className="py-3">
                    <div className="table-responsive">
                      <Table striped bordered size="sm" className="mb-0">
                        <thead style={{ backgroundColor: "#e7e7ff" }}>
                          <tr>
                            <th>Date</th>
                            <th>Invoice No</th>
                            <th>Service Type</th>
                            <th>Amount</th>
                            <th style={{ width: "70px" }}>Receipt</th>
                            <th>Method</th>
                            <th>Ref No</th>
                            <th>Received By</th>
                            <th>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center text-muted py-3">
                                No payments recorded yet
                              </td>
                            </tr>
                          ) : (
                            payments.map((p) => (
                              <tr key={p.paymentId}>
                                <td>{p.payDate}</td>
                                <td>{p.invoiceNo}</td>
                                <td>{p.serviceType || "-"}</td>
                                <td className="fw-semibold">{p.amount}</td>
                                <td className="text-center">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    title="Download receipt PDF"
                                    onClick={() => downloadReceipt(p)}
                                  >
                                    <FaFilePdf />
                                  </Button>
                                </td>
                                <td>
                                  {p.method || "-"}
                                  {p.receiveAccount && (
                                    <small className="d-block text-muted">
                                      {p.receiveAccount}
                                    </small>
                                  )}
                                </td>
                                <td>{p.refNo || "-"}</td>
                                <td>{p.receivedByName || p.receivedBy || "-"}</td>
                                <td>{p.remark || "-"}</td>
                              </tr>
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
            Search a Customer ID to receive payments
          </Alert>
        )}
      </div>
    </>
  );
};
