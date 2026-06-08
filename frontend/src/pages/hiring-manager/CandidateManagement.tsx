import { Box, Card, CardBody, Heading, Paragraph } from 'grommet';

const HMCandidateManagement = () => {
  return (
    <Box gap="medium">
      <Heading level={2} margin="none">
        Candidate Management
      </Heading>

      <Card background="white" round="16px" border={{ color: 'border-weak' }} elevation="xsmall">
        <CardBody pad="medium">
          <Paragraph margin="none" color="text-paragraph">
            Review, shortlist, reject candidates.
          </Paragraph>
        </CardBody>
      </Card>
    </Box>
  );
};

export default HMCandidateManagement;
