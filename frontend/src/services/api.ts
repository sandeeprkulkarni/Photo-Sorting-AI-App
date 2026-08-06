import axios from 'axios';

export const API_BASE_URL = 'http://127.0.0.1:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Photo endpoints
export const photoAPI = {
  import: (sourcePath: string) => 
    api.post('/photos/import', { source_path: sourcePath }),
  
  list: (skip = 0, limit = 100, status?: string) =>
    api.get('/photos', { params: { skip, limit, status } }),
  
  getById: (id: number) =>
    api.get(`/photos/${id}`),
};

// Add more API endpoints as needed