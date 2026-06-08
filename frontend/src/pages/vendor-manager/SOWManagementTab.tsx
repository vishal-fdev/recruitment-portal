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
    <Card background="white" round="20px" border={{ color: 'border-weak' }} elevation="xsmall">
      <CardBody pad="large" gap="medium">
        <Box direction="row" justify="between" align="center" wrap gap="medium">
          <Heading level={3} size="small" margin="none">
            SOW Management
          </Heading>
          <Button label="+ Add New SOW" primary color="brand" onClick={addRow} />
        </Box>

        <DataTable
          data={data.map((row, i) => ({ ...row, _index: i }))}
          columns={[
            {
              property: 'sowNumber',
              header: 'SOW Number',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput value={datum.sowNumber} onChange={(e) => updateField(datum._index, 'sowNumber', e.target.value)} />
                ) : (
                  <Text>{datum.sowNumber || '-'}</Text>
                ),
            },
            {
              property: 'startDate',
              header: 'Start Date',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput type="date" value={datum.startDate} onChange={(e) => updateField(datum._index, 'startDate', e.target.value)} />
                ) : (
                  <Text>{datum.startDate || '-'}</Text>
                ),
            },
            {
              property: 'endDate',
              header: 'End Date',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput type="date" value={datum.endDate} onChange={(e) => updateField(datum._index, 'endDate', e.target.value)} />
                ) : (
                  <Text>{datum.endDate || '-'}</Text>
                ),
            },
            {
              property: 'tcValue',
              header: 'TC Value',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput value={datum.tcValue} onChange={(e) => updateField(datum._index, 'tcValue', e.target.value)} />
                ) : (
                  <Text>{datum.tcValue || '-'}</Text>
                ),
            },
            {
              property: 'approvalStatus',
              header: 'Approval Status',
              render: (datum) =>
                editingRow === datum._index ? (
                  <Select
                    options={['', 'Pending', 'Approved']}
                    value={datum.approvalStatus}
                    onChange={({ value }) => updateField(datum._index, 'approvalStatus', String(value))}
                  />
                ) : (
                  <Text>{datum.approvalStatus || '-'}</Text>
                ),
            },
            {
              property: 'status',
              header: 'Status',
              render: (datum) =>
                editingRow === datum._index ? (
                  <Select
                    options={['Active', 'Inactive']}
                    value={datum.status}
                    onChange={({ value }) => updateField(datum._index, 'status', String(value))}
                  />
                ) : (
                  <Text>{datum.status || '-'}</Text>
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

export default SowManagementTab;
