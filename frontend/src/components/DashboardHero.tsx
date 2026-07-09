import { Box, Text } from 'grommet';
import type { ReactNode } from 'react';

type HeroMetric = {
  accent: string;
  title: string;
  value: number | string;
  helper: string;
  helperColor?: string;
};

type DashboardHeroProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  metrics: HeroMetric[];
};

export const DashboardHero = ({ title, subtitle, actions, metrics }: DashboardHeroProps) => (
  <section style={styles.hero}>
    <div style={styles.heroHeader}>
      <div>
        <h1 style={styles.heroTitle}>{title}</h1>
        <p style={styles.heroSubtitle}>{subtitle}</p>
      </div>
      {actions ? <div style={styles.heroActions}>{actions}</div> : null}
    </div>

    <div style={styles.metricGrid}>
      {metrics.map((metric) => (
        <article key={metric.title} style={styles.metricCard}>
          <div style={{ ...styles.metricAccent, background: metric.accent }} />
          <div style={styles.metricBody}>
            <div style={styles.metricTitle}>{metric.title}</div>
            <div style={styles.metricValue}>{metric.value}</div>
            <div style={{ ...styles.metricHelper, color: metric.helperColor || '#94A3B8' }}>
              {metric.helper}
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);

export const DashboardSection = ({
  title,
  action,
  minHeight,
  bodyMinHeight,
  children,
}: {
  title: string;
  action?: ReactNode;
  minHeight?: number;
  bodyMinHeight?: number;
  children: ReactNode;
}) => (
  <section style={{ ...styles.section, ...(minHeight ? { minHeight } : {}) }}>
    <div style={styles.sectionHeader}>
      <h2 style={styles.sectionTitle}>
        {title}
      </h2>
        {action}
    </div>
    <div style={{ ...styles.sectionBody, ...(bodyMinHeight ? { minHeight: bodyMinHeight } : {}) }}>
      {children}
    </div>
  </section>
);

export const DashboardEmpty = ({ message, height = '300px' }: { message: string; height?: string }) => (
  <Box
    height={height}
    fill="horizontal"
    align="center"
    justify="center"
    style={{ minHeight: height, width: '100%' }}
  >
    <Text size="small" color="#94A3B8">
      {message}
    </Text>
  </Box>
);

export default DashboardHero;

const styles = {
  hero: {
    display: 'block',
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #DDE3EB',
    borderRadius: 24,
    padding: 32,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
    boxSizing: 'border-box' as const,
  },
  heroHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap' as const,
    marginBottom: 24,
  },
  heroTitle: {
    margin: 0,
    color: '#0B1F44',
    fontSize: 40,
    lineHeight: '48px',
    fontWeight: 700,
  },
  heroSubtitle: {
    margin: '8px 0 0',
    color: '#64748B',
    fontSize: 16,
    lineHeight: '22px',
  },
  heroActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 16,
    width: '100%',
  },
  metricCard: {
    display: 'block',
    minHeight: 150,
    background: '#FFFFFF',
    border: '1px solid #DDE3EB',
    borderRadius: 20,
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
  },
  metricAccent: {
    height: 4,
    width: '100%',
  },
  metricBody: {
    padding: 24,
  },
  metricTitle: {
    color: '#A0A8B8',
    fontSize: 13,
    lineHeight: '18px',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  metricValue: {
    marginTop: 12,
    color: '#0B1F44',
    fontSize: 46,
    lineHeight: '52px',
    fontWeight: 700,
  },
  metricHelper: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: '20px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    minHeight: 392,
    background: '#FFFFFF',
    border: '1px solid #DDE3EB',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    margin: 0,
    color: '#0B1220',
    fontSize: 18,
    lineHeight: '24px',
    fontWeight: 700,
  },
  sectionBody: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column' as const,
    minHeight: 300,
    width: '100%',
  },
};
