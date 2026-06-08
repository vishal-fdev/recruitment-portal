import { Card, CardBody, Heading, Paragraph } from 'grommet';

const ContactMatrixTab = () => {
  return (
    <Card background="white" round="16px" border={{ color: 'border-weak' }} elevation="xsmall">
      <CardBody pad="large" gap="medium">
        <Heading level={3} size="small" margin="none">
          Contact Matrix
        </Heading>
        <Paragraph margin="none" color="text-paragraph">
          Contact Matrix UI will go here.
        </Paragraph>
      </CardBody>
    </Card>
  );
};

export default ContactMatrixTab;
