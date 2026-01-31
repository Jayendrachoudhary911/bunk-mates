import React from 'react';
import * as L from 'lucide-react';

// Helper to pick the first available lucide icon name from a list
const pick = (names) => names.map((n) => L[n]).find(Boolean) || L.Square;

const withSx = (Comp) => {
  return ({ sx, style, size, color, ...rest }) => {
    const finalStyle = { ...(style || {}) };

    if (sx && typeof sx === 'object') {
      if (sx.fontSize) {
        const fs = sx.fontSize;
        // lucide accepts `size` prop; also set width/height via style for safety
        finalStyle.width = typeof fs === 'number' ? `${fs}px` : fs;
        finalStyle.height = typeof fs === 'number' ? `${fs}px` : fs;
        rest.size = typeof fs === 'number' ? fs : fs;
      }
      if (sx.color) {
        rest.color = sx.color;
      }
      if (sx.opacity !== undefined) finalStyle.opacity = sx.opacity;
      // basic positioning helpers
      if (sx.position) finalStyle.position = sx.position;
      if (sx.right) finalStyle.right = sx.right;
      if (sx.top) finalStyle.top = sx.top;
    }

    if (size) rest.size = size;
    if (color) rest.color = color;

    return <Comp {...rest} style={finalStyle} />;
  };
};

// Map commonly used MUI icon names to lucide icons and export both variants (with and without Icon suffix)
const map = {
  CloseOutlined: pick(['X', 'XCircle']),
  Close: pick(['X', 'XCircle']),
  Add: L.Plus,
  MapOutlined: pick(['Map', 'MapPin']),
  CheckCircleOutline: pick(['CheckCircle']),
  CheckCircle: pick(['CheckCircle']),
  Search: L.Search,
  Favorite: L.Heart,
  FavoriteBorder: L.Heart,
  Bookmark: L.Bookmark,
  BookmarkBorder: L.Bookmark,
  LocationOn: L.MapPin,
  AccessTime: L.Clock,
  WbSunnyOutlined: L.Sun,
  CalendarTodayOutlined: L.Calendar,
  CalendarMonth: L.Calendar,
  Cloud: L.Cloud,
  FlashOffRounded: L.ZapOff,
  CategoryOutlined: L.Grid,
  RestaurantOutlined: L.Coffee,
  TravelExploreOutlined: L.Compass,
  HomeOutlined: L.Home,
  LocalMallOutlined: L.ShoppingBag,
  LocalHospitalOutlined: L.Hospital,
  SchoolOutlined: pick(['GraduationCap', 'BookOpen']),
  EmojiEventsOutlined: L.Award,
  LocalGasStationOutlined: pick(['GasPump', 'Fuel', 'Zap']),
  MovieOutlined: pick(['Film']),
  LocalAtmOutlined: pick(['CreditCard', 'DollarSign']),
  ChevronRight: L.ChevronRight,
  ChevronLeft: L.ChevronLeft,
  AccountBalanceWalletOutlined: pick(['Wallet']),
  ExploreOutlined: L.Compass,
  StickyNote2Outlined: pick(['StickyNote', 'FileText']),
  AlarmOutlined: L.AlarmClock,
  NotificationsActive: L.Bell,
  ChatBubbleOutline: pick(['MessageCircle','MessageSquare']),
  NotificationsNoneOutlined: L.Bell,
  ExpandMore: L.ChevronDown,
  ExpandLess: L.ChevronUp,
  ArrowForwardIos: L.ArrowRight,
  Circle: L.Circle,
  LiveTv: L.Tv,
  Check: L.Check,
  BroadcastOnPersonal: pick(['Cast', 'Wifi']),
  WifiTethering: L.Wifi,
  InfoOutlined: L.Info,
  NotificationsNone: L.Bell,
  AcUnit: L.Snowflake,
  DownhillSkiing: pick(['Skiing', 'Map']),
  Straighten: pick(['Maximize2', 'Ruler']),
  Terrain: pick(['Mountain']),
  CloseRounded: pick(['X', 'XCircle']),
  ContentCopyOutlined: pick(['Copy','Copy']),
  OpenInNew: L.ExternalLink,
  DeleteOutline: L.Trash2,
  Edit: L.Edit3,
  EditOutlined: L.Edit3,
  ArrowBack: L.ArrowLeft,
  MoreVert: L.MoreVertical,
  InfoOutlinedIcon: L.Info,
  DeleteOutlineIcon: L.Trash2,
  Done: L.Check,
  Delete: L.Trash2,
  PhotoCamera: L.Camera,
  Block: L.Slash,
  Instagram: pick(['Instagram']),
  YouTube: pick(['Youtube']),
  QrCode: pick(['Qrcode','QrCode']),
  QrCodeScanner: pick(['Scan','QrCode']),
  ArrowDropDown: L.ChevronDown,
  Logout: L.LogOut,
  Share: L.Share2,
  Image: L.Image,
  Directions: L.MapPin,
  Group: L.Users,
  AddLink: L.Link,
  DriveFolderUpload: L.Upload,
  YouTube: pick(['Youtube']),
  PhotoLibrary: L.Image,
  WarningAmberRounded: L.AlertTriangle,
  DoneIcon: L.Check,
  ArrowBackRounded: L.ArrowLeft,
  Visibility: pick(['Eye','EyeOff']),
  VisibilityOff: pick(['EyeOff','Eye']),
  Tune: pick(['Sliders','Settings']),
  LockOutlined: pick(['Lock']),
  RocketLaunch: pick(['Rocket']),
  HourglassBottom: pick(['Hourglass']),
  // Add more mappings as needed
  ArrowDropDown: L.ChevronDown,
  Logout: L.LogOut,
  PersonOutline: pick(['User','User2']),
  HelpOutline: pick(['HelpCircle','HelpCircle']),
  MailOutlined: pick(['Mail','Mail']),
  SettingsOutlined: pick(['Settings']),
  EditOutlined: L.Edit3,
  AccountCircleOutlined: pick(['User','UserCircle']),
  CheckCircle: L.CheckCircle,
  LanguageOutlined: pick(['Globe','World']),
  PersonAddOutlined: pick(['UserPlus']),
  FeedbackOutlined: pick(['MessageSquare']),
  LanguageIcon: pick(['Globe','World']),
  PaletteOutlined: pick(['Sliders','Palette']),
  WallpaperOutlined: pick(['Image']),
  FormatSizeOutlined: pick(['Type','TextSize','Settings']),
  DeleteSweepOutlined: pick(['Trash2']),
  DeleteForeverOutlined: pick(['Trash','Trash2']),
  WarningAmber: pick(['AlertTriangle']),
  ChatIcon: pick(['MessageCircle','MessageSquare']),
  ReportProblem: pick(['AlertTriangle','AlertCircle']),
  WhatsApp: pick(['Whatsapp']),
  Email: pick(['Mail']),
  Telegram: pick(['Send']), 
  LinkOutlined: pick(['Link']),
  QrCode2Outlined: pick(['Qrcode','QrCode']),
  PhotoLibraryOutlined: pick(['Image']),
  FlashlightOnOutlined: pick(['Zap','Flashlight']),
  DownloadOutlined: pick(['Download']),
  LayersOutlined: pick(['Layers']),
  EngineeringOutlined: pick(['Tool','Settings']),
  NotificationsNoneOutlined: L.Bell,
  Send: pick(['SendHorizontal']),
};

