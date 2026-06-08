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
    <Card background="white" round="20px" border={{ color: 'border-weak' }} elevation="xsmall">
      <CardBody pad="large" gap="medium">
        <Box direction="row" justify="between" align="center" wrap gap="medium">
          <Heading level={3} size="small" margin="none">
            Engagement History
          </Heading>
          <Button label="+ Add" primary color="brand" onClick={addRow} />
        </Box>

        <DataTable
          data={data.map((row, i) => ({ ...row, _index: i }))}
          columns={[
            {
              property: 'engagementStatus',
              header: 'Status',
              render: (datum) =>
                editingRow === datum._index ? (
                  <Select
                    options={['', 'Active', 'Inactive']}
                    value={datum.engagementStatus}
                    onChange={({ value }) => updateField(datum._index, 'engagementStatus', String(value))}
                  />
                ) : (
                  <Text>{datum.engagementStatus || '-'}</Text>
                ),
            },
            {
              property: 'engagementType',
              header: 'Type',
              render: (datum) =>
                editingRow === datum._index ? (
                  <Select
                    options={['', 'Labour', 'Project', 'Fixed Cost']}
                    value={datum.engagementType}
                    onChange={({ value }) => updateField(datum._index, 'engagementType', String(value))}
                  />
                ) : (
                  <Text>{datum.engagementType || '-'}</Text>
                ),
            },
            {
              property: 'businessUnit',
              header: 'Business Unit',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput
                    value={datum.businessUnit}
                    onChange={(e) => updateField(datum._index, 'businessUnit', e.target.value)}
                  />
                ) : (
                  <Text>{datum.businessUnit || '-'}</Text>
                ),
            },
            {
              property: 'evaluationStatus',
              header: 'Evaluation',
              render: (datum) =>
                editingRow === datum._index ? (
                  <Select
                    options={['', 'Contract', 'Empanelled']}
                    value={datum.evaluationStatus}
                    onChange={({ value }) => updateField(datum._index, 'evaluationStatus', String(value))}
                  />
                ) : (
                  <Text>{datum.evaluationStatus || '-'}</Text>
                ),
            },
            {
              property: 'evaluatedBy',
              header: 'Evaluated By',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput
                    value={datum.evaluatedBy}
                    onChange={(e) => updateField(datum._index, 'evaluatedBy', e.target.value)}
                  />
                ) : (
                  <Text>{datum.evaluatedBy || '-'}</Text>
                ),
            },
            {
              property: 'extendedDate',
              header: 'Extended Date',
              render: (datum) =>
                editingRow === datum._index ? (
                  <TextInput
                    type="date"
                    value={datum.extendedDate || ''}
                    onChange={(e) => updateField(datum._index, 'extendedDate', e.target.value)}
                  />
                ) : (
                  <Text>{datum.extendedDate || '-'}</Text>
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

export default EngagementTab;
