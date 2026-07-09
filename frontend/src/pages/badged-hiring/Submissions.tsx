import { useEffect, useState } from 'react';
import { Box, Text } from 'grommet';
import { hpeBadgedHiringService, type BadgedSubmission } from '../../services/hpeBadgedHiringService';
import { authService } from '../../auth/authService';

const cardStyle = { background: '#FFFFFF', border: '1px solid #D9E1EA', borderRadius: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.06)' } as const;
const tableHeader = { background: '#8EEBD8', color: '#001A3D', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const };

const Submissions = () => {
  const [rows, setRows] = useState<BadgedSubmission[]>([]);
  const isRecruiter = authService.getRole() === 'BADGED_RECRUITER';

  useEffect(() => {
    hpeBadgedHiringService.listSubmissions().then(setRows).catch(() => undefined);
  }, []);

  return (
    <Box gap="24px">
      <Box>
        <Text size="32px" weight={600} color="#001A3D">Candidate Submissions</Text>
        <Text size="15px" color="#50648A" margin={{ top: '6px' }}>{isRecruiter ? 'Track candidates you submitted for assigned requisitions' : 'Review candidate submissions from badged hiring recruiters'}</Text>
      </Box>
      <Box overflow="auto" style={cardStyle} pad="18px">
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1100 }}>
          <thead>
            <tr>{['Job ID', 'Candidate ID', 'Candidate Name', 'Email', 'Contact Number', 'Current Company', 'Notice Period', 'Uploaded Date', 'Status'].map((heading) => <th key={heading} style={{ ...tableHeader, padding: '16px 14px', textAlign: 'left' }}>{heading}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 52, textAlign: 'center', color: '#8A98B5' }}>No candidate submissions available yet.</td></tr>
            ) : rows.map((row) => (
              <tr key={row._id}>
                <td style={{ padding: '16px 14px', color: '#008567', fontWeight: 600 }}>{row.jobId}</td>
                <td style={{ padding: '16px 14px' }}>{row.candidateId}</td>
                <td style={{ padding: '16px 14px', fontWeight: 600 }}>{row.candidateName}</td>
                <td style={{ padding: '16px 14px' }}>{row.email}</td>
                <td style={{ padding: '16px 14px' }}>{row.contactNumber}</td>
                <td style={{ padding: '16px 14px' }}>{row.currentCompany}</td>
                <td style={{ padding: '16px 14px' }}>{row.noticePeriod}</td>
                <td style={{ padding: '16px 14px' }}>{row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '-'}</td>
                <td style={{ padding: '16px 14px' }}><span style={{ background: '#DDFBEF', color: '#008567', borderRadius: 999, padding: '6px 12px', fontWeight: 700, fontSize: 12 }}>{row.status || 'SUBMITTED'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
};

export default Submissions;

