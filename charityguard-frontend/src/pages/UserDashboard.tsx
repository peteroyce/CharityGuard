import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import axios from 'axios';
import { useBlockchain } from '../hooks/useBlockchain';
import LiquidBackground from '../components/LiquidBackground';

interface User {
  walletAddress: string;
  email: string;
  username: string;
  totalDonated: number;
  donationCount: number;
  favoriteNonprofits: string[];
  createdAt: string;
}

interface Donation {
  _id: string;
  transactionHash: string;
  nonprofitName: string;
  amount: number;
  amountUSD: number;
  timestamp: string;
  status: string;
  fraudScore: number;
}

const UserDashboard: React.FC = () => {
  const { account, isConnected, connectWallet } = useBlockchain();
  const [user, setUser] = useState<User | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && account) {
      fetchUserData();
      fetchDonations();
    }
  }, [isConnected, account]);

  const fetchUserData = async () => {
    try {
      const res = await axios.get(`/api/users/${account}`);
      setUser(res.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await axios.get(`/api/users/${account}/donations`);
      setDonations(res.data.donations || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="80vh">
        <LiquidBackground />
        <Typography variant="h4" mb={3} color="primary">Connect Your Wallet</Typography>
        <Button variant="contained" onClick={connectWallet} sx={{ background: 'linear-gradient(90deg, #14b8a6, #667eea)' }}>
          Connect MetaMask
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress sx={{ color: '#14b8a6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', py: 6, px: { xs: 2, md: 6 } }}>
      <LiquidBackground />
      
      <Typography
        variant="h3"
        sx={{
          background: 'linear-gradient(90deg, #14b8a6, #667eea)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
          mb: 4,
          textAlign: 'center'
        }}
      >
        My Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'rgba(20, 184, 166, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
            <CardContent>
              <Typography variant="h6" color="#14b8a6">Total Donated</Typography>
              <Typography variant="h4" fontWeight={700}>{user?.totalDonated.toFixed(4) || 0} ETH</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'rgba(102, 126, 234, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(102, 126, 234, 0.3)' }}>
            <CardContent>
              <Typography variant="h6" color="#667eea">Donations Made</Typography>
              <Typography variant="h4" fontWeight={700}>{user?.donationCount || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'rgba(16, 185, 129, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CardContent>
              <Typography variant="h6" color="#10b981">Favorite Nonprofits</Typography>
              <Typography variant="h4" fontWeight={700}>{user?.favoriteNonprofits.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Donation History */}
      <Card sx={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
        <CardContent>
          <Typography variant="h5" mb={3} color="primary">Donation History</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Nonprofit</TableCell>
                <TableCell>Amount (ETH)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Transaction</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {donations.map((donation) => (
                <TableRow key={donation._id}>
                  <TableCell>{new Date(donation.timestamp).toLocaleDateString()}</TableCell>
                  <TableCell>{donation.nonprofitName}</TableCell>
                  <TableCell>{donation.amount.toFixed(4)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={donation.status} 
                      color={donation.status === 'confirmed' ? 'success' : donation.status === 'flagged' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <a href={`https://etherscan.io/tx/${donation.transactionHash}`} target="_blank" rel="noopener" style={{ color: '#14b8a6' }}>
                      View
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserDashboard;