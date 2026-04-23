import JobDetailsView from '../../components/JobDetailsView';

const PanelJobDetails = () => (
  <JobDetailsView
    backRoute="/panel/jobs"
    showApprovalActions={false}
  />
);

export default PanelJobDetails;
