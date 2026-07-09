import { Navigate, Route, Routes } from 'react-router-dom';

import Login from './Login';
import HiringManagerLayout from './layouts/HiringManagerLayout';
import VendorLayout from './layouts/VendorLayout';
import VendorManagerLayout from './layouts/VendorManagerLayout';

import HiringDashboard from './pages/hiring-manager/DashboardHome';
import HiringCandidates from './pages/hiring-manager/CandidateManagement';
import HiringCandidateDetails from './pages/hiring-manager/CandidateDetails';
import HiringJobs from './pages/hiring-manager/Jobs';
import HiringCreateJob from './pages/hiring-manager/CreateJob';
import HiringJobDetails from './pages/hiring-manager/JobDetails';
import HiringPartnerSlots from './pages/hiring-manager/PartnerSlots';

import VendorDashboard from './pages/vendor/DashboardHome';
import VendorCandidates from './pages/vendor/CandidateManagement';
import VendorCreateCandidate from './pages/vendor/candidates/CreateCandidate';
import VendorJobs from './pages/vendor/Jobs';
import VendorJobDetails from './pages/vendor/JobDetails';
import VendorPartnerSlots from './pages/vendor/PartnerSlots';

import VendorManagerDashboard from './pages/vendor-manager/DashboardHome';
import VendorManagerCandidates from './pages/vendor-manager/Candidates';
import VendorManagerJobs from './pages/vendor-manager/Jobs';
import VendorManagerCreateJob from './pages/vendor-manager/CreateJob';
import VendorManagerJobDetails from './pages/vendor-manager/JobDetails';
import VendorManagerPartnerSlots from './pages/vendor-manager/PartnerSlots';
import VendorManagerVendors from './pages/vendor-manager/Vendors';
import VendorManagerVendorDetails from './pages/vendor-manager/VendorDetails';
import HpeBadgedHiring from './pages/vendor-manager/HpeBadgedHiring';

import VendorManagerHeadDashboard from './pages/vendor-manager-head/DashboardHome';
import VendorManagerHeadJobApprovals from './pages/vendor-manager-head/JobApprovals';
import VendorManagerHeadJobDetails from './pages/vendor-manager-head/JobDetails';
import VendorManagerHeadPartnerSlots from './pages/vendor-manager-head/PartnerSlots';
import VendorManagerHeadVendors from './pages/vendor-manager-head/Vendors';
import VendorManagerHeadVendorDetails from './pages/vendor-manager-head/VendorDetails';

import PanelDashboard from './pages/panel/Dashboard';
import PanelCandidates from './pages/panel/Candidates';
import PanelJobs from './pages/panel/Jobs';
import PanelJobDetails from './pages/panel/JobDetails';

import BadgedDashboard from './pages/badged-hiring/Dashboard';
import BadgedJobs from './pages/badged-hiring/Jobs';
import BadgedCreateJob from './pages/badged-hiring/CreateJob';
import BadgedRecruiters from './pages/badged-hiring/Recruiters';
import BadgedSubmissions from './pages/badged-hiring/Submissions';
import BadgedSubmitCandidate from './pages/badged-hiring/SubmitCandidate';

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />

    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/badged-login" element={<Navigate to="/login" replace />} />
    <Route path="/badged-hiring/*" element={<Navigate to="/vendor-manager/badged-hiring" replace />} />
    <Route path="/badged-recruiter/*" element={<Navigate to="/vendor-manager/badged-hiring" replace />} />

    <Route path="/hiring-manager" element={<HiringManagerLayout />}>
      <Route index element={<HiringDashboard />} />
      <Route path="dashboard" element={<HiringDashboard />} />
      <Route path="candidates" element={<HiringCandidates />} />
      <Route path="candidates/:id" element={<HiringCandidateDetails />} />
      <Route path="jobs" element={<HiringJobs />} />
      <Route path="jobs/create" element={<HiringCreateJob />} />
      <Route path="jobs/:id" element={<HiringJobDetails />} />
      <Route path="partner-slots" element={<HiringPartnerSlots />} />
    </Route>

    <Route path="/vendor" element={<VendorLayout />}>
      <Route index element={<VendorDashboard />} />
      <Route path="dashboard" element={<VendorDashboard />} />
      <Route path="candidates" element={<VendorCandidates />} />
      <Route path="candidates/create" element={<VendorCreateCandidate />} />
      <Route path="jobs" element={<VendorJobs />} />
      <Route path="jobs/:id" element={<VendorJobDetails />} />
      <Route path="partner-slots" element={<VendorPartnerSlots />} />
    </Route>

    <Route path="/vendor-manager" element={<VendorManagerLayout />}>
      <Route index element={<VendorManagerDashboard />} />
      <Route path="dashboard" element={<VendorManagerDashboard />} />
      <Route path="candidates" element={<VendorManagerCandidates />} />
      <Route path="jobs" element={<VendorManagerJobs />} />
      <Route path="jobs/create" element={<VendorManagerCreateJob />} />
      <Route path="jobs/:id" element={<VendorManagerJobDetails />} />
      <Route path="partner-slots" element={<VendorManagerPartnerSlots />} />
      <Route path="vendors" element={<VendorManagerVendors />} />
      <Route path="vendors/:id" element={<VendorManagerVendorDetails />} />
      <Route path="badged-hiring" element={<BadgedDashboard />} />
      <Route path="badged-hiring/jobs" element={<BadgedJobs />} />
      <Route path="badged-hiring/jobs/create" element={<BadgedCreateJob />} />
      <Route path="badged-hiring/recruiters" element={<BadgedRecruiters />} />
      <Route path="badged-hiring/submissions" element={<BadgedSubmissions />} />
      <Route path="badged-hiring/submissions/create" element={<BadgedSubmitCandidate />} />
      <Route path="badged-hiring/candidates/create" element={<BadgedSubmitCandidate />} />
      <Route path="badged-hiring/hpe-badged-hiring" element={<HpeBadgedHiring />} />
    </Route>

    <Route path="/vendor-manager-head" element={<VendorManagerLayout />}>
      <Route index element={<VendorManagerHeadDashboard />} />
      <Route path="dashboard" element={<VendorManagerHeadDashboard />} />
      <Route path="jobs" element={<VendorManagerHeadJobApprovals />} />
      <Route path="jobs/:id" element={<VendorManagerHeadJobDetails />} />
      <Route path="partner-slots" element={<VendorManagerHeadPartnerSlots />} />
      <Route path="vendors" element={<VendorManagerHeadVendors />} />
      <Route path="vendors/:id" element={<VendorManagerHeadVendorDetails />} />
    </Route>

    <Route path="/panel" element={<HiringManagerLayout />}>
      <Route index element={<PanelDashboard />} />
      <Route path="dashboard" element={<PanelDashboard />} />
      <Route path="candidates" element={<PanelCandidates />} />
      <Route path="jobs" element={<PanelJobs />} />
      <Route path="jobs/:id" element={<PanelJobDetails />} />
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default App;