import {
  Box,
  Button,
  Layer,
  Text,
} from 'grommet';
import api from '../../api/api';

interface Props {
  jobId: number;
  onClose: () => void;
  onRejected: () => void;
}

const RejectModal = ({ jobId, onClose, onRejected }: Props) => {
  const reject = async () => {
    await api.patch(`/jobs/${jobId}/reject`);
    onRejected();
  };

  return (
    <Layer onClickOutside={onClose} onEsc={onClose} modal responsive={false}>
      <Box width="420px" pad="24px" gap="20px">
        <Text size="large" weight={600}>
          Reject Job Requisition
        </Text>

        <Text size="small" color="#64748B">
          This action cannot be undone. The Hiring Manager will be able to edit
          and resubmit the job.
        </Text>

        <Box direction="row" justify="end" gap="12px">
          <Button label="Cancel" onClick={onClose} />
          <Button primary color="status-critical" label="Reject" onClick={reject} />
        </Box>
      </Box>
    </Layer>
  );
};

export default RejectModal;
