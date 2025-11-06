import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, TextField, Button } from "@mui/material";
import { useAdminAuth } from "../hooks/useAdminAuth";

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate("/admin");
    } else {
      setError("Invalid admin password.");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Card sx={{ minWidth: 400, p: 3, background: "rgba(15,23,42,0.85)" }}>
        <CardContent>
          <Typography variant="h4" mb={2}>Admin Login</Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Admin Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            {error && <Typography color="error" fontSize={14}>{error}</Typography>}
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminLogin;