import React from "react";
import { Form } from "react-bootstrap";

// Parses pasted text like 01/08/2026, 1-8-2026, 2026-08-01, 01.08.2026
const parsePasted = (text) => {
  const t = (text || "").trim();
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);      // yyyy-mm-dd
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);          // dd-mm-yyyy
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
};

export const DateInput = ({ onChange, name, ...props }) => (
  <Form.Control
    type="date"
    name={name}
    onChange={onChange}
    onPaste={(e) => {
      const iso = parsePasted(e.clipboardData.getData("text"));
      if (iso) {
        e.preventDefault();
        onChange({ target: { name, value: iso, type: "date" } });
      }
    }}
    {...props}
  />
);