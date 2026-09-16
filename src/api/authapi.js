// src/api/authapi.js
import { API_BASE_URL, VITE_S_KEYL, AUTH_USERNAME, AUTH_PASSWORD } from "./baseurl";
import axios from "axios";


const BASIC_AUTH = {
  username: AUTH_USERNAME,
  password: AUTH_PASSWORD,
};

// BLIL sidebar menu (staff-only app)
const blilMenu = [
  {
    header: "",
    items: [
      { text: "Dashboard", icon: "bx bx-home", available: true, link: "/blil/dashboard" },
      { text: "Customer Details", icon: "bx bx-user", available: true, link: "/blil/owners" },
      { text: "Asset Type", icon: "bx bx-cube", available: true, link: "/blil/lifts" },
      { text: "Service Invoice", icon: "bx bx-wrench", available: true, link: "/blil/services" },
      { text: "Invoice Approval", icon: "bx bx-check-shield", available: true, link: "/blil/approvals" },
      { text: "Payment", icon: "bx bx-money", available: true, link: "/blil/payments" },
      
    ],
  },
  {
    header: "REPORTS",
    items: [
      { text: "Collection & Dues", icon: "bx bx-file", available: true, link: "/blil/reports/collection-dues" },
      { text: "Service Completion", icon: "bx bx-check-circle", available: true, link: "/blil/reports/service" },
      { text: "Advance Ledger", icon: "bx bx-wallet", available: true, link: "/blil/reports/advance" },
      { text: "Zone Summary", icon: "bx bx-map", available: true, link: "/blil/reports/zone" },
      { text: "Customer Statement", icon: "bx bx-user-circle", available: true, link: "/blil/reports/customer" },
    ],
  },
];
  


export const loginUser = async (credentials) => {
  const res = await axios.post(
    `${API_BASE_URL}/BlilLogin/Login`,  
    {
      
      Username: credentials.userid,
      Password: credentials.password,
    },
    {
      auth: BASIC_AUTH,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        
        // S_KEYL: import.meta.env.VITE_S_KEYL,
        S_KEYL: VITE_S_KEYL,
      },
    }
  );

  console.log("loginUser response:", res.data);

  const body = res.data || {};

  // ASP.NET Core may serialize as camelCase (default) OR PascalCase,
  // so read both spellings to be safe.
  const successCode = body.successCode ?? body.SuccessCode;
  const successMessage = body.successMessage ?? body.SuccessMessage;
  const raw = body.data ?? body.Data ?? null;

  let data = null;
  if (raw) {
    data = {
      staffId: raw.staffId ?? raw.StaffId,
      staffName: raw.staffName ?? raw.StaffName,
      site: raw.site ?? raw.Site,
      role: raw.role ?? raw.Role,
    };
  }

  return { successCode, successMessage, data, menu: blilMenu };
};

// ==================== Change Password ====================
// Backend route: [Authorize] POST /v1/BlilLogin/ChangePassword
// NOTE: backend marks this [Authorize] but Login issues no token yet,
// so this will only work once token/JWT auth is added. Wired here for later.
export const changePassword = async ({ staffId, currentPassword, newPassword }) => {
  const res = await axios.post(
    `${API_BASE_URL}/BlilLogin/ChangePassword`,  // CHANGED: removed /apihris
    {
      StaffId: staffId,
      CurrentPassword: currentPassword,
      NewPassword: newPassword,
    },
    {
      auth: BASIC_AUTH,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        S_KEYL: import.meta.env.VITE_S_KEYL,
      },
    }
  );

  const body = res.data || {};
  return {
    successCode: body.successCode ?? body.SuccessCode,
    successMessage: body.successMessage ?? body.SuccessMessage,
  };
};

export const changedPassword = changePassword;