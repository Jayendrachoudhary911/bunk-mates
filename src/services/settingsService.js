import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase";

export const LOCAL_SETTINGS_KEY = "bunkmate_user_preferences_v1";

export const DEFAULT_PREFERENCES = {
  appearance: {
    theme: "dark", // "dark" | "light" | "system"
    accentColor: "oceanBlue", // "oceanBlue" | "coral" | "green" | "orange" | "cyan" | "violet" | "white"
    fontSize: "medium", // "small" | "medium" | "large"
    reduceAnimations: false,
  },
  accessibility: {
    screenReaderOptimized: false,
    highContrast: false,
    largeTouchTargets: false,
    colorBlindMode: "off", // "off" | "protanopia" | "deuteranopia" | "tritanopia"
    boldText: false,
    reduceTransparency: false,
    reduceMotion: false,
    hapticFeedback: true,
    audioCues: false,
  },
  privacy: {
    profileVisibility: "public", // "public" | "private"
    shareLiveLocation: false,
    activityStatus: true,
    hidePastTrips: false,
    analyticsCollection: true,
  },
  locale: {
    language: "en-IN",
    region: "IN",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    firstDayOfWeek: "monday",
  },
  chats: {
    wallpaper: "none",
    enterIsSend: false,
    linkPreviews: true,
    readReceipts: true,
    typingIndicator: true,
    disappearingMessages: "off", // "off" | "24h" | "7d" | "90d"
    mediaAutoDownload: true,
    saveToGallery: false,
    keepChatsArchived: true,
  },
  ai: {
    smartRecommendations: true,
    aiAssistantEnabled: true,
    groqApiKey: "",
    preferredModel: "llama-3.3-70b-versatile",
  },
  maps: {
    preferredMapApp: "google", // "google" | "apple" | "waze"
    distanceUnits: "km", // "km" | "miles"
    autoReroute: true,
    avoidTolls: false,
    mapStyle: "standard", // "standard" | "satellite" | "terrain"
    showPointsOfInterest: true,
  },
  offline: {
    autoCacheTrips: true,
    maxCacheSizeMb: 500,
    downloadedMapsCount: 0,
  },
  weather: {
    temperatureUnit: "celsius", // "celsius" | "fahrenheit"
    forecastHorizon: 5, // 3 | 5 | 7
    severeWeatherAlerts: true,
    precipitationAlerts: true,
    pollutionWarnings: false,
    refreshInterval: "1h", // "30m" | "1h" | "3h"
  },
  tripPreferences: {
    mode: "auto", // "auto" | "manual"
    defaultTripStyle: "public", // "public" | "private"
    smartRecommendations: true,
    travelStyle: "midRange", // "budget" | "midRange" | "luxury"
    typicalDuration: "3-5 days",
    idealGroupSize: "4-6 people",
    accommodations: ["hotel", "airbnb"],
    diet: "noRestrictions",
    activities: ["sightseeing", "food", "nature", "nightlife"],
  },
  currency: {
    baseCurrency: "INR", // "INR" | "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD"
    showCurrencySymbol: true,
    autoRoundOff: true,
    defaultSplitMethod: "equal", // "equal" | "exact" | "percentage"
    autoCategorizeGroupSpends: true,
    savingsGoalEnabled: false,
    savingsGoalAmount: 15000,
  },
  notifications: {
    pushEnabled: true,
    tripUpdates: true,
    messagesChat: true,
    reminders: true,
    recommendations: true,
    promotions: false,
    quietHoursEnabled: false,
    quietHoursFrom: "22:00",
    quietHoursUntil: "07:00",
  },
};

/**
 * Load preferences with fallback to localStorage and defaults
 */
export async function loadUserPreferences(uid) {
  let localData = null;
  try {
    const raw = localStorage.getItem(`${LOCAL_SETTINGS_KEY}_${uid}`);
    if (raw) localData = JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to read local preferences:", err);
  }

  if (!uid) {
    return localData || DEFAULT_PREFERENCES;
  }

  try {
    const prefRef = doc(firestore, "users", uid, "settings", "preferences");
    const snap = await getDoc(prefRef);
    let remoteData = snap.exists() ? snap.data() : {};

    // Also check root user doc for accessibilityPreferences & appearancePreferences (matching DB schema)
    try {
      const userSnap = await getDoc(doc(firestore, "users", uid));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData.accessibilityPreferences) {
          const ap = uData.accessibilityPreferences;
          remoteData.accessibility = {
            ...(remoteData.accessibility || {}),
            audioCues: Boolean(ap.audioCues),
            boldText: Boolean(ap.boldText),
            colorBlindMode: (ap.colorBlindMode || "off").toLowerCase(),
            hapticFeedback: Boolean(ap.hapticFeedback),
            highContrast: Boolean(ap.highContrastMode),
            largeTouchTargets: Boolean(ap.largeTouchTargets),
            reduceMotion: Boolean(ap.reduceMotion),
            reduceTransparency: Boolean(ap.reduceTransparency),
            screenReaderOptimized: Boolean(ap.screenReaderCompat),
          };
        } else {
          // Initialize schema directly on root user doc if not present
          setDoc(doc(firestore, "users", uid), {
            accessibilityPreferences: {
              audioCues: true,
              boldText: false,
              colorBlindMode: "Off",
              hapticFeedback: true,
              highContrastMode: false,
              largeTouchTargets: false,
              reduceMotion: false,
              reduceTransparency: false,
              screenReaderCompat: false,
            },
            appearancePreferences: {
              accent: "white",
            },
          }, { merge: true }).catch(() => {});
        }
        if (uData.appearancePreferences?.accent) {
          remoteData.appearance = {
            ...(remoteData.appearance || {}),
            accentColor: uData.appearancePreferences.accent,
          };
        }
      }
    } catch (e) {}

    // Deep merge with defaults to ensure any new keys are populated
    const merged = deepMerge(DEFAULT_PREFERENCES, remoteData);
    try {
      localStorage.setItem(`${LOCAL_SETTINGS_KEY}_${uid}`, JSON.stringify(merged));
    } catch (e) {}
    return merged;
  } catch (error) {
    console.warn("Firestore preferences read failed, falling back to local:", error);
  }

  return localData ? deepMerge(DEFAULT_PREFERENCES, localData) : DEFAULT_PREFERENCES;
}

/**
 * Persist preferences to Firestore and localStorage
 */
export async function saveUserPreferences(uid, updatedPreferences) {
  if (!uid) {
    try {
      localStorage.setItem(`${LOCAL_SETTINGS_KEY}_guest`, JSON.stringify(updatedPreferences));
    } catch (e) {}
    return updatedPreferences;
  }

  try {
    localStorage.setItem(`${LOCAL_SETTINGS_KEY}_${uid}`, JSON.stringify(updatedPreferences));
  } catch (e) {}

  try {
    const prefRef = doc(firestore, "users", uid, "settings", "preferences");
    await setDoc(prefRef, {
      ...updatedPreferences,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Also persist accessibilityPreferences & appearancePreferences directly to users/{uid} matching DB schema
    const userDocRef = doc(firestore, "users", uid);
    const accessibility = updatedPreferences.accessibility || {};
    const appearance = updatedPreferences.appearance || {};

    const colorBlindModeRaw = accessibility.colorBlindMode || "off";
    const colorBlindModeCapitalized =
      colorBlindModeRaw === "off" ? "Off" :
      colorBlindModeRaw === "protanopia" ? "Protanopia" :
      colorBlindModeRaw === "deuteranopia" ? "Deuteranopia" :
      colorBlindModeRaw === "tritanopia" ? "Tritanopia" :
      colorBlindModeRaw;

    const accentVal = appearance.accentColor || appearance.accent || "white";

    await setDoc(userDocRef, {
      accessibilityPreferences: {
        audioCues: Boolean(accessibility.audioCues),
        boldText: Boolean(accessibility.boldText),
        colorBlindMode: colorBlindModeCapitalized,
        hapticFeedback: Boolean(accessibility.hapticFeedback),
        highContrastMode: Boolean(accessibility.highContrast || accessibility.highContrastMode),
        largeTouchTargets: Boolean(accessibility.largeTouchTargets),
        reduceMotion: Boolean(accessibility.reduceMotion),
        reduceTransparency: Boolean(accessibility.reduceTransparency),
        screenReaderCompat: Boolean(accessibility.screenReaderCompat || accessibility.screenReaderOptimized),
      },
      appearancePreferences: {
        accent: accentVal,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Failed to persist preferences to Firestore:", error);
    throw error;
  }

  return updatedPreferences;
}

/**
 * Export authorized user data as JSON
 */
export async function exportUserData(uid, userProfile = {}) {
  if (!uid) throw new Error("Authentication required for export.");

  const exportPayload = {
    exportDate: new Date().toISOString(),
    userId: uid,
    profile: {
      name: userProfile.name || "",
      username: userProfile.username || "",
      email: userProfile.email || "",
      type: userProfile.type || "Standard",
      createdAt: userProfile.createdAt || null,
    },
    preferences: {},
    trips: [],
    notes: [],
  };

  try {
    const prefRef = doc(firestore, "users", uid, "settings", "preferences");
    const pSnap = await getDoc(prefRef);
    if (pSnap.exists()) {
      exportPayload.preferences = pSnap.data();
    }
  } catch (e) {}

  try {
    const tripsQuery = query(
      collection(firestore, "trips"),
      where("members", "array-contains", uid)
    );
    const tripsSnap = await getDocs(tripsQuery);
    exportPayload.trips = tripsSnap.docs.map(d => ({
      id: d.id,
      name: d.data().name || d.data().destination || "Trip",
      destination: d.data().destination || "",
      startDate: d.data().startDate || null,
      endDate: d.data().endDate || null,
    }));
  } catch (e) {}

  return exportPayload;
}

function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}
