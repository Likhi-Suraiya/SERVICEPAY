// src/api/staffapi.js
import { API_BASE_URL, AUTH_USERNAME, AUTH_PASSWORD } from "./baseurl";
import axios from "axios";

const BASIC_AUTH = {
  username: AUTH_USERNAME,
  password: AUTH_PASSWORD,
};

// Get staff profile
export const getStaffProfile = async (staffId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/Staff/${staffId}`,
      {
        auth: BASIC_AUTH,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          S_KEYL: import.meta.env.VITE_S_KEYL,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching staff profile:", error);
    throw error;
  }
};

// Update staff profile
export const updateStaffProfile = async (staffId, profileData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/Staff/${staffId}`,
      profileData,
      {
        auth: BASIC_AUTH,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          S_KEYL: import.meta.env.VITE_S_KEYL,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating staff profile:", error);
    throw error;
  }
};

// Get all staff (if needed)
export const getAllStaff = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/Staff`,
      {
        auth: BASIC_AUTH,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          S_KEYL: import.meta.env.VITE_S_KEYL,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching all staff:", error);
    throw error;
  }
};