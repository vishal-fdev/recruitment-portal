import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../../services/jobService';

const CreateJob = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    location: '',
    experience: '',
    department: '',
    employmentType: '',
    budget: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [rounds, setRounds] = useState<any[]>([]);

  const addRound = () => {
    setRounds([
      ...rounds,
      { roundName: '', mode: '', panels: [] },
    ]);
  };

  const updateRound = (index: number, key: string, value: any) => {
    const updated = [...rounds];
    updated[index][key] = value;
    setRounds(updated);
  };

  const addPanel = (index: number) => {
    const updated = [...rounds];
    updated[index].panels.push('');
    setRounds(updated);
  };

  const updatePanel = (
    roundIndex: number,
    panelIndex: number,
    value: string,
  ) => {
    const updated = [...rounds];
    updated[roundIndex].panels[panelIndex] = value;
    setRounds(updated);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    await createJob({
      ...form,
      interviewRounds: rounds,
    });

    navigate('/hiring-manager/jobs');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">
        Create Job Requisition
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-8 space-y-8"
      >
        <input
          name="title"
          placeholder="Title"
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
          className="w-full border p-2"
        />

        {/* Interview Rounds */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Interview Rounds
          </h2>

          {rounds.map((round, i) => (
            <div
              key={i}
              className="border p-4 mb-4 rounded"
            >
              <input
                placeholder="Round Name"
                value={round.roundName}
                onChange={(e) =>
                  updateRound(
                    i,
                    'roundName',
                    e.target.value,
                  )
                }
                className="w-full border p-2 mb-2"
              />

              <input
                placeholder="Mode (Virtual/F2F)"
                value={round.mode}
                onChange={(e) =>
                  updateRound(i, 'mode', e.target.value)
                }
                className="w-full border p-2 mb-2"
              />

              {round.panels.map(
                (panel: string, pIndex: number) => (
                  <input
                    key={pIndex}
                    placeholder="Panel Member"
                    value={panel}
                    onChange={(e) =>
                      updatePanel(
                        i,
                        pIndex,
                        e.target.value,
                      )
                    }
                    className="w-full border p-2 mb-2"
                  />
                ),
              )}

              <button
                type="button"
                onClick={() => addPanel(i)}
                className="text-blue-600 text-sm"
              >
                + Add Panel
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addRound}
            className="text-emerald-600"
          >
            + Add Round
          </button>
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-emerald-600 text-white rounded-md"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default CreateJob;
