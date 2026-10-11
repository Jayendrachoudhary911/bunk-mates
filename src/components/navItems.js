// src/constants/navItems.js
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import AlarmOutlinedIcon from '@mui/icons-material/AlarmOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';

export const NAV_ITEMS = [
  {
    label: "Notes",
    icon: <StickyNote2OutlinedIcon />,
    path: "/notes",
  },
  {
    label: "Reminder",
    icon: <AlarmOutlinedIcon />,
    path: "/reminders",
  },
  {
    label: "Trip",
    icon: <ExploreOutlinedIcon />,
    path: "/trips",
  },
  {
    label: "Budget",
    icon: <AccountBalanceWalletOutlinedIcon />,
    path: "/budget-mngr",
  },
];

// Add the default home path as the central one for the swipe carousel
export const SWIPEABLE_PATHS = [
  "/", // Assuming Home is the central view
  "/search",
  "/notes",
  "/trips",
];