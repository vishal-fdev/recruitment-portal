const API =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function updateCandidateStatus(
  candidateId: number,
  status: string,
) {
  const token = localStorage.getItem('token');

  const res = await fetch(
    `${API}/candidates/${candidateId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!res.ok) {
    throw new Error('Failed to update status');
  }

  return res.json();
}