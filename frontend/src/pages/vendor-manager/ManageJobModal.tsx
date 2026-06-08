import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CheckBox,
  Layer,
  Text,
} from 'grommet';
import api from '../../api/api';

interface Vendor {
  id: string;
  email: string;
  isEnabled: boolean;
}

interface JobDetails {
  id: number;
  title: string;
  vendors: Vendor[];
}

interface Props {
  jobId: number;
  onClose: () => void;
  onUpdated: () => void;
}

const ManageJobModal = ({ jobId, onClose, onUpdated }: Props) => {
  const [job, setJob] = useState<JobDetails | null>(null);

  useEffect(() => {
    api
      .get(`/jobs/${jobId}`)
      .then((res) => {
        setJob(res.data);
      })
      .catch(console.error);
  }, [jobId]);

  if (!job) return null;

  const toggleVendor = async (
    vendorId: string,
    isEnabled: boolean,
  ) => {
    await api.patch(
      `/jobs/${job.id}/vendors/${vendorId}`,
      { isEnabled },
    );

    setJob({
      ...job,
      vendors: job.vendors.map((v) =>
        v.id === vendorId
          ? { ...v, isEnabled }
          : v,
      ),
    });

    onUpdated();
  };

  return (
    <Layer
      onClickOutside={onClose}
      onEsc={onClose}
      modal
      responsive={false}
    >
      <Box width="520px" pad="24px" gap="20px">
        <Box direction="row" justify="between" align="center">
          <Text size="large" weight={600}>
            Assign Vendors - {job.title}
          </Text>
          <Button plain label="x" onClick={onClose} />
        </Box>

        {job.vendors.length === 0 ? (
          <Text size="small" color="#64748B">
            No vendors available
          </Text>
        ) : (
          <Box gap="8px">
            {job.vendors.map((v) => (
              <Box
                key={v.id}
                direction="row"
                align="center"
                justify="between"
                pad={{ vertical: '12px' }}
                border={{ side: 'bottom', color: 'border-weak' }}
              >
                <Text size="small">{v.email}</Text>
                <CheckBox
                  checked={v.isEnabled}
                  onChange={(event) =>
                    void toggleVendor(v.id, event.target.checked)
                  }
                />
              </Box>
            ))}
          </Box>
        )}

        <Box direction="row" justify="end">
          <Button label="Close" onClick={onClose} />
        </Box>
      </Box>
    </Layer>
  );
};

export default ManageJobModal;
