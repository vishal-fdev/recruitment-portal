export default function JobCard({ job }: any) {
  return (
    <div className="job-card">
      <h4>{job.title}</h4>
      <p>{job.location}</p>

      <span className={`job-status ${job.status}`}>
        {job.status}
      </span>
    </div>
  );
}
