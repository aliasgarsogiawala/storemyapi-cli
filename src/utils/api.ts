import axios from "axios";

export const api = axios.create({
  baseURL: process.env.STOREMYAPI_API_URL || "https://storemyapi.dev/api",
});