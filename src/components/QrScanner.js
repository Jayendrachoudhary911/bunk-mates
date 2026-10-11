import React, { useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { Box } from '@mui/material';

const QrScanner = ({ onScanSuccess, onScanError }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const requestRef = useRef();

  // This is our scanning loop
  const scan = useCallback(() => {
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        // If a code is found, call the success handler and stop the loop
        onScanSuccess(code.data);
        return; // Exit the loop
      }
    }
    // Continue scanning on the next frame
    requestRef.current = requestAnimationFrame(scan);
  }, [onScanSuccess]);


  // This effect starts and stops the scanning loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(scan);
    
    // Cleanup: stop the loop when the component unmounts
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [scan]);

  return (
    <Box sx={{ width: '100%', maxWidth: '400px', mx: 'auto', borderRadius: 2, overflow: 'hidden' }}>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        style={{ width: '100%', height: '100%' }}
        videoConstraints={{ facingMode: 'environment' }}
      />
    </Box>
  );
};

export default QrScanner;