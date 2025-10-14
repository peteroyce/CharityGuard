import React from 'react';
import { Box, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material';

const TrustScore: React.FC = () => {
  const factors = [
    { name: 'IRS Verification', score: 100, icon: '✅' },
    { name: 'Wallet Verified', score: 100, icon: '🔗' },
    { name: 'Transaction History', score: 95, icon: '📊' },
    { name: 'Smart Contract Security', score: 98, icon: '🛡️' },
    { name: 'Public Audit Trail', score: 100, icon: '👁️' }
  ];
  const overall = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);

  return (
    <Card sx={{ mt: 3, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#e5e7eb' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          🛡️ Blockchain Trust Score: {overall}/100
          <Chip label="MAX SECURITY" size="small" color="success" />
        </Typography>
        {factors.map((f) => (
          <Box key={f.name} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">{f.icon} {f.name}</Typography>
              <Chip label={`${f.score}%`} size="small" color="success" />
            </Box>
            <LinearProgress
              variant="determinate"
              value={f.score}
              color="success"
              sx={{ mt: .5, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)' }}
            />
          </Box>
        ))}
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(34,197,94,.10)', borderRadius: 2, border: '1px solid rgba(34,197,94,.25)' }}>
          <Typography variant="body2" sx={{ color: '#c7f9cc' }}>
            🔒 Every donation is permanently recorded and publicly auditable.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrustScore;