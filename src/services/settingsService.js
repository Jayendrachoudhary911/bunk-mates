import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const LOCAL_STORAGE_SETTINGS_KEY = "bunkmate_user_preferences";

export const DEFAULT_PREFERENCES = {
  appearance: {
    theme: "dark", // 'dark' | 'light' | 'system'
    accentColor: "blue", // 'blue' | 'coral' | 'orange' | 'green' | 'purple' | 'turquoise' | 'white'
    fontSize: "medium", // 'small' | 'medium' | 'large'
    reduceAnimations: false,
  },
  accessibility: {
    screenReaderOptimized: true,
    highContrast: false,
    largeTouchTargets: false,
    boldText: false,
    reduceTransparency: false,
    colorBlindMode: "off", // 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia'
    reduceMotion: false,
    hapticFeedback: true,
    audioCues: true,
  },
  privacy: {
    profileVisibility: "public", // 'public' | 'private'
    shareLiveLocation: false,
    activityStatus: true,
    hidePastTrips: false,
    analyticsCollection: true,
  },
  locale: {
    language: "en-IN",
    region: "IN",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h", // '12h' | '24h'
    firstDayOfWeek: "monday", // 'sunday' | 'monday'
  },
  chat: {
    wallpaper: "none",
    enterIsSend: true,
    linkPreviews: true,
    readReceipts: true,
    typingIndicator: true,
    disappearingMessages: "off", // 'off' | '24h' | '7d' | '90d'
    autoDownloadMedia: true,
    saveToGallery: false,
  },
  maps: {
    preferredApp: "google", // 'google' | 'apple' | 'waze'
    distanceUnits: "km", // 'km' | 'mi'
    autoReroute: true,
    avoidTolls: false,
    mapStyle: "standard", // 'standard' | 'satellite' | 'terrain'
    showPointsOfInterest: true,
  },
  offline: {
    autoSyncTrips: true,
    wifiOnly: true,
  },
  weather: {
    temperatureUnit: "celsius", // 'celsius' | 'fahrenheit'
    forecastHorizon: "5", // '3' | '5' | '7'
    severeAlerts: true,
    rainAlerts: true,
    pollutionWarnings: true,
    refreshInterval: "1h", // '30m' | '1h' | '3h'
  },
  tripPreferences: {
    mode: "auto", // 'auto' | 'manual'
    defaultStyle: "public", // 'public' | 'private'
    smartRecommendations: true,
    travelStyle: "mid-range", // 'budget' | 'mid-range' | 'luxury'
    typicalDuration: "3-5 days",
    idealGroupSize: "4-6",
    accommodations: ["Hotel", "Airbnb"],
    dietaryRestrictions: ["No Restrictions"],
    interests: ["Mountains", "Sightseeing", "Food Exploring", "Photography"],
  },
  currency: {
    baseCurrency: "INR",
    showSymbol: true,
    autoRoundOff: true,
    defaultSplitMethod: "equal", // 'equal' | 'percentage' | 'exact'
    autoCategorize: true,
    monthlySavingsGoalEnabled: true,
    monthlySavingsGoalAmount: 15000,
  },
  notifications: {
    allPush: true,
    tripUpdates: true,
    chatMessages: true,
    reminders: true,
    recommendations: true,
    promotions: false,
    quietHoursEnabled: false,
    quietHoursFrom: "22:00",
    quietHoursUntil: "07:00",
  },
};

/**
 * Merge nested preference objects safely without overwriting defaults with undefined
 */
export function deepMergePreferences(target, source) {
  if (!source) return target;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMergePreferences(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}

/**
 * Load user settings from Firestore (with localStorage fallback)
 */
export async function loadUserSettings(uid) {
  let localData = null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (raw) localData = JSON.parse(raw);
  } catch (err) {
    console.debug("Local storage read error for settings:", err);
  }

  if (!uid && auth.currentUser) {
    uid = auth.currentUser.uid;
  }

  if (!uid) {
    return deepMergePreferences(DEFAULT_PREFERENCES, localData);
  }

  try {
    const prefRef = doc(db, "users", uid, "settings", "preferences");
    const snap = await getDoc(prefRef);
    if (snap.exists()) {
      const firestoreData = snap.data();
      const merged = deepMergePreferences(DEFAULT_PREFERENCES, firestoreData);
      try {
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(merged));
      } catch (_) {}
      return merged;
    } else {
      // If no subcollection exists yet, check parent user doc for legacy preferences
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      let legacyPrefs = {};
      if (userSnap.exists()) {
        const udata = userSnap.data();
        if (udata.privacy) legacyPrefs.privacy = udata.privacy;
        if (udata.settings) legacyPrefs = { ...legacyPrefs, ...udata.settings };
      }
      const merged = deepMergePreferences(DEFAULT_PREFERENCES, {
        ...legacyPrefs,
        ...localData,
      });
      // Save initial defaults to Firestore
      try {
        await setDoc(prefRef, merged, { merge: true });
      } catch (saveErr) {
        console.debug("Initial save to Firestore preferences skipped:", saveErr);
      }
      return merged;
    }
  } catch (err) {
    console.error("Error loading settings from Firestore:", err);
    return deepMergePreferences(DEFAULT_PREFERENCES, localData);
  }
}

/**
 * Save user settings to Firestore and localStorage
 */
export async function saveUserSettings(uid, groupKey, partialSettings) {
  if (!uid && auth.currentUser) {
    uid = auth.currentUser.uid;
  }

  // Update localStorage immediately
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    const current = raw ? JSON.parse(raw) : DEFAULT_PREFERENCES;
    const updated = {
      ...current,
      [groupKey]: {
        ...(current[groupKey] || {}),
        ...partialSettings,
      },
    };
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));
  } catch (_) {}

  if (!uid) return;

  try {
    const prefRef = doc(db, "users", uid, "settings", "preferences");
    const payload = groupKey ? { [groupKey]: partialSettings } : partialSettings;
    await setDoc(prefRef, payload, { merge: true });

    // Synchronize high-priority legacy fields directly to userDoc for backward compatibility
    if (groupKey === "privacy" && partialSettings.profileVisibility) {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        "privacy.profileVisibility": partialSettings.profileVisibility,
        isPrivate: partialSettings.profileVisibility === "private",
      }).catch(() => {});
    }
  } catch (err) {
    console.error(`Error saving user settings group [${groupKey}]:`, err);
  }
}
