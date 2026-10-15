import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// REPLACE WITH YOUR ACTUAL LOCAL IPV4 ADDRESS
const BASE_URL = 'http://192.168.254.204:8000/api/accounts/'; 

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper functions for secure token storage
export const saveTokens = async (access, refresh) => {
  await SecureStore.setItemAsync('access_token', access);
  await SecureStore.setItemAsync('refresh_token', refresh);
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync('access_token');
};