// src/api/menuapi.js
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

//====================== DB Type = 1 ====================

// Get New Menu List
export const getNewMenuList = async (partnerId) => {
  try {
    console.log("Requesting new menu list for partnerId:", partnerId);
    const response = await axios.post(
      `${API_BASE_URL}/Manu/GetMenu`,
      { partnerId },
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
    console.error("New menu list error:", error);
    throw error;
  }
};