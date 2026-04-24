import axios from "axios";

const PRODUCTION_URL = "https://backend-production-d39ef.up.railway.app";
const baseURL = import.meta.env.VITE_API_URL || PRODUCTION_URL || "http://127.0.0.1:8000";

console.log("🚀 API Base URL:", baseURL);

export const apiClient = axios.create({ baseURL });

export async function fetchProperties(filters = {}) {
  const { data } = await apiClient.get("/properties", { params: filters });
  return data;
}

export async function fetchProperty(id) {
  const { data } = await apiClient.get(`/properties/${id}`);
  return data;
}

export async function createProperty(payload) {
  const { data } = await apiClient.post("/properties", payload);
  return data;
}

export async function updateProperty(id, payload) {
  const { data } = await apiClient.put(`/properties/${id}`, payload);
  return data;
}

export async function uploadPropertyImages(id, files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const { data } = await apiClient.post(`/properties/${id}/images`, formData);
  return data;
}

export async function uploadPropertyDocuments(id, files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const { data } = await apiClient.post(`/properties/${id}/documents`, formData);
  return data;
}

export async function uploadFloorPlan(id, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post(`/properties/${id}/floor-plan`, formData);
  return data;
}

export async function generatePropertyPdf(id) {
  const { data } = await apiClient.post(`/properties/${id}/generate-pdf`);
  return data;
}
