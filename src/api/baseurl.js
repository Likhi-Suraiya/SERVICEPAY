
// export const URL_1 = import.meta.env.VITE_URL_1 || "http://172.17.107.221:8082/api";

// // export const API_BASE_URL =
// //   process.env.NODE_ENV === "development"
// //     ? "/api" // dev
// //     : `${URL_1}/v1`;
// // export const AUTH_USERNAME = import.meta.env.VITE_BASIC_USER || "auth";
// // export const AUTH_PASSWORD = import.meta.env.VITE_BASIC_PASS || "12Pran@123456$";

// // export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";


// export const API_BASE_URL = "/api";
// export const AUTH_USERNAME = import.meta.env.VITE_BASIC_USER || "auth";
// export const AUTH_PASSWORD = import.meta.env.VITE_BASIC_PASS || "12Pran@123456$";

//-------------------------------------------------------

// src/api/baseurl.js

// Dev  (npm run dev)   -> "/api"  -> Vite proxy -> http://172.17.107.221:8082/v1
// Prod (npm run build) -> calls the backend directly (backend already allows CORS)

export const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : "http://172.17.107.221:8082/v1";

export const AUTH_USERNAME = import.meta.env.VITE_BASIC_USER || "auth";
export const AUTH_PASSWORD = import.meta.env.VITE_BASIC_PASS || "12Pran@123456$";