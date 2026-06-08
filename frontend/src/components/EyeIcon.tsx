import { Box } from 'grommet';

interface Props {
  size?: string;
}

const EyeIcon = ({ size = '20px' }: Props) => {
  return (
    <Box width={size} height={size} flex={false}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        width="100%"
        height="100%"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12s-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
        />
        <circle cx="12" cy="12" r="3.25" />
      </svg>
    </Box>
  );
};

export default EyeIcon;
