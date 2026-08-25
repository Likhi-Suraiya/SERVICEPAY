// src/api/approvalapi.js — service invoice approval (management)
import { API_BASE_URL, AUTH_USERNAME, AUTH_PASSWORD } from "./baseurl";

const HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization:
    "Basic " +
    btoa(
      `${AUTH_USERNAME}:${AUTH_PASSWORD}`
    ),
  S_KEYL: import.meta.env.VITE_S_KEYL,
};

const handle = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.successMessage || `Request failed (${res.status})`);
  }
  return body;
};

export const getPendingApprovals = async () => {
  const body = await handle(
    await fetch(`${API_BASE_URL}/BlilInvoice/Pending`, { headers: HEADERS })
  );
  return body.data ?? [];
};

export const getDecidedApprovals = async (days = 30) => {
  const body = await handle(
    await fetch(`${API_BASE_URL}/BlilInvoice/Decided?days=${days}`, {
      headers: HEADERS,
    })
  );
  return body.data ?? [];
};

export const approveInvoice = async (invoiceNo, remark, actionBy) =>
  handle(
    await fetch(
      `${API_BASE_URL}/BlilInvoice/Approve/${encodeURIComponent(invoiceNo)}?` +
        `remark=${encodeURIComponent(remark || "")}&actionBy=${encodeURIComponent(actionBy || "")}`,
      { method: "PUT", headers: HEADERS }
    )
  );

export const rejectInvoice = async (invoiceNo, remark, actionBy) =>
  handle(
    await fetch(
      `${API_BASE_URL}/BlilInvoice/Reject/${encodeURIComponent(invoiceNo)}?` +
        `remark=${encodeURIComponent(remark || "")}&actionBy=${encodeURIComponent(actionBy || "")}`,
      { method: "PUT", headers: HEADERS }
    )
  );