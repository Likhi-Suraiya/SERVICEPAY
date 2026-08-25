
import React, { useState, useMemo, useEffect } from "react";
import { Table, Form, Col, Button, Badge, Tabs, Tab } from "react-bootstrap";
import { FaExternalLinkAlt } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getCollectionReport, getDuesReport } from "../../../api/reportapi";
import { getLookups } from "../../../api/lookupapi";
import { exportToExcelMultiSheet } from "../../../utils/commonMethods";
import { ReportShell, num, monthStart, today } from "./ReportShell";
import { DateInput } from "../../../components/DateInput";

const daysSince = (d) => {
  if (!d) return null;
  const diff = Math.floor((new Date() - new Date(d)) / 86400000);
  return diff >= 0 ? diff : null;
};


export const CollectionDuesReport = () => {
  const navigate = useNavigate();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [zoneId, setZoneId] = useState("");
  const [zones, setZones] = useState([]);
  const [collection, setCollection] = useState([]);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [activeTab, setActiveTab] = useState("collection");

  useEffect(() => {
    getLookups().then((l) => setZones(l.zones || [])).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    setRan(true);
    try {
      const [c, d] = await Promise.all([
        getCollectionReport({ from, to, zoneId: zoneId || undefined }),
        getDuesReport({ zoneId: zoneId || undefined }),
        
      ]);
      setCollection(c);
      setDues(d);
    } catch (err) {
      toast.error(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const collected = collection.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const byMethod = {};
    collection.forEach((r) => {
      const m = r.method || "Other";
      byMethod[m] = (byMethod[m] || 0) + (parseFloat(r.amount) || 0);
    });
    const topMethod = Object.entries(byMethod).sort((a, b) => b[1] - a[1])[0];
    const receivable = dues.reduce((s, r) => s + (parseFloat(r.due) || 0), 0);
    const longest = dues.reduce((mx, r) => {
      const d = daysSince(r.oldestUnpaid);
      return d !== null && d > mx ? d : mx;
    }, 0);
    return { collected, topMethod, receivable, longest };
  }, [collection, dues]);

  const cards = ran
    ? [
        { label: "Payments", value: collection.length, variant: "secondary" },
        { label: "Collected", value: `Tk ${num(totals.collected)}`, variant: "success" },
        ...(totals.topMethod
          ? [{ label: totals.topMethod[0], value: `Tk ${num(totals.topMethod[1])}`, variant: "primary" }]
          : []),
        { label: "Customers with Dues", value: dues.length, variant: "secondary" },
        { label: "Total Receivable", value: `Tk ${num(totals.receivable)}`, variant: "danger" },
        { label: "Longest Pending", value: `${totals.longest} days`, variant: "warning" },
      ]
    : [];

  const handleExport = () =>
    exportToExcelMultiSheet({
      filename: "Collection_And_Dues",
      sheets: [
        {
          data: collection,
          sheetName: "Collection",
          fieldsMapping: {
            payDate: "Date", invoiceNo: "Invoice No", customerId: "Customer ID",
            companyName: "Customer", zoneName: "Zone", serviceType: "Service Type",
            method: "Method", receiveAccount: "Receiving A/C", refNo: "Ref No",
            receivedBy: "Received By", amount: "Amount", remark: "Remark",
          },
        },
        {
          data: dues,
          sheetName: "Dues",
          fieldsMapping: {
            customerId: "Customer ID", companyName: "Customer", zoneName: "Zone",
            contactNo: "Contact", billed: "Billed", paid: "Paid", due: "Receivable",
            oldestUnpaid: "Pending Since",
          },
        },
      ],
      onError: (m) => toast.warn(m),
    });

  return (
    <>
      <ToastContainer position="top-right" />
      <ReportShell
        title="Collection & Dues"
        icon="bx bx-money"
        loading={loading}
        onExport={handleExport}
        exportDisabled={collection.length === 0 && dues.length === 0}
        cards={cards}
        filters={
          <>

            
            <Col xs={6} md={2}>
              <Form.Label>From</Form.Label>
              <DateInput value={from} onChange={(e) => setFrom(e.target.value)} />
            </Col>
            <Col xs={6} md={2}>
              <Form.Label>To</Form.Label>
              <DateInput value={to} onChange={(e) => setTo(e.target.value)} />
            </Col>
            <Col xs={8} md={3}>
              <Form.Label>Zone</Form.Label>
              <Form.Select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                <option value="">All Zones</option>
                {zones.map((z) => (
                  <option key={z.zoneId} value={z.zoneId}>{z.zoneName}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={4} md={2}>
              <Button
                className="w-100"
                style={{ backgroundColor: "#055fae" }}
                onClick={load}
                disabled={loading}
              >
                Run
              </Button>
            </Col>
           
          </>
        }
      >
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-2">
          <Tab eventKey="collection" title={`Collection (${collection.length})`}>
            <div className="table-responsive">
              <Table striped bordered size="sm" className="mb-0">
                <thead style={{ backgroundColor: "#e7e7ff" }}>
                  <tr>
                    <th>Date</th><th>Invoice No</th><th>Customer</th><th>Zone</th>
                    <th>Service Type</th><th>Method</th><th>Ref No</th>
                    <th>Received By</th><th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {collection.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-3">
                        {ran ? "No payments in this range" : "Set filters and click Run"}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {collection.map((r, i) => (
                        <tr key={i}>
                          <td>{r.payDate}</td>
                          <td>{r.invoiceNo}</td>
                          <td>
                            {r.companyName}
                            <small className="d-block text-muted">{r.customerId}</small>
                          </td>
                          <td>{r.zoneName || "-"}</td>
                          <td>{r.serviceType || "-"}</td>
                          <td>
                            {r.method || "-"}
                            {r.receiveAccount && (
                              <small className="d-block text-muted">{r.receiveAccount}</small>
                            )}
                          </td>
                          <td>{r.refNo || "-"}</td>
                          <td>{r.receivedBy || "-"}</td>
                          <td className="text-end fw-semibold">{num(r.amount)}</td>
                        </tr>
                      ))}
                      <tr className="fw-bold">
                        <td colSpan={8} className="text-end">Total</td>
                        <td className="text-end">{num(totals.collected)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </Table>
            </div>
          </Tab>

          <Tab eventKey="dues" title={`Dues  (${dues.length})`}>
            <div className="table-responsive">
              <Table striped bordered size="sm" className="mb-0">
                <thead style={{ backgroundColor: "#e7e7ff" }}>
                  <tr>
                    <th>Customer</th><th>Zone</th><th>Contact</th>
                    <th className="text-end">Billed</th>
                    <th className="text-end">Paid</th>
                    <th className="text-end">Receivable</th>
                    <th>Pending Since</th>
                    <th style={{ width: "60px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {dues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-3">
                        {ran ? "No receivables — all bills are settled" : "Set filters and click Run"}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {dues.map((r, i) => {
                        const d = daysSince(r.oldestUnpaid);
                        return (
                          <tr key={i}>
                            <td>
                              {r.companyName}
                              <small className="d-block text-muted">{r.customerId}</small>
                            </td>
                            <td>{r.zoneName || "-"}</td>
                            <td>{r.contactNo || "-"}</td>
                            <td className="text-end">{num(r.billed)}</td>
                            <td className="text-end text-success">{num(r.paid)}</td>
                            <td className="text-end fw-bold">{num(r.due)}</td>
                            <td>
                              {r.oldestUnpaid || "-"}{" "}
                              {d !== null && (
                                <Badge bg={d > 90 ? "warning" : "secondary"} text={d > 90 ? "dark" : undefined}>
                                  {d} days
                                </Badge>
                              )}
                            </td>
                            <td className="text-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                title="Open customer statement"
                                onClick={() =>
                                  navigate(`/blil/reports/customer?customerId=${r.customerId}`)
                                }
                              >
                                <FaExternalLinkAlt size={11} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="fw-bold">
                        <td colSpan={5} className="text-end">Total Receivable</td>
                        <td className="text-end">{num(totals.receivable)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </Table>
            </div>
          </Tab>
        </Tabs>
      </ReportShell>
    </>
  );
};
