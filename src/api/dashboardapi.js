// src/api/dashboardapi.js
import axios from "axios";
import { API_BASE_URL, AUTH_USERNAME, AUTH_PASSWORD } from "./baseurl";

// Helper function to normalize API responses
const normalizeResponse = (response) => {
  return {
    ...response.data,
    successCode: response.data.succesS_CODE || response.data.successCode,
    successMessage: response.data.succesS_MESSAGE || response.data.successMessage,
    data: response.data.data,
  };
};

//====================== Dashboard Page ====================

// Get Dashboard
export const getDashboard = async (requestData) => {
  try {
    console.log("Requesting report with data:", requestData);
    const response = await axios.post(
      `${API_BASE_URL}/OrderReport/GetDeshboard`,
      requestData,
      {
        auth: {
          username: AUTH_USERNAME,
          password: AUTH_PASSWORD,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      } 
    );
    return normalizeResponse(response);
  } catch (error) {
    console.error("Report list error:", error);
    throw error;
  }
};

// Get Transactions
export const getTransactions = async (requestData) => {
  try {
    console.log("Requesting Transactions with data:", requestData);
    const response = await axios.post(
      `${API_BASE_URL}/OrderReport/GetDeshboard`,
      requestData,
      {
        auth: {
          username: AUTH_USERNAME,
          password: AUTH_PASSWORD,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return normalizeResponse(response);
  } catch (error) {
    console.error("Report list error:", error);
    throw error;
  }
};