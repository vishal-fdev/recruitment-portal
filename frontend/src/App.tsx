// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './Login';
import WithRoleGuard from './auth/withRoleGaurd';

/* layouts */
import VendorLayout from './layouts/VendorLayout';
import VendorManagerLayout from './layouts/VendorManagerLayout';
import HiringManagerLayout from './layouts/HiringManagerLayout';

/* shared */
import CandidateDetails from './pages/hiring-manager/CandidateDetails';

/* vendor pages */
import VendorDashboard from './pages/vendor/VendorDashboard';
import CandidateManagement from './pages/vendor/CandidateManagement';
import CreateCandidateForm from './pages/vendor/CreateCandidateForm';
import VendorJobs from './pages/vendor/Jobs';
import VendorDetails from './pages/vendor-manager/VendorDetails';

/* vendor manager pages */
import VendorManagerDashboard from './pages/vendor-manager/VendorManagerDashboard';
import VMCandidates from './pages/vendor-manager/Candidates';
import VMJobs from './pages/vendor-manager/Jobs';
import VMVendors from './pages/vendor-manager/Vendors';

/* vendor manager head pages */
import VMHDashboard from './pages/vendor-manager-head/DashboardHome';
import JobApprovals from './pages/vendor-manager-head/JobApprovals';
import VMHJobDetails from './pages/vendor-manager-head/JobDetails';
import VMHVendors from './pages/vendor-manager-head/Vendors';   // ✅ CORRECT IMPORT
import VMHVendorDetails from './pages/vendor-manager-head/VendorDetails'; // ✅ CORRECT IMPORT

/* hiring manager pages */
import HiringManagerDashboard from './pages/hiring-manager/HiringManagerDashboard';
import HMCandidates from './pages/hiring-manager/Candidates';
import HMPartnerSlots from './pages/hiring-manager/PartnerSlots';
import HMJobs from './pages/hiring-manager/Jobs';
import CreateJob from './pages/hiring-manager/CreateJob';
import HMJobDetails from './pages/hiring-manager/JobDetails';

import VMJobDetails from './pages/vendor-manager/JobDetails';
import VendorJobDetails from './pages/vendor/JobDetails';

const App = () => {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />

      {/* ================= VENDOR ================= */}
      <Route
        path="/vendor"
        element={
          <WithRoleGuard allowedRole="VENDOR">
            <VendorLayout />
          </WithRoleGuard>
        }
      >
        <Route index element={<VendorDashboard />} />
        <Route path="candidates" element={<CandidateManagement />} />
        <Route path="candidates/:id" element={<CandidateDetails />} />
        <Route path="candidates/create" element={<CreateCandidateForm />} />
        <Route path="jobs" element={<VendorJobs />} />
        <Route path="profile/:id" element={<VendorDetails />} />
        <Route path="jobs/:id" element={<VendorJobDetails />} />
      </Route>

      {/* ================= VENDOR MANAGER ================= */}
      <Route
        path="/vendor-manager"
        element={
          <WithRoleGuard allowedRole="VENDOR_MANAGER">
            <VendorManagerLayout />
          </WithRoleGuard>
        }
      >
        <Route index element={<VendorManagerDashboard />} />
        <Route path="candidates" element={<VMCandidates />} />
        <Route path="candidates/:id" element={<CandidateDetails />} />
        <Route path="jobs" element={<VMJobs />} />
        <Route path="vendors" element={<VMVendors />} />
        <Route path="vendors/:id" element={<VendorDetails />} />
        <Route path="jobs/:id" element={<VMJobDetails />} />
      </Route>

      {/* ================= VENDOR MANAGER HEAD ================= */}
      <Route
        path="/vendor-manager-head"
        element={
          <WithRoleGuard allowedRole="VENDOR_MANAGER_HEAD">
            <VendorManagerLayout />
          </WithRoleGuard>
        }
      >
        <Route index element={<VMHDashboard />} />
        <Route path="jobs" element={<JobApprovals />} />
        <Route path="jobs/:id" element={<VMHJobDetails />} />

        {/* ✅ FIXED ROUTES */}
        <Route path="vendors" element={<VMHVendors />} />
        <Route path="vendors/:id" element={<VMHVendorDetails />} />

        <Route path="candidates/:id" element={<CandidateDetails />} />
      </Route>

      {/* ================= HIRING MANAGER ================= */}
      <Route
        path="/hiring-manager"
        element={
          <WithRoleGuard allowedRole="HIRING_MANAGER">
            <HiringManagerLayout />
          </WithRoleGuard>
        }
      >
        <Route index element={<HiringManagerDashboard />} />
        <Route path="jobs" element={<HMJobs />} />
        <Route path="jobs/create" element={<CreateJob />} />
        <Route path="edit-job/:id" element={<CreateJob />} />
        <Route path="jobs/:id" element={<HMJobDetails />} />
        <Route path="candidates" element={<HMCandidates />} />
        <Route path="candidates/:id" element={<CandidateDetails />} />
        <Route path="partner-slots" element={<HMPartnerSlots />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
};

export default App;