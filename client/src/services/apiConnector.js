import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:4002/api", // Backend URL
//   withCredentials: true // Include cookies/sessions in requests
});

export const apiConnector = (method, url, bodyData, headers, params) => {
    const token = localStorage.getItem("token");
    const cleanedToken = token ? token.replace(/^"(.*)"$/, '$1') : null;
    
    return axiosInstance({
      method,
      url,
      data: bodyData ? JSON.stringify(bodyData) : null, // Explicitly stringify
      headers: { 
        'Content-Type': 'application/json',
        ...(headers || {}),
        ...(cleanedToken ? { Authorization: `Bearer ${cleanedToken}` } : {}),
      },
      params: params || null,
    });
  };