import React, { useState, useEffect, useMemo } from "react";
import { Table, Form, Col, Button, Badge, ProgressBar } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { getServiceCompletionReport } from "../../../api/reportapi";
import { getLookups } from "../../../api/lookupapi";
import { exportToExcel } from "../../../utils/commonMethods";
import { ReportShell, num, today } from "./ReportShell";

const yearStart = () => `${new Date().getFullYear()}-01-01`;

export const ServiceCompletionReport = () => {
  const [from, setFrom] = useState(yearStart());
  const [to, setTo] = useState(today());
  const [zoneId, setZoneId] = useState("");
  const [zones, setZones] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    getLookups().then((l) => setZones(l.zones || [])).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await getServiceCompletionReport({ from, to, zoneId: zoneId || undefined }));
    } catch (err) {
      toast.error(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };
  //useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (a, r) => ({
        total: a.total + (parseInt(r.total) || 0),
        completed: a.completed + (parseInt(r.completed) || 0),
        overdue: a.overdue + (parseInt(r.overdue) || 0),
      }),
      { total: 0, completed: 0, overdue: 0 }
    );
    t.pct = t.total ? Math.round((t.completed / t.total) * 1000) / 10 : 0;
    return t;
  }, [rows]);

  const handleExport = () =>
    exportToExcel({
      data: rows,
      filename: "Service_Completion",
      sheetName: "Completion",
      fieldsMapping: {
        monthLabel: "Month", zoneName: "Zone", total: "Total",
        completed: "Completed", overdue: "Due",
        upcoming: "Upcoming", completionPct: "Completion %",
      },
      onError: (m) => toast.warn(m),
    });

  return (
    <>
      <ToastContainer position="top-right" />
      <ReportShell
        title="Service Completion Report"
        icon="bx bx-check-circle"
        loading={loading}
        onRefresh={load}
        onExport={handleExport}
        exportDisabled={rows.length === 0}
        cards={[
          { label: "Total Scheduled", value: totals.total, variant: "secondary" },
          { label: "Completed", value: totals.completed, variant: "success" },
          { label: "Due", value: totals.overdue, variant: "danger" },
          { label: "Completion", value: `${totals.pct}%`, variant: "primary" },
        ]}
        filters={
          <>
            <Col xs={6} md={2}>
              <Form.Label>From</Form.Label>
              <Form.Control type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Col>
            <Col xs={6} md={2}>
              <Form.Label>To</Form.Label>
              <Form.Control type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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
              <Button className="w-100" style={{ backgroundColor: "#055fae" }} onClick={load} disabled={loading}>
                Run
              </Button>
            </Col>
          </>
        }
      >
        <div className="table-responsive">
          <Table striped bordered size="sm" className="mb-0">
            <thead style={{ backgroundColor: "#e7e7ff" }}>
              <tr>
                <th>Month</th><th>Zone</th>
                <th className="text-end">Total</th>
                <th className="text-end">Completed</th>
                <th className="text-end">Due</th>
                <th className="text-end">Upcoming</th>
                <th style={{ width: "180px" }}>Completion</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-3">No calendar months in this range</td></tr>
              ) : (
                rows.map((r, i) => {
                  const pct = parseFloat(r.completionPct) || 0;
                  return (
                    <tr key={i}>
                      <td>{r.monthLabel}</td>
                      <td>{r.zoneName || "-"}</td>
                      <td className="text-end">{r.total}</td>
                      <td className="text-end text-success fw-semibold">{r.completed}</td>
                      <td className="text-end">
                        {parseInt(r.overdue) > 0
                          ? <Badge bg="danger">{r.overdue}</Badge>
                          : "0"}
                      </td>
                      <td className="text-end">{r.upcoming}</td>
                      <td>
                        <ProgressBar
                          now={pct}
                          label={`${pct}%`}
                          variant={pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger"}
                          style={{ height: "16px" }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </ReportShell>
    </>
  );
};
