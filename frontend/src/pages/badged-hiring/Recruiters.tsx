import { FormEvent, useEffect, useState } from 'react';
import { Box, Button, Text } from 'grommet';
import { hpeBadgedHiringService, type BadgedRecruiter } from '../../services/hpeBadgedHiringService';

const cardStyle = { background: '#FFFFFF', border: '1px solid #D9E1EA', borderRadius: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.06)' } as const;
const inputStyle = { height: 42, border: '1px solid #CBD5E1', borderRadius: 8, padding: '0 12px', fontSize: 14 } as const;
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#001A3D' } as const;

const Recruiters = () => {
  const [recruiters, setRecruiters] = useState<BadgedRecruiter[]>([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => setRecruiters(await hpeBadgedHiringService.listRecruiters());

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      alert('Recruiter name and email are required');
      return;
    }
    setSaving(true);
    try {
      await hpeBadgedHiringService.createRecruiter(form);
      setForm({ name: '', email: '' });
      await load();
    } catch {
      alert('Failed to create recruiter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box gap="24px">
      <Box>
        <Text size="32px" weight={600} color="#001A3D">Recruiters</Text>
        <Text size="15px" color="#50648A" margin={{ top: '6px' }}>Create badged hiring recruiter logins and assign requisitions</Text>
      </Box>

      <Box as="form" onSubmit={submit} pad="24px" gap="18px" style={cardStyle}>
        <Text size="18px" weight={700}>Create recruiter</Text>
        <Box direction="row" gap="18px" wrap>
          <Box flex="grow" basis="280px"><label style={labelStyle}>Recruiter name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ ...inputStyle, width: '100%' }} /></Box>
          <Box flex="grow" basis="280px"><label style={labelStyle}>Recruiter email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ ...inputStyle, width: '100%' }} /></Box>
          <Box justify="end"><Button type="submit" primary color="#01A982" label={saving ? 'Creating...' : '+ Create recruiter'} disabled={saving} style={{ color: '#FFFFFF', borderRadius: 8, fontWeight: 700, padding: '10px 16px' }} /></Box>
        </Box>
      </Box>

      <Box pad="24px" gap="16px" style={cardStyle}>
        <Text size="18px" weight={700}>Recruiter list</Text>
        {recruiters.length === 0 ? (
          <Text color="#8A98B5" textAlign="center" margin={{ vertical: '32px' }}>No recruiters available yet.</Text>
        ) : recruiters.map((recruiter) => (
          <Box key={recruiter._id} direction="row" justify="between" align="center" pad="16px" background="#F6F9FC" round="10px">
            <Box><Text weight={600}>{recruiter.name}</Text><Text size="13px" color="#50648A">{recruiter.email}</Text></Box>
            <Text size="12px" weight={700} color="#008567" style={{ background: '#DDFBEF', borderRadius: 999, padding: '6px 12px' }}>Active</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Recruiters;
