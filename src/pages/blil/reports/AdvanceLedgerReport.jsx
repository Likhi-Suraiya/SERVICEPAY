import React, { useState, useEffect, useMemo } from "react";
import { Table } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { getAdvanceLedgerReport } from "../../../api/reportapi";
import { exportToExcel } from "../../../utils/commonMethods";
import { ReportShell, num } from "./ReportShell";

export const AdvanceLedgerReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await getAdvanceLedgerReport());
    } catch (err) {
      toast.error(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };
  //useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const totals = useMemo(() => ({
    advance: rows.reduce((s, r) => s + (parseFloat(r.advanceAmount) || 0), 0),
    adjusted: rows.reduce((s, r) => s + (parseFloat(r.adjusted) || 0), 0),
    remaining: rows.reduce((s, r) => s + (parseFloat(r.remaining) || 0), 0),
  }), [rows]);

  const handleExport = () =>
    exportToExcel({
      data: rows,
      filename: "Advance_Ledger",
      sheetName: "Advance",
      fieldsMapping: {
        customerId: "Customer ID", companyName: "Customer", zoneName: "Zone",
        advanceAmount: "Advance", adjustAmount: "Monthly Adjust",
        adjusted: "Adjusted", remaining: "Remaining",
        monthsAdjusted: "Months Adjusted", monthsGenerated: "Months Generated",
      },
      onError: (m) => toast.warn(m),
    });

  return (
    <>
      <ToastContainer position="top-right" />
      <ReportShell
        title="Advance Ledger"
        icon="bx bx-wallet"
        loading={loading}
        onRefresh={load}
        onExport={handleExport}
        exportDisabled={rows.length === 0}
        cards={[
          { label: "Customers with Advance", value: rows.length, variant: "secondary" },
          { label: "Total Advance", value: `Tk ${num(totals.advance)}`, variant: "primary" },
          { label: "Adjusted", value: `Tk ${num(totals.adjusted)}`, variant: "success" },
          { label: "Remaining", value: `Tk ${num(totals.remaining)}`, variant: "warning" },
        ]}
      >
        <div className="table-responsive">
          <Table striped bordered size="sm" className="mb-0">
            <thead style={{ backgroundColor: "#e7e7ff" }}>
              <tr>
                <th>Customer</th><th>Zone</th>
                <th className="text-end">Advance</th>
                <th className="text-end">Adjust / Month</th>
                <th className="text-end">Adjusted So Far</th>
                <th className="text-end">Remaining</th>
                <th className="text-end">Months Adjusted</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-3">No customers with advance payments</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.companyName}<small className="d-block text-muted">{r.customerId}</small></td>
                    <td>{r.zoneName || "-"}</td>
                    <td className="text-end">{num(r.advanceAmount)}</td>
                    <td className="text-end">{num(r.adjustAmount)}</td>
                    <td className="text-end text-success">{num(r.adjusted)}</td>
                    <td className="text-end fw-bold">{num(r.remaining)}</td>
                    <td className="text-end">{r.monthsAdjusted} / {r.monthsGenerated}</td>
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
