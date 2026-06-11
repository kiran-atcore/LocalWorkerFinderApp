import { apiClient } from './apiClient';

export const jobService = {
  getJobs: async () => {
    return (await apiClient.get('/bookings/')).data;
  },
  createJob: async (data: any) => {
    return (await apiClient.post('/bookings/', data)).data;
  }
};