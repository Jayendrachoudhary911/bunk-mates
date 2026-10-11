import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust the base URL as needed

export const searchUsers = async (query) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const searchNotes = async (query) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/notes`, {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

export const searchReminders = async (query) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reminders`, {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw error;
  }
};

export const searchTrips = async (query) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/trips`, {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw error;
  }
};

export const searchPlaces = async (query) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/places`, {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching places:', error);
    throw error;
  }
};