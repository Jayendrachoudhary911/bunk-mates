/**
 * src/utils/routePrefetcher.js
 *
 * Intelligent route and chunk preloader.
 * Pre-caches code chunks in browser memory during idle periods and on link hover/touch,
 * providing instant 0ms transitions when buttons, links, or navigation items are clicked.
 */

const prefetchedRoutes = new Set();

const ROUTE_LOADERS = {
  home: () => import("../pages/Home"),
  chats: () => Promise.all([
    import("../components/ChatWorkspace"),
    import("../pages/Chats"),
    import("../components/chats_components/Chatroom"),
    import("../components/groupchats_components/GroupChat")
  ]),
  trips: () => import("../pages/Trips"),
  notes: () => import("../pages/Notes"),
  profile: () => import("../pages/Profile"),
  budget: () => import("../pages/Budget"),
  reminders: () => import("../pages/Reminders"),
  search: () => import("../pages/Search"),
  savedTrips: () => import("../pages/SavedTripsPage"),
  createTrip: () => import("../pages/CreateTripPage"),
};

/**
 * Prefetches a specific route bundle
 */
export function prefetchRoute(routeName) {
  if (!routeName || prefetchedRoutes.has(routeName)) return;
  const loader = ROUTE_LOADERS[routeName];
  if (typeof loader === "function") {
    prefetchedRoutes.add(routeName);
    try {
      loader().catch(() => {
        // Safe error handling for offline/network glitches
        prefetchedRoutes.delete(routeName);
      });
    } catch (e) {
      prefetchedRoutes.delete(routeName);
    }
  }
}

/**
 * Automatically prefetches core application routes during browser idle time
 * (without competing with initial LCP)
 */
export function initIdleRoutePrefetch() {
  if (typeof window === "undefined") return;

  const prefetchCore = () => {
    // Stagger prefetch requests so CPU/network remains silky smooth
    const queue = ["chats", "trips", "notes", "profile", "search"];
    queue.forEach((route, idx) => {
      setTimeout(() => {
        prefetchRoute(route);
      }, 1200 + idx * 800);
    });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(prefetchCore, { timeout: 3000 });
  } else {
    setTimeout(prefetchCore, 2000);
  }
}
