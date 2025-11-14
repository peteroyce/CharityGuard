import React from 'react';
import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

export const StatCardSkeleton: React.FC = () => (
  <Card sx={{
    background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(15, 23, 42, 0.95))',
    border: '1px solid rgba(20, 184, 166, 0.2)',
    borderRadius: 3
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)' }} />
          <Skeleton variant="text" width={80} height={40} sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)', mt: 1 }} />
          <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)', mt: 1 }} />
        </Box>
        <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)' }} />
      </Box>
    </CardContent>
  </Card>
);

export const TableSkeleton: React.FC = () => (
  <Box>
    {[1, 2, 3, 4, 5].map((i) => (
      <Box
        key={i}
        sx={{
          display: 'flex',
          gap: 2,
          py: 2,
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
        }}
      >
        <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)' }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)' }} />
          <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)', mt: 0.5 }} />
        </Box>
        <Skeleton variant="rectangular" width={80} height={30} sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)', borderRadius: 2 }} />
      </Box>
    ))}
  </Box>
);

export const DashboardSkeleton: React.FC = () => (
  <Box sx={{ p: 4 }}>
    <Skeleton variant="text" width={300} height={50} sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)', mb: 4 }} />
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map((i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <StatCardSkeleton />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export {};