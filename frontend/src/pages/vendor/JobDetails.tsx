import JobDetailsView from '../../components/JobDetailsView';

const VendorJobDetails = () => (
  <JobDetailsView
    backRoute="/vendor/candidates?tab=hrq"
    showApprovalActions={false}
    allowResubmit={false}
  />
);

export default VendorJobDetails;
