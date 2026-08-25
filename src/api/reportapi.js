// src/api/reportapi.js — BLIL reports (fetch-based, same pattern as ownerapi)
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
  return body.data;
};

const qs = (params) => {
  const p = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return p ? `?${p}` : "";
};

export const getCollectionReport = async ({ from, to, zoneId } = {}) =>
  (await handle(
    await fetch(`${API_BASE_URL}/BlilReport/Collection${qs({ from, to, zoneId })}`, {
      headers: HEADERS,
    })
  )) ?? [];

export const getDuesReport = async ({ zoneId } = {}) =>
  (await handle(
    await fetch(`${API_BASE_URL}/BlilReport/Dues${qs({ zoneId })}`, {
      headers: HEADERS,
    })
  )) ?? [];

export const getServiceCompletionReport = async ({ from, to, zoneId } = {}) =>
  (await handle(
    await fetch(
      `${API_BASE_URL}/BlilReport/ServiceCompletion${qs({ from, to, zoneId })}`,
      { headers: HEADERS }
    )
  )) ?? [];

export const getAdvanceLedgerReport = async () =>
  (await handle(
    await fetch(`${API_BASE_URL}/BlilReport/AdvanceLedger`, { headers: HEADERS })
  )) ?? [];

export const getZoneSummaryReport = async () =>
  (await handle(
    await fetch(`${API_BASE_URL}/BlilReport/ZoneSummary`, { headers: HEADERS })
  )) ?? [];

// returns { summary, ledger }
export const getCustomerStatement = async (customerId, { from, to } = {}) =>
  await handle(
    await fetch(
      `${API_BASE_URL}/BlilReport/CustomerStatement/${encodeURIComponent(
        customerId
      )}${qs({ from, to })}`,
      { headers: HEADERS }
    )
  );
