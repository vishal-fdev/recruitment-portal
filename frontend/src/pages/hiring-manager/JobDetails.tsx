import JobDetailsView from '../../components/JobDetailsView';

const JobDetails = () => (
  <JobDetailsView
    backRoute="/hiring-manager/jobs"
    showApprovalActions={false}
  />
);

export default JobDetails;
