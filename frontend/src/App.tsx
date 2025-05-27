import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Home from './pages/Home.tsx';
import RecordingPage from './pages/RecordingPage.tsx';
import ReviewPage from './pages/ReviewPage.tsx';

const theme = createTheme({
  palette: {
    background: {
      default: "#f7f9fb",
      paper: "#fff"
    },
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#00bfae",
    },
    text: {
      primary: "#222",
      secondary: "#6b6b6b"
    }
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 16px 0 rgba(60,72,88,0.08)",
          borderRadius: 16,
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 12,
          fontWeight: 600,
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          marginBottom: 8,
          '&:before': { display: 'none' }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          background: "#f7f9fb",
          borderRadius: 8,
        }
      }
    }
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.5px",
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: "1.1rem",
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #e0e0e0" }}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, color: "#1976d2" }} onClick={() => window.location.href = '/'}>
                Asha Health AI Medical Scribe
              </Typography>
            </Toolbar>
          </AppBar>
          <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/record" element={<RecordingPage />} />
              <Route path="/review" element={<ReviewPage />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 