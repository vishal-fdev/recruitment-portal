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

interface Sow {
  id?: number;
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcValue: string;
  approvalStatus: string;
  status: string;
}

const SowManagementTab = () => {
  const { id } = useParams();
  const [data, setData] = useState<Sow[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const load = async () => {
    const res = await api.get(`/vendors/${id}/sows`);
    setData(res.data);
  };

  useEffect(() => {
    if (id) void load();
  }, [id]);

  const updateField = (index: number, field: keyof Sow, value: string) => {
    const updated = [...data];
    (updated[index] as any)[field] = value;
    setData(updated);
  };

  const saveRow = async (index: number) => {
    const row = data[index];
    if (row.id) {
      await api.patch(`/vendors/sows/${row.id}`, row);
    } else {
      const res = await api.post(`/vendors/${id}/sows`, row);
      const updated = [...data];
      updated[index] = res.data;
      setData(updated);
    }
    setEditingRow(null);
  };

  const addRow = () => {
    const newRow: Sow = {
      sowNumber: '',
      startDate: '',
      endDate: '',
      tcValue: '',
      approvalStatus: '',
      status: 'Active',
    };
    setData([...data, newRow]);
    setEditingRow(data.length);
  };

  return (
    <Box background="white" round="12px" border={{ color: '#DDE3EB' }} elevation="xsmall" pad="24px" gap="16px">
      <Box direction="row" justify="between" align="center" wrap gap="medium">
        <Text size="18px" weight={600} color="#0B1220">
          SOW Management
        </Text>
        <Button label="+ Add New SOW" primary color="brand" onClick={addRow} style={greenButtonStyle} />
      </Box>

      <div style={tableShellStyle}>
        <div style={sowHeaderStyle}>
          {sowHeaders.map((header) => (
            <div key={header} style={tableHeaderCellStyle}>
              {header}
            </div>
          ))}
        </div>

        {data.map((row, index) => (
          <div key={row.id || index} style={sowRowStyle}>
            <EditableText value={row.sowNumber} editing={editingRow === index} onChange={(value) => updateField(index, 'sowNumber', value)} />
            <EditableText value={row.startDate} editing={editingRow === index} type="date" onChange={(value) => updateField(index, 'startDate', value)} />
            <EditableText value={row.endDate} editing={editingRow === index} type="date" onChange={(value) => updateField(index, 'endDate', value)} />
            <EditableText value={row.tcValue} editing={editingRow === index} onChange={(value) => updateField(index, 'tcValue', value)} />
            {editingRow === index ? (
              <Select options={['', 'Pending', 'Approved']} value={row.approvalStatus} onChange={({ value }) => updateField(index, 'approvalStatus', String(value))} />
            ) : (
              <Cell value={row.approvalStatus} />
            )}
            {editingRow === index ? (
              <Select options={['Active', 'Inactive']} value={row.status} onChange={({ value }) => updateField(index, 'status', String(value))} />
            ) : (
              <Cell value={row.status} />
            )}
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

const sowHeaders = ['SOW Number', 'Start Date', 'End Date', 'TC Value', 'Approval Status', 'Status', 'Actions'];

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

const sowHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: '1.25fr 1.05fr 1.05fr 1.15fr 1.25fr 1fr 1fr',
  minWidth: 1160,
  background: '#F0F2F5',
} as const;

const sowRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1.25fr 1.05fr 1.05fr 1.15fr 1.25fr 1fr 1fr',
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

export default SowManagementTab;
