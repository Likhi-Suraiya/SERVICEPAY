// src/api/calendarapi.js — BLIL service calendar (fetch-based, same pattern as ownerapi)
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

// Full monthly plan of one customer (start -> end)
export const getCalendarByCustomer = async (customerId) => {
  const body = await handle(
    await fetch(
      `${API_BASE_URL}/BlilCalendar/ByCustomer/${encodeURIComponent(customerId)}`,
      { headers: HEADERS }
    )
  );
  return body.data ?? [];
};

// Mark a calendar month as serviced
export const completeCalendarMonth = async (calendarId, serviceDate, actionBy) => {
  return handle(
    await fetch(`${API_BASE_URL}/BlilCalendar/Complete`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ calendarId, serviceDate, actionBy }),
    })
  );
};

// Record a payment against a calendar month
export const payCalendarMonth = async (calendarId, paidAmount, paymentDate, actionBy) => {
  return handle(
    await fetch(`${API_BASE_URL}/BlilCalendar/Pay`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ calendarId, paidAmount, paymentDate, actionBy }),
    })
  );
};