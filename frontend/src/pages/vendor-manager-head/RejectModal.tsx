// src/pages/vendor-manager-head/RejectModal.tsx
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          Reject Job Requisition
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. The Hiring Manager
          will be able to edit and resubmit the job.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={reject}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
