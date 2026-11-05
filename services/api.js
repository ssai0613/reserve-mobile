import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Replace this fallback with the IPAddress printed by Get-NetIPAddress above
const FALLBACK_WIFI_IP = "172.25.65.73";

const getBaseUrl = () => {
  if (Platform.OS === "web") {
    return "http://127.0.0.1:8000/api/";
  }

  // Automatically grab the active LAN IP from Expo Metro bundler
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const detectedIp = hostUri.split(":")[0];
    if (/^\d+\.\d+\.\d+\.\d+$/.test(detectedIp)) {
      return `http://${detectedIp}:8000/api/`;
    }
  }

  return `http://${FALLBACK_WIFI_IP}:8000/api/`;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const saveTokens = async (access, refresh) => {
  if (Platform.OS === "web") {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  } else {
    await SecureStore.setItemAsync("access_token", access);
    await SecureStore.setItemAsync("refresh_token", refresh);
  }
};

export const getAccessToken = async () => {
  if (Platform.OS === "web") {
    return localStorage.getItem("access_token");
  }
  return await SecureStore.getItemAsync("access_token");
};