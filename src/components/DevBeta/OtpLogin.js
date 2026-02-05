import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container
} from "@mui/material";

import {
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";

import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

import { auth, db } from "../../firebase";

const OtpLogin = () => {

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);

  // ---------------------------
  // CHECK USER EXISTS
  // ---------------------------

  const checkUserExists = async (number) => {

    const q = query(
      collection(db, "users"),
      where("mobile", "==", number) // SAME AS YOUR DB
    );

    const snapshot = await getDocs(q);

    return !snapshot.empty;
  };

  // ---------------------------
  // CAPTCHA INIT
  // ---------------------------

const setupRecaptcha = () => {

  if (!window.recaptchaVerifier) {

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => {
          console.log("Recaptcha Verified");
        },
      }
    );
  }
};


  // ---------------------------
  // SEND OTP
  // ---------------------------

const sendOtp = async () => {

  if (mobile.length !== 10) {
    alert("Enter valid mobile number");
    return;
  }

  setLoading(true);

  try {

    const exists = await checkUserExists(mobile);

    if (!exists) {
      alert("Mobile number not registered");
      setLoading(false);
      return;
    }

    const formattedPhone = `+91${mobile}`;

    setupRecaptcha();

    const appVerifier = window.recaptchaVerifier;

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      appVerifier
    );

    setConfirmation(confirmationResult);

    alert("OTP Sent");

  } catch (error) {

    console.error("OTP Error:", error);
    alert(error.message);

  } finally {
    setLoading(false);
  }
};


  // ---------------------------
  // VERIFY OTP
  // ---------------------------

  const verifyOtp = async () => {

    if (otp.length !== 6) {
      alert("Invalid OTP");
      return;
    }

    try {

      const result = await confirmation.confirm(otp);

      console.log("Logged in user:", result.user);

      alert("Login Successful");

    } catch (error) {

      console.error(error);
      alert("Wrong OTP");

    }
  };

  useEffect(() => {

  return () => {

    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

  };

}, []);


  return (

    <Container maxWidth="xs">

      <Box
        sx={{
          mt: 10,
          p: 3,
          borderRadius: 3,
          boxShadow: 3,
          textAlign: "center"
        }}
      >

        <Typography variant="h5" mb={2}>
          OTP Login
        </Typography>

        {!confirmation && (

          <>
            <TextField
              fullWidth
              label="Mobile Number"
              placeholder="7689919139"
              inputProps={{ maxLength: 10 }}
              onChange={(e) => setMobile(e.target.value)}
            />

            <Button
              fullWidth
              sx={{ mt: 2 }}
              variant="contained"
              disabled={loading}
              onClick={sendOtp}
            >
              Send OTP
            </Button>
          </>
        )}

        {confirmation && (

          <>
            <TextField
              fullWidth
              label="Enter OTP"
              onChange={(e) => setOtp(e.target.value)}
            />

            <Button
              fullWidth
              sx={{ mt: 2 }}
              variant="contained"
              onClick={verifyOtp}
            >
              Verify OTP
            </Button>
          </>
        )}

      </Box>

      <div id="recaptcha-container"></div>

    </Container>
  );
};

export default OtpLogin;
