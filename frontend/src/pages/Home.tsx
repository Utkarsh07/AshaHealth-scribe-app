import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
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
      // Check if the file is an audio file
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Store transcription in localStorage for the review page
        localStorage.setItem('transcription', response.data.transcription);
        navigate('/review');
      } else {
        throw new Error(response.data.message || 'Transcription failed');
      }
    } catch (err) {
      setError(`Failed to process audio. Please try again. ${err}`);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Asha Health AI Medical Scribe
      </Typography>

      <Paper sx={{ p: 4, mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={isUploading}
          >
            Select Audio File
            <input
              type="file"
              hidden
              accept="audio/*"
              onChange={handleFileUpload}
            />
          </Button>

          {selectedFile && (
            <Typography variant="body1">
              Selected file: {selectedFile.name}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : (
                'Upload and Process'
              )}
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('/record')}
              disabled={isUploading}
            >
              Record New
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home; 