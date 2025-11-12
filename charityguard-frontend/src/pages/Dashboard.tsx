import React from 'react';
import { Box, Typography, Container } from '@mui/material';

export const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h2" sx={{ textAlign: 'center', mb: 4 }}>
        📊 Your Donation Dashboard
      </Typography>
      <Typography variant="h5" sx={{ textAlign: 'center', color: 'text.secondary' }}>
        Coming soon - Track your donations and impact
      </Typography>
    </Container>
  );
};