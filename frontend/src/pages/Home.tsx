import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import { config } from '../config.ts';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('Please select an audio file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await axios.post(`${config.apiUrl}${config.endpoints.transcribe}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        localStorage.setItem('transcription', response.data.transcription);
        navigate('/review');
      } else {
        throw new Error(response.data.message || 'Transcription failed');
      }
    } catch (err) {
      setError('Failed to process audio. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        Welcome to Asha Health AI Medical Scribe
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 5 }}>
        Effortlessly generate clinical notes from your medical conversations.
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center">
        <Paper elevation={0} sx={{ p: 4, minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <MicIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" fontWeight={600} align="center">
            Record a New Consultation
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Use your microphone to record a live patient-provider conversation.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<MicIcon />}
            onClick={() => navigate('/record')}
            sx={{ mt: 2, width: '100%' }}
          >
            Start Recording
          </Button>
        </Paper>
        <Paper elevation={0} sx={{ p: 4, minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" fontWeight={600} align="center">
            Upload an Audio File
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Already have a recording? Upload it to generate a SOAP note.
          </Typography>
          <Button
            variant="outlined"
            component="label"
            color="primary"
            size="large"
            startIcon={<CloudUploadIcon />}
            sx={{ mt: 2, width: '100%' }}
            disabled={isUploading}
          >
            Select Audio File
            <input type="file" hidden accept="audio/*" onChange={handleFileUpload} />
          </Button>
          {selectedFile && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Selected: {selectedFile.name}
            </Typography>
          )}
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            sx={{ width: '100%' }}
          >
            {isUploading ? <CircularProgress size={22} sx={{ color: 'white', mr: 1 }} /> : null}
            Upload & Process
          </Button>
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>
          )}
        </Paper>
      </Stack>
    </Box>
  );
};

export default Home; 