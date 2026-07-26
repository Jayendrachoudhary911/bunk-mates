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
    if (step === 0) {
      if (!newTrip.name?.trim()) {
        alert("Please enter a trip name.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!newTrip.from?.trim() || !newTrip.to?.trim()) {
        alert("Please specify both origin and destination.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!newTrip.startDate || !newTrip.endDate) {
        alert("Please select start and end dates.");
        return;
      }
      setStep(3);
    } else {
      setStep((p) => Math.min(p + 1, 3));
    }
  };

  const handleBack = () => setStep((p) => Math.max(p - 1, 0));

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

  const [isPostCreateAiModalOpen, setIsPostCreateAiModalOpen] = useState(false);
  const [createdTripDetails, setCreatedTripDetails] = useState(null);
  const [isGeneratingPostAi, setIsGeneratingPostAi] = useState(false);

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
      budget,
      description,
      aiSummary,
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

    // Save selected destination ('to') directly into the location field
    const finalLocation = to || location || (from && to ? `${from} → ${to}` : "Destination");

    // Auto-generate AI description for all trips if missing
    let finalDescription = description || aiSummary || "";
    if (!finalDescription) {
      try {
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        const userGroqKey = userDocSnap.exists() ? userDocSnap.data()?.groqApiKey : "";
        if (userGroqKey && from && to) {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userGroqKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "user",
                  content: `Generate a concise, enticing 2-sentence travel description for a trip titled "${name}" from "${from}" to "${to}" scheduled from ${startDate || 'tbd'} to ${endDate || 'tbd'}. Output plain text only.`,
                },
              ],
              temperature: 0.3,
            }),
          });
          const data = await res.json();
          finalDescription = data?.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch (err) {
        console.warn("Auto AI description fallback used:", err);
      }
      if (!finalDescription) {
        finalDescription = `Auto-generated travel plan for ${name} from ${from || "origin"} to ${to || "destination"}. Dates: ${startDate || "TBD"} to ${endDate || "TBD"}. Total budget: ₹${total || budget || 0}.`;
      }
    }

    try {
      // 1) Trip document with location and auto-generated description
      const tripDoc = await addDoc(collection(db, "trips"), {
        name,
        from: from || "",
        to: to || "",
        location: finalLocation,
        description: finalDescription,
        startDate: startDate || "",
        endDate: endDate || "",
        budget: budget || total.toString(),
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
        name: `${from || name} - ${to || finalLocation} Trip`,
        members,
        description: finalDescription,
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

      // Save created trip details and open post-creation AI popup
      setCreatedTripDetails({
        id: tripDoc.id,
        name,
        from,
        to,
        startDate,
        endDate,
        description: finalDescription,
      });
      setIsPostCreateAiModalOpen(true);

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

  const handleGeneratePostAiTimelineAndChecklist = async () => {
    if (!createdTripDetails?.id) return;
    setIsGeneratingPostAi(true);
    try {
      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      const userGroqKey = userDocSnap.exists() ? userDocSnap.data()?.groqApiKey : "";
      if (!userGroqKey) {
        alert("Please configure your Groq API Key in Profile -> AI Features to generate AI timelines & checklists.");
        setIsGeneratingPostAi(false);
        return;
      }

      const prompt = `You are an expert travel planner. Generate a detailed day-by-day timeline and a packing/task checklist for a trip from "${createdTripDetails.from}" to "${createdTripDetails.to}" titled "${createdTripDetails.name}" from ${createdTripDetails.startDate} to ${createdTripDetails.endDate}.
Return strictly a raw JSON object:
{
  "timeline": [
    {"day": 1, "title": "Day 1: Arrival & Exploration", "activities": ["Check in at hotel", "Explore downtown", "Dinner at local restaurant"]}
  ],
  "checklist": [
    {"category": "Documents", "item": "Passport & Tickets", "packed": false},
    {"category": "Clothing", "item": "Weather-appropriate outfits", "packed": false},
    {"category": "Electronics", "item": "Chargers & Power Bank", "packed": false}
  ]
}
Do not output markdown code blocks. Raw JSON only.`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userGroqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      await updateDoc(doc(db, "trips", createdTripDetails.id), {
        timeline: parsed.timeline || [],
        checklist: parsed.checklist || [],
        aiGeneratedAt: new Date().toISOString(),
      });

      alert("✨ Success! Groq AI Checklist & Timeline generated and saved to your trip!");
      setIsPostCreateAiModalOpen(false);
    } catch (err) {
      console.error("Post-creation AI generation failed:", err);
      alert("Failed to generate AI checklist & timeline. Please check your Groq API key in Profile.");
    } finally {
      setIsGeneratingPostAi(false);
    }
  };


  return {
    theme,
    mode,
    createDialogOpen,
    step,
    setStep,
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
    isPostCreateAiModalOpen,
    setIsPostCreateAiModalOpen,
    createdTripDetails,
    isGeneratingPostAi,
    handleGeneratePostAiTimelineAndChecklist,
  };
}
