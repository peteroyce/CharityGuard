import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, TextField, Button } from "@mui/material";
import { useAdminAuth } from "../hooks/useAdminAuth";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const success = await login(email, password);
    setSubmitting(false);
    if (success) {
      navigate("/admin");
    } else {
      setError("Invalid credentials or insufficient permissions.");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Card sx={{ minWidth: 400, p: 3, background: "rgba(15,23,42,0.85)" }}>
        <CardContent>
          <Typography variant="h4" mb={2}>Admin Login</Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            {error && <Typography color="error" fontSize={14}>{error}</Typography>}
            <Button type="submit" variant="contained" color="primary" fullWidth disabled={submitting}>
              {submitting ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminLogin;
