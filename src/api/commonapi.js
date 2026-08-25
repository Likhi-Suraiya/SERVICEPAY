import axios from "axios";
import { API_BASE_URL, AUTH_USERNAME, AUTH_PASSWORD } from "./baseurl";

// Helper function to normalize API responses
const normalizeResponse = (response) => {  
  const normalized = {
    ...response.data,
    successCode: response.data.succesS_CODE || response.data.successCode,
    successMessage: response.data.succesS_MESSAGE || response.data.successMessage,
    data: response.data.data,
  };
  return normalized;
};

//====================== District, Thana, Union DropDown List ====================

export const getDDLCommon = async (requestData) => {
  try {
    console.log("API Request Data:", requestData);
    const response = await axios.post(
      `${API_BASE_URL}/Common/LoadDropDownAll`,
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
    console.log("Full API Response:", response);
    return normalizeResponse(response);
  } catch (error) {
    console.error("Common DDL error:", error);
    throw error;
  }
};