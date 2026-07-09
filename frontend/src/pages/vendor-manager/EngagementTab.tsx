import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import {
  Box,
  Button,
  Select,
  Text,
  TextInput,
} from 'grommet';
import api from '../../api/api';

interface Engagement {
  id?: string;
  engagementStatus: string;
  engagementType: string;
  businessUnit: string;
  evaluationStatus: string;
  evaluatedBy: string;
  extendedDate?: string;
}

const EngagementTab = () => {
  const { id } = useParams();
  const [data, setData] = useState<Engagement[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const load = async () => {
    const res = await api.get(`/vendors/${id}/engagements`);
    setData(res.data);
  };

  useEffect(() => {
    if (id) void load();
  }, [id]);

  const updateField = (index: number, field: keyof Engagement, value: string) => {
    const updated = [...data];
    updated[index][field] = value;
    setData(updated);
  };

  const saveRow = async (index: number) => {
    const row = data[index];
    if (row.id) {
      await api.patch(`/vendors/engagements/${row.id}`, row);
    } else {
      const res = await api.post(`/vendors/${id}/engagements`, row);
      const updated = [...data];
      updated[index] = res.data;
      setData(updated);
    }
    setEditingRow(null);
  };

  const addRow = () => {
    const newRow: Engagement = {
      engagementStatus: '',
      engagementType: '',
      businessUnit: '',
      evaluationStatus: '',
      evaluatedBy: '',
      extendedDate: '',
    };
    setData([...data, newRow]);
    setEditingRow(data.length);
  };

  return (
    <Box background="white" round="12px" border={{ color: '#DDE3EB' }} elevation="xsmall" pad="24px" gap="24px">
      <Box direction="row" justify="between" align="center" wrap gap="medium">
        <Text size="18px" weight={600} color="#0B1220">
          Engagement History
        </Text>
        <Button label="+ Add" primary color="brand" onClick={addRow} style={greenButtonStyle} />
      </Box>

      <div style={tableShellStyle}>
        <div style={engagementHeaderStyle}>
          {engagementHeaders.map((header) => (
            <div key={header} style={tableHeaderCellStyle}>
              {header}
            </div>
          ))}
        </div>

        {data.map((row, index) => (
          <div key={row.id || index} style={engagementRowStyle}>
            {editingRow === index ? (
              <Select options={['', 'Active', 'Inactive']} value={row.engagementStatus} onChange={({ value }) => updateField(index, 'engagementStatus', String(value))} />
            ) : (
              <Cell value={row.engagementStatus} />
            )}
            {editingRow === index ? (
              <Select options={['', 'Labour', 'Project', 'Fixed Cost']} value={row.engagementType} onChange={({ value }) => updateField(index, 'engagementType', String(value))} />
            ) : (
              <Cell value={row.engagementType} />
            )}
            <EditableText value={row.businessUnit} editing={editingRow === index} onChange={(value) => updateField(index, 'businessUnit', value)} />
            {editingRow === index ? (
              <Select options={['', 'Contract', 'Empanelled']} value={row.evaluationStatus} onChange={({ value }) => updateField(index, 'evaluationStatus', String(value))} />
            ) : (
              <Cell value={row.evaluationStatus} />
            )}
            <EditableText value={row.evaluatedBy} editing={editingRow === index} onChange={(value) => updateField(index, 'evaluatedBy', value)} />
            <EditableText value={row.extendedDate || ''} editing={editingRow === index} type="date" onChange={(value) => updateField(index, 'extendedDate', value)} />
            {editingRow === index ? (
              <Button plain label="Save" onClick={() => void saveRow(index)} style={plainActionStyle} />
            ) : (
              <Button plain icon={<Pencil size={16} />} onClick={() => setEditingRow(index)} />
            )}
          </div>
        ))}
      </div>
    </Box>
  );
};

const engagementHeaders = ['Status', 'Type', 'Business Unit', 'Evaluation', 'Evaluated By', 'Extended Date', 'Actions'];

const Cell = ({ value }: { value?: string }) => <Text size="14px" color="#0B1220">{value || '-'}</Text>;

const EditableText = ({
  value,
  editing,
  type,
  onChange,
}: {
  value: string;
  editing: boolean;
  type?: string;
  onChange: (value: string) => void;
}) => (
  editing ? <TextInput type={type} value={value} onChange={(event) => onChange(event.target.value)} size="small" /> : <Cell value={value} />
);

const greenButtonStyle = {
  color: '#FFFFFF',
  background: '#01A982',
  border: 'none',
  borderRadius: '4px',
  fontWeight: 600,
  padding: '10px 18px',
} as const;

const tableShellStyle = {
  width: '100%',
  overflowX: 'auto',
} as const;

const engagementHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1.45fr 1.45fr 1.45fr 1.45fr 1fr',
  minWidth: 1160,
  background: '#F0F2F5',
} as const;

const engagementRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1.45fr 1.45fr 1.45fr 1.45fr 1fr',
  minWidth: 1160,
  alignItems: 'center',
  borderBottom: '1px solid #E6EAF0',
  padding: '10px 0',
} as const;

const tableHeaderCellStyle = {
  padding: '14px 16px',
  color: '#0B1220',
  fontSize: 14,
  fontWeight: 600,
} as const;

const plainActionStyle = {
  color: '#01A982',
  fontWeight: 600,
} as const;

export default EngagementTab;
