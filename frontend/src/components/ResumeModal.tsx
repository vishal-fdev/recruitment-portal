import { useEffect, useState } from 'react';
import { Box, Button, Layer, Spinner, Text } from 'grommet';
import api from '../api/api';

interface Props {
  candidateId: number;
  resumePath?: string | null;
  onClose: () => void;
}

const API_URL =
  typeof api.defaults.baseURL === 'string' && api.defaults.baseURL
    ? api.defaults.baseURL
    : import.meta.env.VITE_API_URL || window.location.origin;

const buildDirectResumeUrl = (path?: string | null) => {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
};

const ResumeModal = ({ candidateId, resumePath, onClose }: Props) => {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'docx' | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchResume = async () => {
      const tryDirectPath = (path?: string | null) => {
        const directUrl = buildDirectResumeUrl(path);
        if (!directUrl) return false;

        setResumeUrl(directUrl);
        setFileType(directUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx');
        return true;
      };

      if (tryDirectPath(resumePath)) {
        return;
      }

      try {
        const detailRes = await api.get(`/candidates/${candidateId}`);
        if (tryDirectPath(detailRes.data?.resumePath)) {
          return;
        }
      } catch (error) {
        console.error('Failed to resolve resume path from candidate detail', error);
      }

      try {
        const res = await api.get(`/candidates/${candidateId}/resume`, {
          responseType: 'blob',
        });
        const mimeType = res.data.type || '';
        objectUrl = URL.createObjectURL(res.data);
        setResumeUrl(objectUrl);
        setFileType(mimeType.toLowerCase().includes('pdf') ? 'pdf' : 'docx');
      } catch {
        alert('Unable to load resume');
      }
    };

    void fetchResume();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [candidateId, resumePath]);

  const downloadDoc = () => {
    if (!resumeUrl) return;

    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = 'resume';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layer
      onEsc={onClose}
      onClickOutside={onClose}
      modal
      responsive
      position="center"
      style={{ width: '85vw', height: '90vh', maxWidth: '1200px' }}
    >
      <Box fill background="white" round="medium" overflow="hidden">
        <Box
          direction="row"
          justify="between"
          align="center"
          pad={{ horizontal: 'medium', vertical: 'small' }}
          border={{ side: 'bottom', color: 'border' }}
        >
          <Text weight={600}>Candidate Resume</Text>
          <Button plain label="✕" onClick={onClose} />
        </Box>

        <Box flex overflow="hidden">
          {resumeUrl ? (
            fileType === 'pdf' ? (
              <iframe
                src={resumeUrl}
                title="Resume"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <Box flex align="center" justify="center" gap="medium" pad="large">
                <Text color="dark-4">
                  DOCX preview is not supported in local environment.
                </Text>
                <Button label="Download Resume" primary color="brand" onClick={downloadDoc} />
              </Box>
            )
          ) : (
            <Box flex align="center" justify="center" gap="small">
              <Spinner size="medium" />
              <Text>Loading resume...</Text>
            </Box>
          )}
        </Box>
      </Box>
    </Layer>
  );
};

export default ResumeModal;
