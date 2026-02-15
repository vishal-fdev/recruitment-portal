import { useEffect, useState } from 'react';
import api from '../api/api';

interface Props {
  candidateId: number;
  onClose: () => void;
}

const ResumeModal = ({ candidateId, onClose }: Props) => {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res = await api.get(
          `/candidates/${candidateId}/resume`,
          { responseType: 'blob' }
        );

        const blobUrl = URL.createObjectURL(res.data);
        setResumeUrl(blobUrl);
      } catch {
        alert('Unable to load resume');
      }
    };

    fetchResume();

    return () => {
      if (resumeUrl) URL.revokeObjectURL(resumeUrl);
    };
  }, [candidateId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-[85%] h-[90%] rounded-lg shadow relative">
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <h2 className="font-semibold">Candidate Resume</h2>
          <button onClick={onClose} className="text-lg">✖</button>
        </div>

        {resumeUrl ? (
          <iframe
            src={resumeUrl}
            className="w-full h-full rounded-b-lg"
            title="Resume"
          />
        ) : (
          <div className="p-6 text-center">Loading resume…</div>
        )}
      </div>
    </div>
  );
};

export default ResumeModal;
