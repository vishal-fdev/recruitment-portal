// import { useState } from 'react';
// import Sidebar from '../../layout/Sidebar';
// import type { Page } from '../../types/navigation';

// export default function VendorManagerDashboard() {
//   const [page, setPage] = useState<Page>('dashboard');

//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('role');
//     window.location.reload();
//   };

//   return (
//     <div className="flex min-h-screen">
//       <Sidebar page={page} setPage={setPage} />

//       <div className="flex-1 p-6 bg-gray-50">
//         <div className="flex justify-between mb-6">
//           <h1 className="text-xl font-semibold">Vendor Manager</h1>
//           <button onClick={logout} className="border px-4 py-1 rounded">
//             Logout
//           </button>
//         </div>

//         {page === 'dashboard' && <div>Vendor Manager Dashboard</div>}
//         {page === 'vendors' && <div>Vendors List</div>}
//         {page === 'jobs' && <div>Jobs</div>}
//         {page === 'candidates' && <div>Candidates</div>}
//       </div>
//     </div>
//   );
// }
