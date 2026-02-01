// src/hooks/useCreateTripDrawer.js
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";


// SAME KEY YOU USE IN Home.js FOR WEATHER
const WEATHERAPIKEY = "c5298240cb3e71775b479a32329803ab"; // keep in sync with Home

// simple reverse-geocode using OpenWeather (lat/lon -> "City, CC")
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHERAPIKEY}&units=metric`
    );
    const data = await res.json();
    if (data.cod !== 200) throw new Error("Location not found");
    const city = data.name;
    const country = data.sys?.country || "";
    return `${city}${country ? ", " + country : ""}`;
  } catch {
    return "My Location";
  }
}

export function useCreateTripDrawer() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [step, setStep] = useState(0); // 0 = details, 1 = members
  const [newTrip, setNewTrip] = useState({
    name: "",
    from: "",
    to: "",
    location: "",
    startDate: "",
    endDate: "",
    time: "",
    duration: "",
    iconDataUri: "",
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [randomNatureImage, setRandomNatureImage] = useState("");
  const [latestTripId, setLatestTripId] = useState(null);

  // start location mode: "auto" uses geolocation, "manual" lets user type
  const [startLocationMode, setStartLocationMode] = useState("auto");
  const [resolvedStartLocation, setResolvedStartLocation] = useState("");

  const user = auth.currentUser;
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);

  // Optional Unsplash image (same as Trips)
  useEffect(() => {
    if (!createDialogOpen || newTrip.iconDataUri) return;
    const UNSPLASHACCESSKEY = "MGCA3bsEUNBsSG6XbcqnJXckFB4dDyN5ZPKVBrD0FeQ";
    fetch(
      `https://api.unsplash.com/photos/random?query=nature&orientation=squarish&client_id=${UNSPLASHACCESSKEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.urls && data.urls.small) {
          setRandomNatureImage(data.urls.small);
        }
      })
      .catch(() => setRandomNatureImage(""));
  }, [createDialogOpen, newTrip.iconDataUri]);

  // Auto-resolve current location for "from" when drawer opens in auto mode
  useEffect(() => {
    if (!createDialogOpen) return;
    if (startLocationMode !== "auto") return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const pretty = await reverseGeocode(latitude, longitude);
        setResolvedStartLocation(pretty);
        setNewTrip((prev) => ({
          ...prev,
          from: prev.from || pretty,
        }));
      },
      () => {
        setResolvedStartLocation("My Location");
        setNewTrip((prev) => ({
          ...prev,
          from: prev.from || "My Location",
        }));
      },
      { timeout: 10000 }
    );
  }, [createDialogOpen, startLocationMode]);

  // Ensure creator as member when on step 1
  useEffect(() => {
    if (!createDialogOpen || step !== 1 || !user) return;
    if (!selectedMembers.some((m) => m.uid === user.uid)) {
      setSelectedMembers((prev) => [
        ...prev,
        {
          uid: user.uid,
          name: user.displayName || "You",
          username: user.email?.split("@")[0] || "you",
          email: user.email,
          photoURL: user.photoURL,
          contribution: "",
        },
      ]);
    }
  }, [createDialogOpen, step, user, selectedMembers]);

  const handleNext = () => {
    const { name, from, to, location, startDate, endDate } = newTrip;
    if (!name || !from || !to || !location || !startDate || !endDate) {
      alert("Please fill all trip details.");
      return;
    }
    setStep(1);
  };

  const handleBack = () => setStep((p) => p - 1);

  const handleContributionChange = (idx, value) => {
    setSelectedMembers((prev) => {
      const updated = [...prev];
      updated[idx].contribution = value;
      return updated;
    });
  };

  const totalContribution = selectedMembers.reduce(
    (sum, m) => sum + (parseInt(m.contribution || "0", 10) || 0),
    0
  );

  // target for Plan Trip prefill
  const openDrawerWithPrefill = (prefill) => {
    setNewTrip((prev) => ({
      ...prev,
      ...prefill,
    }));
    setStep(0);
    setCreateDialogOpen(true);
  };

  const closeDrawer = () => {
    setCreateDialogOpen(false);
    setStep(0);
    setSelectedMembers([]);
  };

const handleCreateTrip = async () => {
  const {
    name,
    from,
    to,
    location,
    startDate,
    endDate,
    time,
    duration,
    iconDataUri,
  } = newTrip;

  if (selectedMembers.length === 0) {
    alert("Please add at least one member.");
    return;
  }

  const iconURL = iconDataUri || randomNatureImage || "";
  const members = selectedMembers.map((m) => m.uid);
  const contributors = selectedMembers.map((m) => ({
    uid: m.uid,
    name: m.name || m.username,
    amount: parseInt(m.contribution || "0", 10) || 0,
  }));
  const total = contributors.reduce((sum, c) => sum + (c.amount || 0), 0);

  try {
    // 1) Trip document
    const tripDoc = await addDoc(collection(db, "trips"), {
      name,
      from,
      to,
      location,
      startDate,
      endDate,
      time: time || null,
      duration: duration || null,
      members,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    });
    setLatestTripId(tripDoc.id);

    // 2) Group chat document for this trip
    await setDoc(doc(db, "groupChats", tripDoc.id), {
      tripId: tripDoc.id,
      name: `${from} - ${to} - ${location} Trip`,
      members,
      description: `Group for ${from} to ${to}`,
      inviteAccess: "all",
      emoji: "",
      iconURL,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    });

    // 3) Budget document scoped to this trip
    await setDoc(doc(db, "budgets", tripDoc.id), {
      tripId: tripDoc.id,
      tripName: name,
      total,
      used: 0,
      contributors,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    });

    // 4) Update each contributor's personal budgets
    await Promise.all(
      contributors.map(async (c) => {
        const userRef = doc(db, "budgets", c.uid);
        const userBudgetSnap = await getDoc(userRef);
        const newItem = {
          amount: total,
          category: "Tour",
          name,
          tripId: tripDoc.id,
          contributors,
          createdAt: new Date(),
          expenses: [],
        };
        if (!userBudgetSnap.exists()) {
          await setDoc(userRef, { items: [newItem] });
        } else {
          await updateDoc(userRef, {
            items: arrayUnion(newItem),
          });
        }
      })
    );

    // Reset form + close drawer
    closeDrawer();
    setNewTrip({
      name: "",
      from: "",
      to: "",
      location: "",
      startDate: "",
      endDate: "",
      time: "",
      duration: "",
      iconDataUri: "",
    });
  } catch (e) {
    alert("Error occurred while creating trip: " + e.message);
  }
};


  return {
    theme,
    mode,
    createDialogOpen,
    step,
    newTrip,
    setNewTrip,
    selectedMembers,
    setSelectedMembers,
    randomNatureImage,
    startLocationMode,
    setStartLocationMode,
    resolvedStartLocation,
    openDrawerWithPrefill,
    closeDrawer,
    handleNext,
    handleBack,
    handleContributionChange,
    totalContribution,
    handleCreateTrip,
  };
}