const exportsObj = {};

Object.entries(map).forEach(([name, Comp]) => {
  const Wrapped = withSx(Comp);
  exportsObj[name] = Wrapped;
  exportsObj[`${name}Icon`] = Wrapped;
  // also export a no-suffix version for imports like `import SearchIcon from .../Search` vs `import { Search }`
  exportsObj[name.replace(/Icon$/, '')] = Wrapped;
});

export default exportsObj;
export const {
  CloseOutlined,
  Close,
  Add,
  MapOutlined,
  CheckCircleOutline,
  CheckCircle,
  Search,
  Favorite,
  FavoriteBorder,
  Bookmark,
  BookmarkBorder,
  LocationOn,
  AccessTime,
  WbSunnyOutlined,
  CalendarTodayOutlined,
  CalendarMonth,
  Cloud,
  FlashOffRounded,
  CategoryOutlined,
  RestaurantOutlined,
  TravelExploreOutlined,
  HomeOutlined,
  LocalMallOutlined,
  LocalHospitalOutlined,
  SchoolOutlined,
  EmojiEventsOutlined,
  LocalGasStationOutlined,
  MovieOutlined,
  LocalAtmOutlined,
  ChevronRight,
  ChevronLeft,
  AccountBalanceWalletOutlined,
  ExploreOutlined,
  StickyNote2Outlined,
  AlarmOutlined,
  NotificationsActive,
  ChatBubbleOutline,
  NotificationsNoneOutlined,
  ExpandMore,
  ExpandLess,
  ArrowForwardIos,
  Circle,
  LiveTv,
  Check,
  BroadcastOnPersonal,
  WifiTethering,
  InfoOutlined,
  NotificationsNone,
  AcUnit,
  DownhillSkiing,
  Straighten,
  Terrain,
  LockOutlined,
  RocketLaunch,
  HourglassBottom,
} = exportsObj;
