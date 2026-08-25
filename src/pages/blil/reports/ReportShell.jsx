// src/pages/blil/reports/ReportShell.jsx — shared layout for all reports
import React from "react";
import { Card, Row, Col, Button, Spinner } from "react-bootstrap";
import { FaFileExcel, FaSyncAlt } from "react-icons/fa";

export const ReportShell = ({
  title,
  icon = "bx bx-file",
  filters,
  cards = [],
  onRefresh,
  onExport,
  loading = false,
  exportDisabled = false,
  children,
}) => (
  <div className="p-3">
    <Card className="shadow-sm mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center py-2">
        <strong>
          <i className={`${icon} me-2`}></i>
          {title}
        </strong>
        <div className="d-flex gap-2">
          {onRefresh && (
            <Button variant="outline-secondary" size="sm" onClick={onRefresh} disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : <FaSyncAlt />}
            </Button>
          )}
          {onExport && (
            <Button variant="success" size="sm" onClick={onExport} disabled={exportDisabled}>
              <FaFileExcel className="me-1" />
              Excel
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Body className="py-3">
        {filters && <Row className="g-2 align-items-end mb-3">{filters}</Row>}
        {cards.length > 0 && (
          <Row className="g-2 mb-3">
            {cards.map((c, i) => (
              <Col xs={6} md={12 / Math.min(cards.length, 6)} key={i}>
                <div className={`border rounded p-2 text-center border-${c.variant || "primary"}`}>
                  <small className="text-muted d-block">{c.label}</small>
                  <strong className={`text-${c.variant || "primary"}`}>{c.value}</strong>
                </div>
              </Col>
            ))}
          </Row>
        )}
        {children}
      </Card.Body>
    </Card>
  </div>
);

export const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n)
    ? "0"
    : n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

export const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export const today = () => new Date().toISOString().slice(0, 10);
