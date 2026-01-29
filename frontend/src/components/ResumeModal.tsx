interface Props {
  resumePath: string;
  onClose: () => void;
}

const ResumeModal = ({ resumePath, onClose }: Props) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[80%] h-[85%] rounded-lg shadow relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl"
        >
          ✖
        </button>

        <iframe
          src={`http://localhost:3000${resumePath}`}
          title="Resume"
          className="w-full h-full rounded-b-lg"
        />
      </div>
    </div>
  );
};

export default ResumeModal;
