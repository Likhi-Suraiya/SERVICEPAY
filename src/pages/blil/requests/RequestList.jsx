// src/pages/blil/requests/RequestList.jsx — staff view of customer calls
import React, { useState, useEffect } from "react";
import {
  Card, Table, Button, Badge, Tabs, Tab, Modal, Form, Spinner,
} from "react-bootstrap";
import { FaSyncAlt, FaCheck, FaPhone } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getActionBy } from "../../../utils/commonMethods";
import { getStaffRequests, setRequestStatus } from "../../../api/portalapi";

export const RequestList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const actionBy = getActionBy(user);

  const [tab, setTab] = useState("Open");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(null); // request being closed
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async (status = tab) => {
    setLoading(true);
    try {
      setRows(await getStaffRequests(status === "All" ? "" : status));
    } catch (err) {
      toast.error(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const acknowledge = async (r) => {
    try {
      await setRequestStatus(r.requestId, "Acknowledged", "", actionBy);
      toast.success(`Request ${r.requestId} acknowledged`);
      load();
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  const close = async () => {
    if (!closing) return;
    setSaving(true);
    try {
      await setRequestStatus(closing.requestId, "Closed", remark, actionBy);
      toast.success(`Request ${closing.requestId} closed`);
      setClosing(null);
      setRemark("");
      load();
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
              <i className="bx bx-phone-call me-2"></i>Customer Service Requests
            </strong>
            <Button variant="outline-secondary" size="sm" onClick={() => load()} disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : <FaSyncAlt />}
            </Button>
          </Card.Header>
          <Card.Body className="py-3">
            <Tabs activeKey={tab} onSelect={setTab} className="mb-3">
              <Tab eventKey="Open" title="Open" />
              <Tab eventKey="Acknowledged" title="In Progress" />
              <Tab eventKey="Closed" title="Closed" />
              <Tab eventKey="All" title="All" />
            </Tabs>
            <div className="table-responsive">
              <Table striped bordered size="sm" className="mb-0 align-middle">
                <thead style={{ backgroundColor: "#e7e7ff" }}>
                  <tr>
                    <th>#</th>
                    <th>Received</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Problem</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th style={{ width: "210px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-3">
                        {loading ? <Spinner size="sm" animation="border" /> : "No requests"}
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.requestId}>
                        <td>{r.requestId}</td>
                        <td>{r.createdDate}</td>
                        <td>
                          {r.companyName}
                          <small className="d-block text-muted">
                            {r.zoneName || "-"} · {r.customerId}
                          </small>
                        </td>
                        <td>
                          <Badge bg={r.requestType === "Emergency" ? "danger" : "secondary"}>
                            {r.requestType}
                          </Badge>
                          <small className="d-block text-muted">
                            {r.assetType || "-"}
                          </small>
                        </td>
                        <td>
                          <small>{r.description}</small>
                          {r.statusRemark && (
                            <small className="d-block text-muted">
                              {r.statusRemark} — {r.statusBy}
                            </small>
                          )}
                        </td>
                        <td>
                          <FaPhone size={11} className="me-1 text-muted" />
                          {r.contactNo || "-"}
                        </td>
                        <td>
                          <Badge
                            bg={
                              r.status === "Closed"
                                ? "success"
                                : r.status === "Acknowledged"
                                ? "info"
                                : "warning"
                            }
                            text={r.status === "Open" ? "dark" : undefined}
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            {r.status === "Open" && (
                              <Button variant="info" size="sm" onClick={() => acknowledge(r)}>
                                Acknowledge
                              </Button>
                            )}
                            {r.status !== "Closed" && (
                              <>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  title="Open Service Entry for this customer"
                                  onClick={() =>
                                    navigate(`/blil/services?customerId=${r.customerId}`)
                                  }
                                >
                                  Service
                                </Button>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => setClosing(r)}
                                >
                                  <FaCheck />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Modal show={!!closing} onHide={() => setClosing(null)} centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title as="h6">Close Request #{closing?.requestId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">
            <strong>{closing?.companyName}</strong>
            <small className="d-block text-muted">{closing?.description}</small>
          </div>
          <Form.Label>Resolution note (customer will see this)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="e.g. Technician visited, door sensor replaced"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setClosing(null)}>Cancel</Button>
          <Button variant="success" onClick={close} disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : <FaCheck className="me-1" />}
            Close Request
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
