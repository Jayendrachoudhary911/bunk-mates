import React from 'react';
import * as L from 'lucide-react';

// Helper to pick the first available lucide icon name from a list
const pick = (names) => names.map((n) => L[n]).find(Boolean) || L.Square;

export const withSx = (Comp) => {
  return ({ sx, style, size, color, ...rest }) => {
    const finalStyle = { ...(style || {}) };

    if (sx && typeof sx === 'object') {
      if (sx.fontSize) {
        const fs = sx.fontSize;
        finalStyle.width = typeof fs === 'number' ? `${fs}px` : fs;
        finalStyle.height = typeof fs === 'number' ? `${fs}px` : fs;
        rest.size = typeof fs === 'number' ? fs : fs;
      }
      if (sx.color) {
        rest.color = sx.color;
      }
      if (sx.opacity !== undefined) finalStyle.opacity = sx.opacity;
      if (sx.position) finalStyle.position = sx.position;
      if (sx.right) finalStyle.right = sx.right;
      if (sx.top) finalStyle.top = sx.top;
      if (sx.left) finalStyle.left = sx.left;
      if (sx.bottom) finalStyle.bottom = sx.bottom;
      if (sx.transform) finalStyle.transform = sx.transform;
      if (sx.transition) finalStyle.transition = sx.transition;
    }

    if (size) rest.size = size;
    if (color) rest.color = color;

    return <Comp {...rest} style={finalStyle} />;
  };
};

