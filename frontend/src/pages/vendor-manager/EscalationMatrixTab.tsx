import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import {
  Box,
  Button,
  Text,
  TextInput,
} from 'grommet';
import api from '../../api/api';

interface Escalation {
  id?: string;
  contactType: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  designation: string;
  approvalStatus: string;
  status: string;
}

const EscalationMatrixTab = () => {
  const { id } = useParams();
  const [data, setData] = useState<Escalation[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const fetchEscalations = async () => {
    const res = await api.get(`/vendors/${id}/escalations`);
    setData(res.data);
  };

  useEffect(() => {
    if (id) void fetchEscalations();
  }, [id]);

  const updateField = (index: number, field: keyof Escalation, value: string) => {
    const updated = [...data];
    updated[index][field] = value;
    setData(updated);
  };

  const saveRow = async (index: number) => {
    const row = data[index];
    if (row.id) {
      await api.patch(`/vendors/escalations/${row.id}`, row);
    } else {
      const res = await api.post(`/vendors/${id}/escalations`, row);
      const updated = [...data];
      updated[index] = res.data;
      setData(updated);
    }
    setEditingRow(null);
  };

  const addRow = () => {
    const newRow: Escalation = {
      contactType: '',
      name: '',
      email: '',
      phone: '',
      country: '',
      designation: '',
      approvalStatus: 'Pending',
      status: 'Active',
    };
    setData([...data, newRow]);
    setEditingRow(data.length);
  };

  return (
    <Box background="white" round="20px" border={{ color: '#DDE3EB' }} elevation="xsmall" pad="24px" gap="24px">
      <Box direction="row" justify="between" align="center" wrap gap="medium">
        <Text size="18px" weight={600} color="#0B1220">
            Escalation Matrix
        </Text>
        <Button label="+ Add" primary color="brand" onClick={addRow} style={addButtonStyle} />
      </Box>

      <div style={tableShellStyle}>
        <div style={tableHeaderStyle}>
          {headers.map((header) => (
            <div key={header} style={tableHeaderCellStyle}>
              {header}
            </div>
          ))}
        </div>

        {data.map((row, index) => (
          <div key={row.id || index} style={tableRowStyle}>
            <EditableCell value={row.contactType} editing={editingRow === index} onChange={(value) => updateField(index, 'contactType', value)} />
            <EditableCell value={row.name} editing={editingRow === index} onChange={(value) => updateField(index, 'name', value)} />
            <EditableCell value={row.email} editing={editingRow === index} onChange={(value) => updateField(index, 'email', value)} />
            <EditableCell value={row.phone} editing={editingRow === index} onChange={(value) => updateField(index, 'phone', value)} />
            <EditableCell value={row.country} editing={editingRow === index} onChange={(value) => updateField(index, 'country', value)} />
            <EditableCell value={row.designation} editing={editingRow === index} onChange={(value) => updateField(index, 'designation', value)} />
            <Text size="14px" color="#01A982">{row.approvalStatus}</Text>
            <Box background="#DDFBF2" pad={{ horizontal: '10px', vertical: '5px' }} round="999px" width="fit-content">
              <Text size="12px" weight={600} color="#007A5E">{row.status}</Text>
            </Box>
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

const headers = ['Contact Type', 'Name', 'Email', 'Contact Number', 'Country', 'Designation', 'Approval', 'Status', 'Actions'];

const EditableCell = ({
  value,
  editing,
  onChange,
}: {
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) => (
  editing ? (
    <TextInput value={value} onChange={(event) => onChange(event.target.value)} size="small" />
  ) : (
    <Text size="14px" color="#0B1220">{value || '-'}</Text>
  )
);

const addButtonStyle = {
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

const tableHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: '1.15fr 1fr 1.1fr 1.4fr 1fr 1.25fr 1fr 1fr 1fr',
  minWidth: 1280,
  background: '#F0F2F5',
} as const;

const tableHeaderCellStyle = {
  padding: '14px 16px',
  color: '#0B1220',
  fontSize: 14,
  fontWeight: 600,
} as const;

const tableRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1.15fr 1fr 1.1fr 1.4fr 1fr 1.25fr 1fr 1fr 1fr',
  minWidth: 1280,
  alignItems: 'center',
  borderBottom: '1px solid #E6EAF0',
  padding: '10px 0',
} as const;

const plainActionStyle = {
  color: '#01A982',
  fontWeight: 600,
} as const;

export default EscalationMatrixTab;
