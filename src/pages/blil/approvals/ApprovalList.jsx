
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Badge,
  Tabs,
  Tab,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
import { FaCheck, FaTimes, FaSyncAlt } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { getActionBy } from "../../../utils/commonMethods";
import {
  getPendingApprovals,
  getDecidedApprovals,
  approveInvoice,
  rejectInvoice,
} from "../../../api/approvalapi";

const money = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? "0" : n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

export const ApprovalList = () => {
  const { user } = useAuth();
  const actionBy = getActionBy(user);

  const [pending, setPending] = useState([]);
  const [decided, setDecided] = useState([]);
  const [decidedLoaded, setDecidedLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [saving, setSaving] = useState(false);

  // decision modal: { mode: 'approve' | 'reject', invoice }
  const [decision, setDecision] = useState(null);
  const [remark, setRemark] = useState("");

  const loadPending = async () => {
    setLoading(true);
    try {
      setPending(await getPendingApprovals());
    } catch (err) {
      toast.error(err.message || "Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const loadDecided = async () => {
    try {
      setDecided(await getDecidedApprovals(30));
      setDecidedLoaded(true);
    } catch (err) {
      toast.error(err.message || "Failed to load decision history");
    }
  };

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTab = (k) => {
    setActiveTab(k);
    if (k === "decided" && !decidedLoaded) loadDecided();
  };

  const pendingValue = useMemo(
    () => pending.reduce((t, p) => t + (parseFloat(p.totalAmount) || 0), 0),
    [pending]
  );

  const openDecision = (mode, invoice) => {
    setDecision({ mode, invoice });
    setRemark("");
  };

  const submitDecision = async () => {
    if (!decision) return;
    const { mode, invoice } = decision;
    if (mode === "reject" && !remark.trim())
      return toast.warn("A remark is required to reject");
    setSaving(true);
    try {
      if (mode === "approve") {
        await approveInvoice(invoice.invoiceNo, remark, actionBy);
        toast.success(`Invoice ${invoice.invoiceNo} approved`);
      } else {
        await rejectInvoice(invoice.invoiceNo, remark, actionBy);
        toast.success(`Invoice ${invoice.invoiceNo} rejected`);
      }
      setDecision(null);
      loadPending();
      if (decidedLoaded) loadDecided();
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <div className="p-3">
        <Card className="shadow-sm">
          <Card.Header className="py-2 d-flex justify-content-between align-items-center">
            <strong>
              <i className="bx bx-badge-check me-2"></i>
              Service Invoice Approval
            </strong>
            <div className="d-flex align-items-center gap-3">
              <small className="text-muted">
                Pending: <strong>{pending.length}</strong> · Value:{" "}
                <strong>Tk {money(pendingValue)}</strong>
              </small>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  loadPending();
                  if (decidedLoaded) loadDecided();
                }}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" animation="border" /> : <FaSyncAlt />}
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="py-3">
            <Tabs activeKey={activeTab} onSelect={handleTab} className="mb-3">
              <Tab eventKey="pending" title={`Pending (${pending.length})`}>
                <div className="table-responsive">
                  <Table striped bordered size="sm" className="mb-0 align-middle">
                    <thead style={{ backgroundColor: "#e7e7ff" }}>
                      <tr>
                        <th>Date</th>
                        <th>Invoice No</th>
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Items Demanded</th>
                        <th className="text-end">Amount</th>
                       
                        <th style={{ width: "170px" }}>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-muted py-3">
                            {loading ? (
                              <Spinner size="sm" animation="border" />
                            ) : (
                              "Nothing awaiting approval"
                            )}
                          </td>
                        </tr>
                      ) : (
                        pending.map((p) => (
                          <tr key={p.invoiceNo}>
                            <td>{p.invoiceDate}</td>
                            <td>{p.invoiceNo}</td>
                            <td>
                              {p.companyName}
                              <small className="d-block text-muted">
                                {p.zoneName || "-"} · {p.customerId}
                              </small>
                            </td>
                            <td>
                              {p.serviceType || "-"}
                              <small className="d-block text-muted">
                                {p.assetType}
                                {p.model ? ` — ${p.model}` : ""}
                              </small>
                            </td>
                            <td>
                              <small>{p.itemsSummary || "-"}</small>
                              {p.remark && (
                                <small className="d-block text-muted">
                                  {p.remark}
                                </small>
                              )}
                            </td>
                            <td className="text-end">
                              <strong>Tk {money(p.totalAmount)}</strong>
                              {p.warrantyYn === "Y" && (
                                <Badge bg="info" className="d-block mt-1">
                                  Warranty — Tk 1
                                </Badge>
                              )}
                            </td>
                            
                            <td>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => openDecision("approve", p)}
                                >
                                  <FaCheck className="me-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => openDecision("reject", p)}
                                >
                                  <FaTimes />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Tab>

              <Tab eventKey="decided" title="Decided (last 30 days)">
                <div className="table-responsive">
                  <Table striped bordered size="sm" className="mb-0 align-middle">
                    <thead style={{ backgroundColor: "#e7e7ff" }}>
                      <tr>
                        <th>Decided On</th>
                        <th>Invoice No</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th className="text-end">Amount</th>
                        <th>Decision</th>
                        <th>By</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decided.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-muted py-3">
                            No decisions in the last 30 days
                          </td>
                        </tr>
                      ) : (
                        decided.map((d, i) => (
                          <tr key={`${d.invoiceNo}-${i}`}>
                            <td>{d.approvedDate}</td>
                            <td>{d.invoiceNo}</td>
                            <td>
                              {d.companyName}
                              <small className="d-block text-muted">
                                {d.zoneName || "-"}
                              </small>
                            </td>
                            <td>
                              <small>{d.itemsSummary || "-"}</small>
                            </td>
                            <td className="text-end">Tk {money(d.totalAmount)}</td>
                            <td>
                              <Badge
                                bg={
                                  d.approvalStatus === "Approved"
                                    ? "success"
                                    : "danger"
                                }
                              >
                                {d.approvalStatus}
                              </Badge>
                            </td>
                            <td>{d.approvedBy || "-"}</td>
                            <td>
                              <small>{d.approveRemark || "-"}</small>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </div>

      {/* ---------- decision modal ---------- */}
      <Modal show={!!decision} onHide={() => setDecision(null)} centered>
        <Modal.Header
          closeButton
          className="text-white"
          style={{
            backgroundColor: decision?.mode === "approve" ? "#198754" : "#c0392b",
          }}
        >
          <Modal.Title as="h6">
            {decision?.mode === "approve" ? "Approve" : "Reject"} —{" "}
            {decision?.invoice?.invoiceNo}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">
            <strong>{decision?.invoice?.companyName}</strong>
            <small className="d-block text-muted">
              {decision?.invoice?.itemsSummary}
            </small>
            <div className="mt-1">
              Amount: <strong>Tk {money(decision?.invoice?.totalAmount)}</strong>{" "}
              {decision?.invoice?.warrantyYn === "Y" && (
                <Badge bg="info">Warranty — Tk 1</Badge>
              )}
            </div>
          </div>
          <Form.Label>
            Remark{" "}
            {decision?.mode === "reject" && (
              <span className="text-danger">* (required)</span>
            )}
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder={
              decision?.mode === "approve"
                ? "Optional note"
                : "Why is this demand rejected?"
            }
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDecision(null)}>
            Cancel
          </Button>
          <Button
            variant={decision?.mode === "approve" ? "success" : "danger"}
            onClick={submitDecision}
            disabled={saving}
          >
            {saving ? (
              <Spinner size="sm" animation="border" className="me-1" />
            ) : decision?.mode === "approve" ? (
              <FaCheck className="me-1" />
            ) : (
              <FaTimes className="me-1" />
            )}
            Confirm {decision?.mode === "approve" ? "Approval" : "Rejection"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