// Map commonly used MUI and Lucide icon names to standardized wrapped components
const map = {
  // Navigation & Actions
  Add: L.Plus,
  AddRounded: L.Plus,
  AddCircle: pick(['PlusCircle', 'Plus']),
  CloseOutlined: pick(['X', 'XCircle']),
  Close: pick(['X', 'XCircle']),
  CloseRounded: pick(['X', 'XCircle']),
  Clear: pick(['X', 'XCircle']),
  Search: L.Search,
  SearchOutlined: L.Search,
  Edit: L.Edit3,
  Edit3: L.Edit3,
  EditOutlined: L.Edit3,
  Delete: L.Trash2,
  DeleteOutline: L.Trash2,
  DeleteForever: pick(['Trash', 'Trash2']),
  DeleteSweep: pick(['Trash2', 'Trash']),
  DeleteSweepOutlined: pick(['Trash2']),
  DeleteForeverOutlined: pick(['Trash', 'Trash2']),
  MoreVert: L.MoreVertical,
  MoreHoriz: L.MoreHorizontal,
  Share: L.Share2,
  Share2: L.Share2,
  PushPin: pick(['Pin', 'Bookmark']),
  Label: pick(['Tag', 'Bookmark']),
  FilterList: pick(['Sliders', 'Filter']),
  Tune: pick(['Sliders', 'Settings']),
  TuneIcon: pick(['Sliders', 'Settings']),
  Straighten: pick(['Sliders', 'Ruler', 'Maximize2']),
  ViewList: L.List,
  ViewModule: pick(['LayoutGrid', 'Grid']),
  Check: L.Check,
  CheckCircle: pick(['CheckCircle', 'Check']),
  CheckCircleOutline: pick(['CheckCircle', 'Check']),
  Done: L.Check,
  DoneAll: pick(['CheckCheck', 'Check']),
  Refresh: pick(['RefreshCw', 'RotateCw']),

  // Directional & Arrows
  ArrowBack: L.ArrowLeft,
  ArrowBackRounded: L.ArrowLeft,
  ArrowForward: L.ArrowRight,
  ArrowForwardIos: L.ArrowRight,
  ArrowDropDown: L.ChevronDown,
  ArrowDropUp: L.ChevronUp,
  ChevronLeft: L.ChevronLeft,
  ChevronRight: L.ChevronRight,
  ChevronDown: L.ChevronDown,
  ChevronUp: L.ChevronUp,
  ExpandMore: L.ChevronDown,
  ExpandLess: L.ChevronUp,

  // User & Social
  Person: pick(['User', 'User2']),
  PersonOutline: pick(['User', 'User2']),
  PersonRounded: pick(['User', 'User2']),
  PersonAdd: pick(['UserPlus', 'User']),
  PersonAddOutlined: pick(['UserPlus']),
  Group: pick(['Users', 'UserCheck']),
  People: pick(['Users', 'UserCheck']),
  AccountCircle: pick(['UserCircle', 'User']),
  AccountCircleOutlined: pick(['UserCircle', 'User']),

  // Chat & Communication
  Chat: pick(['MessageCircle', 'MessageSquare']),
  ChatIcon: pick(['MessageCircle', 'MessageSquare']),
  ChatBubble: pick(['MessageCircle', 'MessageSquare']),
  ChatBubbleOutline: pick(['MessageCircle', 'MessageSquare']),
  Message: pick(['MessageSquare', 'MessageCircle']),
  Send: pick(['SendHorizontal', 'Send']),
  SendRounded: pick(['SendHorizontal', 'Send']),
  Mail: pick(['Mail', 'Inbox']),
  Email: pick(['Mail', 'Inbox']),
  MailOutlined: pick(['Mail', 'Inbox']),

  // Time & Calendar
  AccessTime: pick(['Clock', 'Watch']),
  Clock: pick(['Clock', 'Watch']),
  AlarmOutlined: L.AlarmClock,
  CalendarToday: pick(['Calendar', 'CalendarDays']),
  CalendarTodayOutlined: pick(['Calendar', 'CalendarDays']),
  CalendarMonth: pick(['Calendar', 'CalendarDays']),
  HourglassBottom: pick(['Hourglass', 'Clock']),

  // Maps & Location
  Map: pick(['Map', 'MapPin']),
  MapOutlined: pick(['Map', 'MapPin']),
  LocationOn: pick(['MapPin', 'Navigation']),
  LocationOnOutlined: pick(['MapPin', 'Navigation']),
  Directions: pick(['Navigation', 'MapPin']),
  TravelExplore: pick(['Compass', 'Globe']),
  TravelExploreOutlined: pick(['Compass', 'Globe']),
  Explore: pick(['Compass', 'Globe']),
  ExploreOutlined: pick(['Compass', 'Globe']),
  FlightTakeoff: pick(['Plane', 'Send']),
  Luggage: pick(['Luggage', 'Briefcase', 'Package']),
  Backpack: pick(['Backpack', 'Package']),

  // Media, Photos & Code
  PhotoCamera: pick(['Camera', 'Image']),
  PhotoLibrary: pick(['Image', 'Images']),
  PhotoLibraryOutlined: pick(['Image', 'Images']),
  Image: pick(['Image', 'Images']),
  WallpaperOutlined: pick(['Image', 'Images']),
  Code: pick(['Code', 'Terminal']),
  SmartToy: pick(['Bot', 'Cpu']),
  SmartToyRounded: pick(['Bot', 'Cpu']),
  AutoAwesome: pick(['Sparkles', 'Zap']),
  Sparkles: pick(['Sparkles', 'Zap']),
  LiveTv: pick(['Tv', 'Monitor']),
  MovieOutlined: pick(['Film', 'Video']),
  YouTube: pick(['Youtube', 'Play']),
  Instagram: pick(['Instagram']),
  WhatsApp: pick(['Phone', 'MessageCircle']),
  Telegram: pick(['Send']),
  Twitter: pick(['Twitter', 'Send']),

  // Status, Alert & Security
  Info: L.Info,
  InfoOutlined: L.Info,
  Warning: pick(['AlertTriangle', 'AlertCircle']),
  WarningAmber: pick(['AlertTriangle', 'AlertCircle']),
  WarningAmberRounded: pick(['AlertTriangle', 'AlertCircle']),
  ErrorOutline: pick(['AlertCircle', 'AlertTriangle']),
  ReportProblem: pick(['AlertTriangle', 'AlertCircle']),
  Shield: pick(['Shield', 'Lock']),
  ShieldOutlined: pick(['Shield', 'Lock']),
  Lock: pick(['Lock', 'Key']),
  LockOutlined: pick(['Lock', 'Key']),
  VpnKey: pick(['Key', 'Lock']),
  Visibility: pick(['Eye', 'EyeOff']),
  VisibilityOff: pick(['EyeOff', 'Eye']),
  Block: pick(['Slash', 'Ban']),
  BlockOutlined: pick(['Slash', 'Ban']),

  // Weather & Elements
  WbSunny: pick(['Sun', 'Sunrise']),
  WbSunnyOutlined: pick(['Sun', 'Sunrise']),
  Brightness4: pick(['Moon', 'Sun']),
  Brightness4Icon: pick(['Moon', 'Sun']),
  Cloud: pick(['Cloud', 'CloudRain']),
  AcUnit: pick(['Snowflake']),
  Thunderstorm: pick(['CloudLightning', 'Zap']),
  FlashlightOnOutlined: pick(['Zap', 'Lightbulb']),
  ElectricBolt: pick(['Zap', 'Activity']),
  FlashOffRounded: pick(['ZapOff', 'Slash']),

  // Misc & Utils
  ContentCopy: pick(['Copy', 'Clipboard']),
  ContentCopyOutlined: pick(['Copy', 'Clipboard']),
  OpenInNew: pick(['ExternalLink', 'Share']),
  DownloadOutlined: pick(['Download', 'ArrowDown']),
  DriveFolderUpload: pick(['Upload', 'FolderUp']),
  LayersOutlined: pick(['Layers', 'Copy']),
  EngineeringOutlined: pick(['Wrench', 'Tool', 'Settings']),
  Settings: pick(['Settings', 'Sliders']),
  SettingsOutlined: pick(['Settings', 'Sliders']),
  PaletteOutlined: pick(['Palette', 'Sliders']),
  FormatSizeOutlined: pick(['Type', 'Sliders']),
  FormatBold: pick(['Bold', 'Type']),
  FormatItalic: pick(['Italic', 'Type']),
  LanguageOutlined: pick(['Globe', 'World']),
  Language: pick(['Globe', 'World']),
  FeedbackOutlined: pick(['MessageSquare', 'HelpCircle']),
  HelpOutline: pick(['HelpCircle', 'Info']),
  NotificationsActive: pick(['Bell', 'BellRing']),
  NotificationsNone: pick(['Bell', 'BellRing']),
  NotificationsNoneOutlined: pick(['Bell', 'BellRing']),
  RocketLaunch: pick(['Rocket', 'Zap']),
  Favorite: pick(['Heart']),
  FavoriteBorder: pick(['Heart']),
  Bookmark: pick(['Bookmark', 'Tag']),
  BookmarkBorder: pick(['Bookmark']),
  CategoryOutlined: pick(['Grid', 'LayoutGrid']),
  RestaurantOutlined: pick(['Coffee', 'Utensils']),
  LocalMallOutlined: pick(['ShoppingBag', 'Store']),
  LocalHospitalOutlined: pick(['Hospital', 'PlusCircle']),
  SchoolOutlined: pick(['GraduationCap', 'BookOpen']),
  EmojiEventsOutlined: pick(['Award', 'Trophy']),
  LocalGasStationOutlined: pick(['Fuel', 'Zap']),
  LocalAtmOutlined: pick(['CreditCard', 'DollarSign']),
  AccountBalanceWalletOutlined: pick(['Wallet', 'CreditCard']),
  Logout: pick(['LogOut', 'ExternalLink']),
  QrCode: pick(['QrCode', 'Scan']),
  QrCode2Outlined: pick(['QrCode', 'Scan']),
  QrCodeScanner: pick(['Scan', 'QrCode']),
  // Add newly identified missing icon mappings
  Home: pick(['Home', 'House']),
  HomeOutlined: pick(['Home', 'House']),
  StickyNote2: pick(['FileText', 'File', 'FileEdit']),
  StickyNote2Outlined: pick(['FileText', 'File', 'FileEdit']),
  Notes: pick(['FileText', 'File', 'FileEdit']),
  SwapVert: pick(['ArrowUpDown', 'ChevronsUpDown', 'MoveVertical']),
  CloudUpload: pick(['UploadCloud', 'Upload']),
  Calculate: pick(['Calculator', 'PlusCircle']),
  Timeline: pick(['Activity', 'TrendingUp', 'GitCommit']),
  TimelineIcon: pick(['Activity', 'TrendingUp', 'GitCommit']),
  ListAlt: pick(['ListOrdered', 'List', 'CheckSquare']),
  Public: pick(['Globe', 'World']),
  PeopleOutline: pick(['Users', 'UserCheck']),
  PersonOffOutlined: pick(['UserX', 'UserMinus']),
  PersonOff: pick(['UserX', 'UserMinus']),
};

