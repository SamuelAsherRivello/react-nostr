import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface ContentAreaProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ContentArea: React.FC<ContentAreaProps> = ({ title, children, className }) => {
  return (
    <Box mb={2} borderRadius={4} boxShadow={3} overflow="hidden" className={className}>
      <Box p={2} bgcolor="primary.main" color="primary.contrastText">
        <Typography component="div">{title}</Typography>
      </Box>
      <Box p={2} bgcolor="background.paper">
        {children}
      </Box>
    </Box>
  );
};

export default ContentArea;
