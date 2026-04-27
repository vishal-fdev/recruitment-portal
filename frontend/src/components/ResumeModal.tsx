import { useEffect, useState } from "react";
import api from "../api/api";

interface Props {
  candidateId: number;
  onClose: () => void;
}

const ResumeModal = ({ candidateId, onClose }: Props) => {

  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "docx" | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchResume = async () => {

      try {
        const res = await api.get(`/candidates/${candidateId}/resume`, {
          responseType: "blob",
        });
        const mimeType = res.data.type || "";
        objectUrl = URL.createObjectURL(res.data);
        setResumeUrl(objectUrl);

        if (mimeType.toLowerCase().includes("pdf")) {
          setFileType("pdf");
        } else {
          setFileType("docx");
        }

      } catch {
        alert("Unable to load resume");
      }

    };

    fetchResume();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

  }, [candidateId]);

  const downloadDoc = () => {
    if (!resumeUrl) return;

    const link = document.createElement("a");
    link.href = resumeUrl;
    link.download = "resume";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (

    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">

      <div className="bg-white w-[85%] h-[90%] rounded-lg shadow relative">

        {/* HEADER */}

        <div className="flex justify-between items-center px-4 py-2 border-b">

          <h2 className="font-semibold">
            Candidate Resume
          </h2>

          <button
            onClick={onClose}
            className="text-xl font-semibold text-purple-600"
          >
            ✕
          </button>

        </div>

        {/* BODY */}

        {resumeUrl ? (

          fileType === "pdf" ? (

            <iframe
              src={resumeUrl}
              className="w-full h-[calc(100%-45px)]"
              title="Resume"
            />

          ) : (

            <div className="flex flex-col items-center justify-center h-full space-y-4">

              <p className="text-gray-600">
                DOCX preview is not supported in local environment.
              </p>

              <button
                onClick={downloadDoc}
                className="bg-emerald-600 text-white px-6 py-2 rounded"
              >
                Download Resume
              </button>

            </div>

          )

        ) : (

          <div className="p-6 text-center">
            Loading resume...
          </div>

        )}

      </div>

    </div>

  );

};

export default ResumeModal;
