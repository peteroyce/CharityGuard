import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material';

type Tx = { hash: string; amount: string; charity: string; time: string; verified: boolean; };

const TransactionFeed: React.FC = () => {
  const [transactions, setTransactions] = useState<Tx[]>([
    { hash: '0x1a2b3c4d5e6f...', amount: '0.10', charity: 'American Red Cross', time: '2 mins ago', verified: true },
    { hash: '0x4d5e6f7g8h9i...', amount: '0.05', charity: 'UNICEF USA', time: '5 mins ago', verified: true },
    { hash: '0x7g8h9i0j1k2l...', amount: '0.25', charity: 'Doctors Without Borders', time: '8 mins ago', verified: true },
    { hash: '0x0j1k2l3m4n5o...', amount: '0.15', charity: 'World Wildlife Fund', time: '12 mins ago', verified: true }
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      const charities = ['Save the Children', 'Habitat for Humanity', 'Feeding America', 'Oxfam', 'American Cancer Society'];
      setTransactions(prev => [{
        hash: `0x${Math.random().toString(16).slice(2, 10)}...`,
        amount: (Math.random() * 0.5 + 0.01).toFixed(3),
        charity: charities[Math.floor(Math.random() * charities.length)],
        time: 'Just now',
        verified: true
      }, ...prev.slice(0, 8)]);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card sx={{ mt: 4, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#e5e7eb' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          🔗 Live Blockchain Donations
          <Chip label="LIVE" size="small" color="success" />
        </Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {transactions.map((tx, i) => (
            <Box key={`${tx.hash}-${i}`} sx={{ mb: 1.5, p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.10)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: .5 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>💰 {tx.amount} ETH → {tx.charity}</Typography>
                {tx.verified && <Chip label="✅ Verified" size="small" color="success" />}
              </Box>
              <Typography variant="caption" sx={{ color: '#a3a6ad' }}>Transaction: {tx.hash} • {tx.time}</Typography>
              <LinearProgress variant="determinate" value={100} sx={{ mt: 1, height: 3, borderRadius: 2 }} color="success" />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TransactionFeed;