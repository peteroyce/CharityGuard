import React, { useState } from 'react';
import { Box, Button, Container, Typography, Alert, Paper } from '@mui/material';
import { useBlockchain } from '../hooks/useBlockchain';

export const TestFraud: React.FC = () => {
  const { account } = useBlockchain();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFraudulent = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash: `0xfraud${Date.now()}`,
          nonprofitName: "Red Cross Relief Foundation",
          nonprofitEIN: "99-9999999",
          donorAddress: account || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          recipientAddress: "0xScamWallet123",
          amount: 12.5,
          blockNumber: 18456789
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to connect to backend' });
    } finally {
      setLoading(false);
    }
  };

  const testLegitimate = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash: `0xlegit${Date.now()}`,
          nonprofitName: "UNICEF USA",
          nonprofitEIN: "13-1760110",
          donorAddress: account || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          recipientAddress: "0xUNICEFWallet",
          amount: 0.05,
          blockNumber: 18456790
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to connect' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" sx={{ mb: 4, textAlign: 'center', color: '#fff' }}>
        🔥 Fraud Detection Test
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="error"
          size="large"
          onClick={testFraudulent}
          disabled={loading}
          sx={{ px: 4, py: 2 }}
        >
          🚨 Test Fraudulent Transaction
        </Button>

        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={testLegitimate}
          disabled={loading}
          sx={{ px: 4, py: 2 }}
        >
          ✅ Test Legitimate Transaction
        </Button>
      </Box>

      {result && (
        <Paper sx={{ p: 3, bgcolor: result.warning ? '#fee2e2' : '#d1fae5', color: '#000' }}>
          {result.warning && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6">{result.warning}</Typography>
              <Typography variant="body1">Fraud Score: {result.fraudScore}</Typography>
            </Alert>
          )}
          
          {result.message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="h6">{result.message}</Typography>
              <Typography variant="body1">Fraud Score: {result.fraudScore}</Typography>
            </Alert>
          )}

          {result.riskFlags && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Risk Flags:</Typography>
              <ul>
                {result.riskFlags.map((flag: string, idx: number) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </Box>
          )}

          {result.aiAnalysis && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>AI Analysis:</Typography>
              <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
                {JSON.stringify(result.aiAnalysis, null, 2)}
              </pre>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default TestFraud;
