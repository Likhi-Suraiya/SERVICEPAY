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

// Create invoice (header + items, atomic). Returns { invoiceNo }.
export const createInvoice = async (invoice, actionBy) => {
  const body = await handle(
    await fetch(`${API_BASE_URL}/BlilInvoice/Create`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ ...invoice, actionBy }),
    })
  );
  return body.data ?? {};
};

export const getInvoicesByCustomer = async (customerId) => {
  const body = await handle(
    await fetch(
      `${API_BASE_URL}/BlilInvoice/ByCustomer/${encodeURIComponent(customerId)}`,
      { headers: HEADERS }
    )
  );
  return body.data ?? [];
};

export const getInvoiceItems = async (invoiceNo) => {
  const body = await handle(
    await fetch(
      `${API_BASE_URL}/BlilInvoice/Items/${encodeURIComponent(invoiceNo)}`,
      { headers: HEADERS }
    )
  );
  return body.data ?? [];
};