import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Text } from 'grommet';
import { useNavigate } from 'react-router-dom';
import { hpeBadgedHiringService, type BadgedJob, type BadgedRecruiter } from '../../services/hpeBadgedHiringService';
import { authService } from '../../auth/authService';

const cardStyle = { background: '#FFFFFF', border: '1px solid #D9E1EA', borderRadius: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.06)' } as const;
const tableHeader = { background: '#8EEBD8', color: '#001A3D', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const };
const buttonStyle = { color: '#FFFFFF', borderRadius: 8, fontWeight: 700 } as const;

const Jobs = () => {
  const navigate = useNavigate();
  const role = authService.getRole();
  const isManager = role === 'BADGED_HIRING_MANAGER' || role === 'VENDOR_MANAGER';
  const [jobs, setJobs] = useState<BadgedJob[]>([]);
  const [recruiters, setRecruiters] = useState<BadgedRecruiter[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const [jobData, recruiterData] = await Promise.all([
      hpeBadgedHiringService.listJobs(),
      isManager ? hpeBadgedHiringService.listRecruiters() : Promise.resolve([]),
    ]);
    setJobs(jobData);
    setRecruiters(recruiterData);
    setAssignments(
      jobData.reduce<Record<string, string[]>>((acc, job) => {
        acc[job._id] = (job.assignedRecruiters || []).map((recruiter) => recruiter.id);
        return acc;
      }, {}),
    );
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const selectedNames = useMemo(() => {
    return recruiters.reduce<Record<string, string>>((acc, recruiter) => {
      acc[recruiter._id] = recruiter.name || recruiter.email;
      return acc;
    }, {});
  }, [recruiters]);

  const toggleAssignment = (jobId: string, recruiterId: string) => {
    setAssignments((current) => {
      const existing = current[jobId] || [];
      return {
        ...current,
        [jobId]: existing.includes(recruiterId)
          ? existing.filter((id) => id !== recruiterId)
          : [...existing, recruiterId],
      };
    });
  };

  const saveAssignment = async (job: BadgedJob) => {
    setSavingId(job._id);
    try {
      await hpeBadgedHiringService.assignRecruiters(job._id, assignments[job._id] || []);
      await load();
    } catch {
      alert('Failed to assign recruiters');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Box gap="24px">
      <Box direction="row" align="end" justify="between">
        <Box>
          <Text size="32px" weight={600} color="#001A3D">Job Requisitions</Text>
          <Text size="15px" color="#50648A" margin={{ top: '6px' }}>
            {isManager ? 'Create, assign, and manage badged hiring requisitions' : 'View assigned jobs and submit candidates for open requisitions'}
          </Text>
        </Box>
        {isManager && (
          <Button primary color="#01A982" label="+ Create job" onClick={() => navigate('/vendor-manager/badged-hiring/jobs/create')} style={{ ...buttonStyle, padding: '12px 20px' }} />
        )}
      </Box>

      <Box overflow="auto" style={cardStyle} pad="18px">
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: isManager ? 1120 : 980 }}>
          <thead>
            <tr>
              {['HRQ ID', 'Role Hired For', 'Location', 'Level', 'Total Positions', 'Current Positions', 'Status', isManager ? 'Assigned Recruiters' : 'Action'].map((heading) => (
                <th key={heading} style={{ ...tableHeader, padding: '16px 14px', textAlign: 'left' }}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 52, textAlign: 'center', color: '#8A98B5' }}>No job requisitions available yet.</td></tr>
            ) : jobs.map((job) => (
              <tr key={job._id} style={{ borderBottom: '1px solid #EEF2F7' }}>
                <td style={{ padding: '16px 14px', color: '#008567', fontWeight: 600 }}>{job.jobId}</td>
                <td style={{ padding: '16px 14px', fontWeight: 600 }}>{job.title}</td>
                <td style={{ padding: '16px 14px' }}>{job.location || '-'}</td>
                <td style={{ padding: '16px 14px' }}>{job.level || '-'}</td>
                <td style={{ padding: '16px 14px' }}>{job.positions || 0}</td>
                <td style={{ padding: '16px 14px' }}>{job.currentPositions || job.positions || 0}</td>
                <td style={{ padding: '16px 14px' }}><span style={{ background: '#DDFBEF', color: '#008567', borderRadius: 999, padding: '6px 14px', fontWeight: 700, fontSize: 12 }}>{job.status || 'OPEN'}</span></td>
                <td style={{ padding: '16px 14px' }}>
                  {isManager ? (
                    <Box gap="10px">
                      <Box direction="row" gap="10px" wrap>
                        {recruiters.length === 0 ? <Text size="13px" color="#8A98B5">Create recruiters first</Text> : recruiters.map((recruiter) => (
                          <label key={recruiter._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F5F8FC', border: '1px solid #D9E1EA', borderRadius: 999, padding: '7px 10px', fontSize: 12 }}>
                            <input type="checkbox" checked={(assignments[job._id] || []).includes(recruiter._id)} onChange={() => toggleAssignment(job._id, recruiter._id)} />
                            {recruiter.name || recruiter.email}
                          </label>
                        ))}
                      </Box>
                      <Box direction="row" align="center" gap="10px">
                        <Button primary color="#01A982" label={savingId === job._id ? 'Saving...' : 'Save assignment'} onClick={() => saveAssignment(job)} disabled={savingId === job._id} style={{ ...buttonStyle, padding: '8px 14px', fontSize: 13 }} />
                        <Text size="12px" color="#50648A">
                          {(assignments[job._id] || []).map((id) => selectedNames[id]).filter(Boolean).join(', ') || 'No recruiters assigned'}
                        </Text>
                      </Box>
                    </Box>
                  ) : (
                    <Button primary color="#01A982" label="Submit Candidate" onClick={() => navigate(`/vendor-manager/badged-hiring/submissions/create?jobId=${job.jobId}`)} style={{ ...buttonStyle, padding: '9px 14px' }} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
};

export default Jobs;