const exportsObj = new Proxy(
  {},
  {
    get: (target, prop) => {
      if (typeof prop !== 'string') return undefined;
      if (target[prop]) return target[prop];

      // Normalize prop
      const cleanName = prop.replace(/Icon$/, '').replace(/Outlined$/, '').replace(/Rounded$/, '');
      const lucideKey = Object.keys(L).find(
        (k) => k.toLowerCase() === prop.toLowerCase() || k.toLowerCase() === cleanName.toLowerCase()
      );

      const Comp = map[prop] || map[cleanName] || (lucideKey ? L[lucideKey] : null) || L.Square;
      const wrapped = withSx(Comp);
      target[prop] = wrapped;
      return wrapped;
    },
  }
);

Object.entries(map).forEach(([name, Comp]) => {
  const Wrapped = withSx(Comp);
  exportsObj[name] = Wrapped;
  exportsObj[`${name}Icon`] = Wrapped;
  exportsObj[name.replace(/Icon$/, '')] = Wrapped;
  exportsObj[`${name}Outlined`] = Wrapped;
  exportsObj[`${name}Rounded`] = Wrapped;
});

export default exportsObj;

export const {
  Add,
  AddRounded,
  AddCircle,
  CloseOutlined,
  Close,
  CloseRounded,
  Clear,
  Search,
  SearchOutlined,
  Edit,
  Edit3,
  EditOutlined,
  Delete,
  DeleteOutline,
  DeleteForever,
  DeleteSweep,
  DeleteSweepOutlined,
  DeleteForeverOutlined,
  MoreVert,
  MoreHoriz,
  Share,
  Share2,
  PushPin,
  Label,
  FilterList,
  Tune,
  ViewList,
  ViewModule,
  Check,
  CheckCircle,
  CheckCircleOutline,
  Done,
  DoneAll,
  Refresh,
  ArrowBack,
  ArrowBackRounded,
  ArrowForward,
  ArrowForwardIos,
  ArrowDropDown,
  ArrowDropUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExpandMore,
  ExpandLess,
  Person,
  PersonOutline,
  PersonRounded,
  PersonAdd,
  PersonAddOutlined,
  Group,
  People,
  AccountCircle,
  AccountCircleOutlined,
  Chat,
  ChatIcon,
  ChatBubble,
  ChatBubbleOutline,
  Message,
  Send,
  SendRounded,
  Mail,
  Email,
  MailOutlined,
  AccessTime,
  Clock,
  AlarmOutlined,
  CalendarToday,
  CalendarTodayOutlined,
  CalendarMonth,
  HourglassBottom,
  Map,
  MapOutlined,
  LocationOn,
  LocationOnOutlined,
  Directions,
  TravelExplore,
  TravelExploreOutlined,
  Explore,
  ExploreOutlined,
  FlightTakeoff,
  Luggage,
  Backpack,
  PhotoCamera,
  PhotoLibrary,
  PhotoLibraryOutlined,
  Image,
  WallpaperOutlined,
  Code,
  SmartToy,
  SmartToyRounded,
  AutoAwesome,
  Sparkles,
  LiveTv,
  MovieOutlined,
  YouTube,
  Instagram,
  WhatsApp,
  Telegram,
  Twitter,
  Info,
  InfoOutlined,
  Warning,
  WarningAmber,
  WarningAmberRounded,
  ErrorOutline,
  ReportProblem,
  Shield,
  ShieldOutlined,
  Lock,
  LockOutlined,
  VpnKey,
  Visibility,
  VisibilityOff,
  Block,
  BlockOutlined,
  WbSunny,
  WbSunnyOutlined,
  Cloud,
  AcUnit,
  Thunderstorm,
  FlashlightOnOutlined,
  ElectricBolt,
  FlashOffRounded,
  ContentCopy,
  ContentCopyOutlined,
  OpenInNew,
  DownloadOutlined,
  DriveFolderUpload,
  LayersOutlined,
  EngineeringOutlined,
  Settings,
  SettingsOutlined,
  PaletteOutlined,
  FormatSizeOutlined,
  FormatBold,
  FormatItalic,
  LanguageOutlined,
  Language,
  FeedbackOutlined,
  HelpOutline,
  NotificationsActive,
  NotificationsNone,
  NotificationsNoneOutlined,
  RocketLaunch,
  Favorite,
  FavoriteBorder,
  Bookmark,
  BookmarkBorder,
  CategoryOutlined,
  RestaurantOutlined,
  LocalMallOutlined,
  LocalHospitalOutlined,
  SchoolOutlined,
  EmojiEventsOutlined,
  LocalGasStationOutlined,
  LocalAtmOutlined,
  AccountBalanceWalletOutlined,
  Logout,
  QrCode,
  QrCode2Outlined,
  QrCodeScanner,
  Circle,
  WifiTethering,
  BroadcastOnPersonal,
  Home,
  HomeOutlined,
  StickyNote2,
  StickyNote2Outlined,
  Notes,
  SwapVert,
  CloudUpload,
  Calculate,
  Timeline,
  TimelineIcon,
  ListAlt,
  Public,
  PeopleOutline,
  PersonOffOutlined,
  PersonOff,
  Brightness4,
  Brightness4Icon,
} = exportsObj;
