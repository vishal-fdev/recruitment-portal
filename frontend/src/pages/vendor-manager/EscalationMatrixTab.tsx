import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import {
  Box,
  Button,
  Card,
  CardBody,
  DataTable,
  Heading,
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
    <Card background="white" round="20px" border={{ color: 'border-weak' }} elevation="xsmall">
      <CardBody pad="large" gap="medium">
        <Box direction="row" justify="between" align="center" wrap gap="medium">
          <Heading level={3} size="small" margin="none">
            Escalation Matrix
          </Heading>
          <Button label="+ Add" primary color="brand" onClick={addRow} />
        </Box>

        <DataTable
          data={data.map((row, i) => ({ ...row, _index: i }))}
          columns={[
            {
              property: 'contactType',
              header: 'Contact Type',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput value={datum.contactType} onChange={(e) => updateField(datum._index, 'contactType', e.target.value)} />
                ) : (
                  <Text>{datum.contactType || '-'}</Text>
                ),
            },
            {
              property: 'name',
              header: 'Name',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput value={datum.name} onChange={(e) => updateField(datum._index, 'name', e.target.value)} />
                ) : (
                  <Text>{datum.name || '-'}</Text>
                ),
            },
            {
              property: 'email',
              header: 'Email',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput value={datum.email} onChange={(e) => updateField(datum._index, 'email', e.target.value)} />
                ) : (
                  <Text>{datum.email || '-'}</Text>
                ),
            },
            {
              property: 'phone',
              header: 'Contact Number',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput value={datum.phone} onChange={(e) => updateField(datum._index, 'phone', e.target.value)} />
                ) : (
                  <Text>{datum.phone || '-'}</Text>
                ),
            },
            {
              property: 'country',
              header: 'Country',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput value={datum.country} onChange={(e) => updateField(datum._index, 'country', e.target.value)} />
                ) : (
                  <Text>{datum.country || '-'}</Text>
                ),
            },
            {
              property: 'designation',
              header: 'Designation',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput value={datum.designation} onChange={(e) => updateField(datum._index, 'designation', e.target.value)} />
                ) : (
                  <Text>{datum.designation || '-'}</Text>
                ),
            },
            {
              property: 'approvalStatus',
              header: 'Approval',
              render: (datum) => <Text color="brand">{datum.approvalStatus}</Text>,
            },
            {
              property: 'status',
              header: 'Status',
              render: (datum) => (
                <Box background="#DDFBF2" pad={{ horizontal: 'small', vertical: 'xsmall' }} round="small">
                  <Text size="xsmall" weight="bold" color="#0F766E">
                    {datum.status}
                  </Text>
                </Box>
              ),
            },
            {
              property: 'actions',
              header: 'Actions',
              render: (datum) =>
                editingRow === datum._index ? (
                  <Button plain label="Save" color="brand" onClick={() => void saveRow(datum._index)} />
                ) : (
                  <Button plain icon={<Pencil size={16} />} onClick={() => setEditingRow(datum._index)} />
                ),
            },
          ]}
        />
      </CardBody>
    </Card>
  );
};

export default EscalationMatrixTab;
