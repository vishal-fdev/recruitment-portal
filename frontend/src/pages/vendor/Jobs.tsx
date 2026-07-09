import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  Layer,
  Text,
} from 'grommet';
import api from '../../api/api';

interface JobFile {
  fileName: string;
}

interface Job {
  id: number;
  title: string;
  location: string;
  experience: string;
  status: string;
  numberOfPositions?: number;
  currentNumberOfPositions?: number;
  positions?: {
    id: number;
    openings?: number;
    currentOpenings?: number;
  }[];
  jdFileName?: string;
  psqFileName?: string;
  jdFiles?: JobFile[];
  psqFiles?: JobFile[];
}

type JobRow = Job & {
  hrqId: string;
  totalPositions: number;
  currentPositions: number;
};

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadError, setDownloadError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    void loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs');
      const sorted = (res.data || []).sort((a: Job, b: Job) => b.id - a.id);
      setJobs(sorted);
    } catch (err) {
      console.error('Failed to load jobs', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (
    event: MouseEvent,
    jobId: number,
    type: 'jd' | 'psq',
    fileName?: string,
    index?: number,
  ) => {
    event.stopPropagation();

    try {
      const suffix = index === undefined ? '' : `/${index}`;
      const response = await api.get(`/jobs/${jobId}/${type}/download${suffix}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `HRQ${jobId}-${type.toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to download ${type.toUpperCase()}`, error);
      setDownloadError(`Unable to download ${type.toUpperCase()} right now.`);
    }
  };

  const submitCandidate = (event: MouseEvent, jobId: number) => {
    event.stopPropagation();
    navigate(`/vendor/candidates/create?jobId=${jobId}`);
  };

  const openJobDetails = (jobId: number) => {
    navigate(`/vendor/jobs/${jobId}`);
  };

  const rows: JobRow[] = jobs.map((job) => {
    const additionalTotal =
      job.positions?.reduce((sum, position) => sum + Number(position.openings || 0), 0) || 0;
    const additionalCurrent =
      job.positions?.reduce(
        (sum, position) => sum + Number(position.currentOpenings ?? position.openings ?? 0),
        0,
      ) || 0;

    return {
      ...job,
      hrqId: `HRQ${job.id}`,
      totalPositions: Number(job.numberOfPositions || 0) + additionalTotal,
      currentPositions:
        Number(job.currentNumberOfPositions ?? job.numberOfPositions ?? 0) + additionalCurrent,
    };
  });

  return (
    <Box style={styles.page}>
      <div style={styles.headingBlock}>
        <h1 style={styles.pageTitle}>Job Requisitions</h1>
        <p style={styles.pageCaption}>Submit candidates and manage assigned job requisitions</p>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableScroller}>
          <table style={styles.table}>
            <thead>
              <tr>
                {[
                  'HRQ ID',
                  'ROLE HIRED FOR',
                  'LOCATION',
                  'EXPERIENCE',
                  'TOTAL POSITIONS',
                  'CURRENT POSITIONS',
                  'STATUS',
                  'JD',
                  'PSQ',
                  'ACTION',
                ].map((header) => (
                  <th key={header} style={styles.headerCell}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} style={styles.emptyCell}>
                    Loading jobs...
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((job, index) => (
                  <tr
                    key={job.id}
                    onClick={() => openJobDetails(job.id)}
                    style={{
                      ...styles.row,
                      background: index % 2 === 0 ? '#FFFFFF' : '#F7F9FB',
                    }}
                  >
                    <td style={styles.cell}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openJobDetails(job.id);
                        }}
                        style={styles.hrqLink}
                      >
                        {job.hrqId}
                      </button>
                    </td>
                    <td style={styles.cell}>{job.title || '-'}</td>
                    <td style={styles.cell}>{job.location || '-'}</td>
                    <td style={styles.cell}>{job.experience || '-'}</td>
                    <td style={styles.centerCell}>{job.totalPositions}</td>
                    <td style={styles.centerCell}>{job.currentPositions}</td>
                    <td style={styles.centerCell}>
                      <span style={styles.statusPill}>{getStatusLabel(job.status)}</span>
                    </td>
                    <td style={styles.centerCell}>
                      <FileLinks
                        files={job.jdFiles}
                        fallbackFileName={job.jdFileName}
                        label="Download JD"
                        onDownload={(event, fileName, fileIndex) =>
                          void handleDownload(event, job.id, 'jd', fileName, fileIndex)
                        }
                      />
                    </td>
                    <td style={styles.centerCell}>
                      <FileLinks
                        files={job.psqFiles}
                        fallbackFileName={job.psqFileName}
                        label="Download PSQ"
                        onDownload={(event, fileName, fileIndex) =>
                          void handleDownload(event, job.id, 'psq', fileName, fileIndex)
                        }
                      />
                    </td>
                    <td style={styles.centerCell}>
                      <button
                        type="button"
                        onClick={(event) => submitCandidate(event, job.id)}
                        style={styles.createButton}
                      >
                        Create
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} style={styles.emptyCell}>
                    No jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {downloadError ? (
        <Layer
          onEsc={() => setDownloadError('')}
          onClickOutside={() => setDownloadError('')}
          modal
          responsive={false}
        >
          <Box pad="medium" gap="medium" width="medium">
            <Heading level={4} margin="none">
              Download Error
            </Heading>
            <Text>{downloadError}</Text>
            <Box direction="row" justify="end">
              <Button primary label="OK" onClick={() => setDownloadError('')} />
            </Box>
          </Box>
        </Layer>
      ) : null}
    </Box>
  );
};

export default Jobs;

const FileLinks = ({
  files,
  fallbackFileName,
  label,
  onDownload,
}: {
  files?: JobFile[];
  fallbackFileName?: string;
  label: string;
  onDownload: (event: MouseEvent, fileName?: string, index?: number) => void;
}) => {
  const normalizedFiles = files?.length ? files : fallbackFileName ? [{ fileName: fallbackFileName }] : [];

  if (!normalizedFiles.length) {
    return <span>-</span>;
  }

  return (
    <div style={styles.fileLinks}>
      {normalizedFiles.map((file, index) => (
        <button
          key={`${label}-${file.fileName}-${index}`}
          type="button"
          onClick={(event) => onDownload(event, file.fileName, files?.length ? index : undefined)}
          style={styles.downloadLink}
        >
          {normalizedFiles.length > 1 ? `${label} ${index + 1}` : `${label} 1`}
        </button>
      ))}
    </div>
  );
};

const getStatusLabel = (status?: string) => {
  if (status === 'CLOSED') return 'CLOSED';
  if (status === 'ON_HOLD') return 'HOLD';
  return 'OPEN';
};

const styles = {
  page: {
    padding: '0 18px',
  },
  headingBlock: {
    marginBottom: 24,
  },
  pageTitle: {
    color: '#0B1F3A',
    fontSize: 34,
    fontWeight: 600,
    lineHeight: 1.15,
    margin: 0,
  },
  pageCaption: {
    color: '#536783',
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.4,
    margin: '8px 0 0',
  },
  tableCard: {
    background: '#FFFFFF',
    border: '1px solid #DDE5EE',
    borderRadius: 16,
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
    overflow: 'hidden',
    width: '100%',
  },
  tableScroller: {
    overflowX: 'auto' as const,
  },
  table: {
    borderCollapse: 'separate' as const,
    borderSpacing: 0,
    color: '#0B1F3A',
    fontSize: 13,
    minWidth: 1320,
    width: '100%',
  },
  headerCell: {
    background: '#93F0DD',
    color: '#0B1F3A',
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 0,
    padding: '18px 22px',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
  },
  row: {
    cursor: 'pointer',
    height: 65,
  },
  cell: {
    borderBottom: '1px solid #EDF0F4',
    color: '#10213D',
    fontSize: 13,
    fontWeight: 400,
    padding: '18px 22px',
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
  },
  centerCell: {
    borderBottom: '1px solid #EDF0F4',
    color: '#10213D',
    fontSize: 13,
    fontWeight: 400,
    padding: '18px 22px',
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
    whiteSpace: 'nowrap' as const,
  },
  hrqLink: {
    background: 'transparent',
    border: 'none',
    color: '#008E70',
    cursor: 'pointer',
    font: 'inherit',
    fontWeight: 600,
    padding: 0,
  },
  statusPill: {
    background: '#DFFBEF',
    borderRadius: 999,
    color: '#008E70',
    display: 'inline-flex',
    fontSize: 12,
    fontWeight: 600,
    justifyContent: 'center',
    minWidth: 56,
    padding: '6px 13px',
  },
  createButton: {
    background: '#00A982',
    border: 'none',
    borderRadius: 8,
    color: '#FFFFFF',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    minHeight: 32,
    minWidth: 67,
    padding: '8px 14px',
  },
  fileLinks: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  downloadLink: {
    background: 'transparent',
    border: 'none',
    color: '#008E70',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    padding: 0,
  },
  emptyCell: {
    color: '#8A99B6',
    fontSize: 14,
    padding: '52px 16px',
    textAlign: 'center' as const,
  },
};
