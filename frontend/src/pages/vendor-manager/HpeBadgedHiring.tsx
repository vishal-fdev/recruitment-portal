import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Box, Button, Text } from 'grommet';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { hpeBadgedHiringService } from '../../services/hpeBadgedHiringService';
import type { HpeBadgedCandidate } from '../../services/hpeBadgedHiringService';

const statusMeta: Record<string, { label: string; bg: string; color: string }> = {
  SUBMITTED: { label: 'Submitted', bg: '#DBEAFE', color: '#0B5FFF' },
  TECH_SELECTED: { label: 'Tech Select', bg: '#D7FAEF', color: '#007A5E' },
  TECH_REJECTED: { label: 'Tech Reject', bg: '#FFE4E8', color: '#D61F45' },
  SCREEN_SELECTED: { label: 'Screen Select', bg: '#D7FAEF', color: '#007A5E' },
  SCREEN_REJECTED: { label: 'Screen Reject', bg: '#FFE4E8', color: '#D61F45' },
  OPS_SELECTED: { label: 'Ops Select', bg: '#FFF0C8', color: '#A15C00' },
  OPS_REJECTED: { label: 'Ops Reject', bg: '#FFE4E8', color: '#D61F45' },
};

const pageStyle = {
  minHeight: 'calc(100vh - 84px)',
  background: '#F4F6F8',
  padding: '32px',
} as const;

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #D9E1EA',
  borderRadius: '18px',
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
} as const;

const tableStyle = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  color: '#001A3D',
  fontSize: '14px',
} as const;

const thStyle = {
  padding: '16px 18px',
  background: '#91EBD9',
  color: '#002B4F',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap',
} as const;

const tdStyle = {
  padding: '16px 18px',
  borderBottom: '1px solid #EDF1F5',
  fontWeight: 450,
  whiteSpace: 'nowrap',
} as const;

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const HpeBadgedHiring = () => {
  const [records, setRecords] = useState<HpeBadgedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [resumeUploadingId, setResumeUploadingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(b.uploadedDate).getTime() -
          new Date(a.uploadedDate).getTime(),
      ),
    [records],
  );

  useEffect(() => {
    let mounted = true;
    hpeBadgedHiringService
      .list()
      .then((data) => {
        if (mounted) setRecords(data);
      })
      .catch(() => {
        if (mounted) setMessage('Unable to load HPE badged hiring records.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleExcelUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingExcel(true);
    setMessage('');

    try {
      const result = await hpeBadgedHiringService.uploadExcel(file);
      setRecords(result.records);
      setMessage(
        `Upload complete. ${result.inserted} added, ${result.updated} updated.`,
      );
    } catch {
      setMessage('Excel upload failed. Please check the file columns and try again.');
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleResumeUpload = async (
    id: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setResumeUploadingId(id);
    setMessage('');

    try {
      const updated = await hpeBadgedHiringService.uploadResume(id, file);
      setRecords((current) =>
        current.map((record) => (record._id === updated._id ? updated : record)),
      );
      setMessage('Resume uploaded successfully.');
    } catch {
      setMessage('Resume upload failed. Please try again.');
    } finally {
      setResumeUploadingId(null);
    }
  };

  return (
    <Box style={pageStyle}>
      <Box direction="row" align="start" justify="between" gap="24px">
        <Box>
          <Text size="34px" weight={600} color="#001A3D">
            HPE Badged Hiring
          </Text>
          <Text size="15px" color="#50648A" margin={{ top: '6px' }}>
            Upload Excel files and track badged hiring candidature status
          </Text>
        </Box>

        <Button
          primary
          color="#00A982"
          label={uploadingExcel ? 'Uploading...' : 'Upload Excel'}
          icon={<FileSpreadsheet size={18} color="white" />}
          disabled={uploadingExcel}
          onClick={() => excelInputRef.current?.click()}
          style={{
            color: 'white',
            borderRadius: 12,
            padding: '12px 22px',
            fontWeight: 600,
            boxShadow: '0 12px 24px rgba(0,169,130,0.18)',
          }}
        />
        <input
          ref={excelInputRef}
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={handleExcelUpload}
        />
      </Box>

      <Box margin={{ top: '28px' }} pad="16px" style={cardStyle}>
        <Box direction="row" justify="between" align="center" pad={{ bottom: '14px' }}>
          <Box>
            <Text size="18px" weight={600} color="#001A3D">
              Uploaded candidates
            </Text>
            <Text size="13px" color="#71819F" margin={{ top: '4px' }}>
              Matching Job ID and Candidate ID rows update automatically on the next upload.
            </Text>
          </Box>
          {message && (
            <Text size="13px" color={message.includes('failed') || message.includes('Unable') ? '#D61F45' : '#007A5E'}>
              {message}
            </Text>
          )}
        </Box>

        <Box overflow={{ horizontal: 'auto' }} round="12px" border={{ color: '#D9E1EA' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, borderTopLeftRadius: 12 }}>Job ID</th>
                <th style={thStyle}>Candidate ID</th>
                <th style={thStyle}>Candidate Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Contact Number</th>
                <th style={thStyle}>Current Company</th>
                <th style={thStyle}>Notice Period</th>
                <th style={thStyle}>Uploaded Date</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, borderTopRightRadius: 12 }}>Resume</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} style={{ ...tdStyle, textAlign: 'center', padding: '54px 18px' }}>
                    Loading HPE badged candidates...
                  </td>
                </tr>
              )}

              {!loading && sortedRecords.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ ...tdStyle, textAlign: 'center', padding: '54px 18px', color: '#8A98B5' }}>
                    No HPE badged candidates uploaded yet.
                  </td>
                </tr>
              )}

              {!loading &&
                sortedRecords.map((record) => {
                  const meta = statusMeta[record.status] || statusMeta.SUBMITTED;
                  const resumeInputId = `hpe-resume-${record._id}`;

                  return (
                    <tr key={record._id}>
                      <td style={{ ...tdStyle, color: '#008567', fontWeight: 600 }}>
                        {record.jobId}
                      </td>
                      <td style={tdStyle}>{record.candidateId}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{record.candidateName}</td>
                      <td style={tdStyle}>{record.email}</td>
                      <td style={tdStyle}>{record.contactNumber}</td>
                      <td style={tdStyle}>{record.currentCompany || '-'}</td>
                      <td style={tdStyle}>{record.noticePeriod || '-'}</td>
                      <td style={tdStyle}>{formatDate(record.uploadedDate)}</td>
                      <td style={tdStyle}>
                        <Box
                          as="span"
                          pad={{ horizontal: '12px', vertical: '6px' }}
                          round="999px"
                          background={meta.bg}
                          style={{ color: meta.color, fontWeight: 600 }}
                        >
                          {meta.label}
                        </Box>
                      </td>
                      <td style={tdStyle}>
                        <Button
                          primary
                          color="#00A982"
                          icon={<Upload size={15} color="white" />}
                          label={resumeUploadingId === record._id ? 'Uploading...' : record.resumeFileName ? 'Replace Resume' : 'Upload Resume'}
                          disabled={resumeUploadingId === record._id}
                          onClick={() => document.getElementById(resumeInputId)?.click()}
                          style={{
                            color: 'white',
                            borderRadius: 8,
                            padding: '8px 14px',
                            fontWeight: 600,
                          }}
                        />
                        <input
                          id={resumeInputId}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          hidden
                          onChange={(event) => handleResumeUpload(record._id, event)}
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </Box>
      </Box>
    </Box>
  );
};

export default HpeBadgedHiring;

