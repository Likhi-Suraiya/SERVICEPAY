// src/api/paymentapi.js — BLIL payments (fetch-based, same pattern as ownerapi)
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

// Record a (partial) payment against an invoice
// One collection across multiple invoices (FIFO). Returns { batchNo, allocated }
export const receiveBulkPayment = async (payload, actionBy) => {
  const body = await handle(
    await fetch(`${API_BASE_URL}/BlilPayment/ReceiveBulk`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ ...payload, actionBy }),
    })
  );
  return body.data ?? {};
};

export const receivePayment = async (payment, actionBy) => {
  return handle(
    await fetch(`${API_BASE_URL}/BlilPayment/Receive`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ ...payment, actionBy }),
    })
  );
};

// Unpaid / partial invoices of a customer
export const getUnpaidInvoices = async (customerId) => {
  const body = await handle(
    await fetch(
      `${API_BASE_URL}/BlilPayment/Unpaid/${encodeURIComponent(customerId)}`,
      { headers: HEADERS }
    )
  );
  return body.data ?? [];
};

// Payment history of a customer
export const getPaymentHistory = async (customerId) => {
  const body = await handle(
    await fetch(
      `${API_BASE_URL}/BlilPayment/History/${encodeURIComponent(customerId)}`,
      { headers: HEADERS }
    )
  );
  return body.data ?? [];
};

// One invoice with paid/due (Pay deep link)
export const getPayableInvoice = async (invoiceNo) => {
  const body = await handle(
    await fetch(
      `${API_BASE_URL}/BlilPayment/Invoice/${encodeURIComponent(invoiceNo)}`,
      { headers: HEADERS }
    )
  );
  return body.data ?? null;
};

// Cancel (void) an unpaid invoice
export const cancelInvoice = async (invoiceNo, reason, actionBy) => {
  return handle(
    await fetch(`${API_BASE_URL}/BlilPayment/Cancel`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ invoiceNo, reason, actionBy }),
    })
  );
};

// Advance summary (total / used / remaining) of a customer
export const getAdvance = async (customerId) => {
  const body = await handle(
    await fetch(
      `${API_BASE_URL}/BlilPayment/Advance/${encodeURIComponent(customerId)}`,
      { headers: HEADERS }
    )
  );
  return body.data ?? { advanceAmount: "0", usedAmount: "0", remainingAmount: "0" };
};