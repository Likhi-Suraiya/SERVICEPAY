import React, { useState, useEffect, useMemo } from "react";
import { Table } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { getZoneSummaryReport } from "../../../api/reportapi";
import { exportToExcel } from "../../../utils/commonMethods";
import { ReportShell, num } from "./ReportShell";

export const ZoneSummaryReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await getZoneSummaryReport());
    } catch (err) {
      toast.error(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };
  //useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const totals = useMemo(() => ({
    customers: rows.reduce((s, r) => s + (parseInt(r.customers) || 0), 0),
    billed: rows.reduce((s, r) => s + (parseFloat(r.billed) || 0), 0),
    collected: rows.reduce((s, r) => s + (parseFloat(r.collected) || 0), 0),
    outstanding: rows.reduce((s, r) => s + (parseFloat(r.outstanding) || 0), 0),
  }), [rows]);

  const handleExport = () =>
    exportToExcel({
      data: rows,
      filename: "Zone_Summary",
      sheetName: "Zones",
      fieldsMapping: {
        zoneId: "Zone ID", zoneName: "Zone", customers: "Customers",
        invoices: "Invoices", billed: "Billed", collected: "Collected",
        outstanding: "Outstanding",
      },
      onError: (m) => toast.warn(m),
    });

  return (
    <>
      <ToastContainer position="top-right" />
      <ReportShell
        title="Zone Summary"
        icon="bx bx-map"
        loading={loading}
        onRefresh={load}
        onExport={handleExport}
        exportDisabled={rows.length === 0}
        cards={[
          { label: "Customers", value: totals.customers, variant: "secondary" },
          { label: "Billed", value: `Tk ${num(totals.billed)}`, variant: "primary" },
          { label: "Collected", value: `Tk ${num(totals.collected)}`, variant: "success" },
          { label: "Outstanding", value: `Tk ${num(totals.outstanding)}`, variant: "danger" },
        ]}
      >
        <div className="table-responsive">
          <Table striped bordered size="sm" className="mb-0">
            <thead style={{ backgroundColor: "#e7e7ff" }}>
              <tr>
                <th>Zone</th>
                <th className="text-end">Customers</th>
                <th className="text-end">Invoices</th>
                <th className="text-end">Billed</th>
                <th className="text-end">Collected</th>
                <th className="text-end">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-3">Reload to find the data</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.zoneName} <small className="text-muted">(Zone-{String(r.zoneId).padStart(2, "0")})</small></td>
                    <td className="text-end">{r.customers}</td>
                    <td className="text-end">{r.invoices}</td>
                    <td className="text-end">{num(r.billed)}</td>
                    <td className="text-end text-success">{num(r.collected)}</td>
                    <td className="text-end fw-bold text-danger">{num(r.outstanding)}</td>
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
