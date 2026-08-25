import React, { useState } from "react";
import { Table, Form, Col, Button, InputGroup, Spinner, Badge } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { getCustomerStatement } from "../../../api/reportapi";
import { exportToExcel } from "../../../utils/commonMethods";
import { ReportShell, num } from "./ReportShell";
import { DateInput } from "../../../components/DateInput";

export const CustomerStatementReport = () => {
  const [customerIdInput, setCustomerIdInput] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const id = (customerIdInput || "").trim();
    if (!id) return toast.warn("Enter a Customer ID");
    setLoading(true);
    try {
      const data = await getCustomerStatement(id, {
        from: from || undefined,
        to: to || undefined,
      });
      setSummary(data.summary);
      setLedger(data.ledger || []);
    } catch (err) {
      setSummary(null);
      setLedger([]);
      toast.error(err.message || "Failed to load statement");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () =>
    exportToExcel({
      data: ledger,
      filename: `Statement_${summary?.customerId || ""}`,
      sheetName: "Statement",
      fieldsMapping: {
        trxDate: "Date", trxType: "Type", refNo: "Ref No",
        description: "Description", debit: "Debit (Bill)",
        credit: "Credit (Paid)", balance: "Balance",
      },
      onError: (m) => toast.warn(m),
    });

  const cards = summary
    ? [
        { label: "Total Billed", value: `Tk ${num(summary.billed)}`, variant: "primary" },
        { label: "Total Paid", value: `Tk ${num(summary.paid)}`, variant: "success" },
        { label: "Outstanding", value: `Tk ${num(summary.outstanding)}`, variant: "danger" },
        { label: "Advance Remaining", value: `Tk ${num(summary.advanceRemaining)}`, variant: "warning" },
      ]
    : [];

  return (
    <>
      <ToastContainer position="top-right" />
      <ReportShell
        title={
          summary
            ? `Customer Statement — ${summary.companyName || summary.customerName}`
            : "Customer Statement"
        }
        icon="bx bx-user-circle"
        loading={loading}
        onExport={handleExport}
        exportDisabled={ledger.length === 0}
        cards={cards}
        filters={
          <>
            <Col xs={12} md={3}>
              <Form.Label>Customer ID</Form.Label>
              <InputGroup>
                <Form.Control
                  value={customerIdInput}
                  onChange={(e) => setCustomerIdInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); load(); }
                  }}
                  placeholder="Enter Customer ID"
                />
                <Button
                  style={{ backgroundColor: "#055fae" }}
                  onClick={load}
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : <FaSearch />}
                </Button>
              </InputGroup>
            </Col>
            <Col xs={6} md={2}>
              <Form.Label>From (optional)</Form.Label>
              <DateInput value={from} onChange={(e) => setFrom(e.target.value)} />
            </Col>
            <Col xs={6} md={2}>
              <Form.Label>To (optional)</Form.Label>
              <DateInput value={to} onChange={(e) => setTo(e.target.value)} />
            </Col>
            {summary && (
              <Col xs={12} md={5}>
                <div className="border rounded p-2">
                  <small className="text-muted d-block">
                    {summary.fullAddress}
                  </small>
                  <small>
                    Zone: <strong>{summary.zoneName || "-"}</strong> · Contact:{" "}
                    <strong>{summary.contactNo || "-"}</strong>
                  </small>
                </div>
              </Col>
            )}
          </>
        }
      >
        <div className="table-responsive">
          <Table striped bordered size="sm" className="mb-0">
            <thead style={{ backgroundColor: "#e7e7ff" }}>
              <tr>
                <th>Date</th><th>Type</th><th>Ref No</th><th>Description</th>
                <th className="text-end">Debit (Bill)</th>
                <th className="text-end">Credit (Paid)</th>
                <th className="text-end">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-3">
                    {summary ? "No transactions in this range" : "Search a Customer ID to view the statement"}
                  </td>
                </tr>
              ) : (
                ledger.map((t, i) => (
                  <tr key={i}>
                    <td>{t.trxDate}</td>
                    <td>
                      <Badge bg={t.trxType === "Invoice" ? "primary" : "success"}>
                        {t.trxType}
                      </Badge>
                    </td>
                    <td>{t.refNo}</td>
                    <td><small>{t.description}</small></td>
                    <td className="text-end">{parseFloat(t.debit) ? num(t.debit) : "-"}</td>
                    <td className="text-end text-success">{parseFloat(t.credit) ? num(t.credit) : "-"}</td>
                    <td className="text-end fw-semibold">{num(t.balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </ReportShell>
    </>
  );
};
