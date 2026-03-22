import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import ProfileTab from "./ProfileTab";
import ContactMatrixTab from "./ContactMatrixTab";
import EscalationMatrixTab from "./EscalationMatrixTab";
import EngagementTab from "./EngagementTab";
import SowManagementTab from "./SOWManagementTab";

const VendorDetails = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("profile");

  return (

    <div className="w-full space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <div className="flex items-center gap-4">

          {/* BACK BUTTON */}

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#00A982] hover:bg-[#008f6f] text-white rounded font-medium"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-semibold">
            Vendor Details
          </h1>

        </div>

        <span className="text-sm text-gray-500">
          Partner ID: {id}
        </span>

      </div>

      {/* TAB BAR */}

      <div className="bg-gray-200 rounded-xl p-2 flex text-sm font-medium">

        {[
          "profile",
          "contact matrix",
          "escalation matrix",
          "engagement",
          "sow/po management"
        ].map((t) => (

          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-center py-2 rounded-lg ${
              tab === t
                ? "bg-white shadow text-gray-900"
                : "text-gray-600"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>

        ))}

      </div>

      {/* TAB CONTENT */}

      {tab === "profile" && <ProfileTab />}

      {tab === "contact matrix" && <ContactMatrixTab />}

      {tab === "escalation matrix" && <EscalationMatrixTab />}

      {tab === "engagement" && <EngagementTab />}

      {tab === "sow/po management" && <SowManagementTab />}

    </div>

  );

};

export default VendorDetails;