// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './Login';
import WithRoleGuard from './auth/withRoleGaurd';

/* layouts */
import VendorLayout from './layouts/VendorLayout';
import VendorManagerLayout from './layouts/VendorManagerLayout';
import HiringManagerLayout from './layouts/HiringManagerLayout';

/* vendor pages */
import VendorDashboard from './pages/vendor/VendorDashboard';
import CandidateManagement from './pages/vendor/CandidateManagement';
import CreateCandidateForm from './pages/vendor/CreateCandidateForm';
import VendorJobs from './pages/vendor/Jobs';

/* vendor manager pages */
import VendorManagerDashboard from './pages/vendor-manager/VendorManagerDashboard';
import VMCandidates from './pages/vendor-manager/Candidates';
import VMJobs from './pages/vendor-manager/Jobs';
import VMVendors from './pages/vendor-manager/Vendors';
import CreateJob from './pages/vendor-manager/CreateJob';

/* hiring manager pages */
import HiringManagerDashboard from './pages/hiring-manager/HiringManagerDashboard';
import HMCandidates from './pages/hiring-manager/Candidates';
import HMPartnerSlots from './pages/hiring-manager/PartnerSlots';

const App = () => {
  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
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
        <Route path="candidates/create" element={<CreateCandidateForm />} />
        <Route path="jobs" element={<VendorJobs />} />
      </Route>

      {/* ============== VENDOR MANAGER ============== */}
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
        <Route path="jobs" element={<VMJobs />} />
        <Route path="jobs/create" element={<CreateJob />} />
        <Route path="vendors" element={<VMVendors />} />
      </Route>

      {/* ============== HIRING MANAGER ============== */}
      <Route
        path="/hiring-manager"
        element={
          <WithRoleGuard allowedRole="HIRING_MANAGER">
            <HiringManagerLayout />
          </WithRoleGuard>
        }
      >
        <Route index element={<HiringManagerDashboard />} />
        <Route path="candidates" element={<HMCandidates />} />
        <Route path="partner-slots" element={<HMPartnerSlots />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
