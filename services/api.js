import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// REPLACE WITH YOUR ACTUAL LOCAL IPV4 ADDRESS
// const BASE_URL = 'http://10.57.199.73:8000/api/'; 

// export const api = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

import { Platform } from "react-native";

const BASE_URL =
  Platform.OS === "web"
    ? "http://127.0.0.1:8000/api/"
    : "http://192.168.254.201:8000/api/";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Helper functions for secure token storage
export const saveTokens = async (access, refresh) => {
  await SecureStore.setItemAsync('access_token', access);
  await SecureStore.setItemAsync('refresh_token', refresh);
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync('access_token');
};