// src/services/candidateService.ts
import api from '../api/api';

export const createCandidate = async (formData: FormData) => {
  const res = await api.post('/candidates', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};

export const getVendorCandidates = async () => {
  const res = await api.get('/candidates');
  return res.data;
};
