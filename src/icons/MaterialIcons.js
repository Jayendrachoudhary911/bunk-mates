import React from 'react';
import * as M from '@mui/icons-material';

// Helper to pick the first available icon from @mui/icons-material
const pick = (names) => {
  for (const n of names) {
    if (M[n]) return M[n];
  }
  return M.HelpOutline || M.Circle;
};

export const withSx = (Comp) => {
  return ({ sx, style, size, fontSize, color, stroke, ...rest }) => {
    const finalStyle = { ...(style || {}) };

    if (sx && typeof sx === 'object') {
      if (sx.fontSize) {
        const fs = sx.fontSize;
        finalStyle.fontSize = typeof fs === 'number' ? `${fs}px` : fs;
      }
      if (sx.color) {
        finalStyle.color = sx.color;
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

    if (size) {
      finalStyle.fontSize = typeof size === 'number' ? `${size}px` : size;
    }
    if (fontSize) {
      finalStyle.fontSize = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;
    }
    if (color) {
      finalStyle.color = color;
    }

    return <Comp {...rest} sx={sx} style={finalStyle} />;
  };
};

// Map commonly used MUI and alias icon names to standardized wrapped components
const map = {
  // Navigation & Actions
  Add: pick(['Add', 'AddRounded']),
  AddRounded: pick(['AddRounded', 'Add']),
  AddCircle: pick(['AddCircle', 'AddCircleOutline', 'Add']),
  CloseOutlined: pick(['CloseOutlined', 'Close']),
  Close: pick(['Close', 'CloseOutlined', 'Clear']),
  CloseRounded: pick(['CloseRounded', 'Close']),
  Clear: pick(['Clear', 'Close']),
  Search: pick(['Search', 'SearchOutlined']),
  SearchOutlined: pick(['SearchOutlined', 'Search']),
  Edit: pick(['Edit', 'EditOutlined']),
  Edit3: pick(['EditOutlined', 'Edit']),
  EditOutlined: pick(['EditOutlined', 'Edit']),
  Delete: pick(['Delete', 'DeleteOutline']),
  DeleteOutline: pick(['DeleteOutline', 'Delete']),
  DeleteForever: pick(['DeleteForever', 'DeleteForeverOutlined', 'Delete']),
  DeleteSweep: pick(['DeleteSweep', 'DeleteSweepOutlined', 'Delete']),
  DeleteSweepOutlined: pick(['DeleteSweepOutlined', 'DeleteSweep']),
  DeleteForeverOutlined: pick(['DeleteForeverOutlined', 'DeleteForever']),
  MoreVert: pick(['MoreVert', 'MoreVertOutlined']),
  MoreHoriz: pick(['MoreHoriz', 'MoreHorizOutlined']),
  Share: pick(['Share', 'ShareOutlined']),
  Share2: pick(['Share', 'ShareOutlined']),
  PushPin: pick(['PushPin', 'PushPinOutlined']),
  Label: pick(['Label', 'LabelOutlined']),
  LabelOutlined: pick(['LabelOutlined', 'Label']),
  FilterList: pick(['FilterList', 'FilterListOutlined', 'Tune']),
  Tune: pick(['Tune', 'TuneOutlined']),
  TuneIcon: pick(['Tune', 'TuneOutlined']),
  Straighten: pick(['Straighten', 'StraightenOutlined', 'Tune']),
  ViewList: pick(['ViewList', 'ViewListOutlined', 'List']),
  ViewModule: pick(['ViewModule', 'ViewModuleOutlined', 'GridView']),
  Check: pick(['Check', 'CheckOutlined', 'Done']),
  CheckCircle: pick(['CheckCircle', 'CheckCircleOutline']),
  CheckCircleOutline: pick(['CheckCircleOutline', 'CheckCircle']),
  Done: pick(['Done', 'DoneOutlined', 'Check']),
  DoneAll: pick(['DoneAll', 'DoneAllOutlined']),
  Refresh: pick(['Refresh', 'RefreshOutlined']),

  // Directional & Arrows
  ArrowBack: pick(['ArrowBack', 'ArrowBackRounded', 'ArrowBackIosNew']),
  ArrowBackRounded: pick(['ArrowBackRounded', 'ArrowBack']),
  ArrowForward: pick(['ArrowForward', 'ArrowForwardRounded', 'ArrowForwardIos']),
  ArrowForwardIos: pick(['ArrowForwardIos', 'ArrowForward']),
  ArrowDropDown: pick(['ArrowDropDown', 'ArrowDropDownRounded', 'ExpandMore']),
  ArrowDropUp: pick(['ArrowDropUp', 'ArrowDropUpRounded', 'ExpandLess']),
  ChevronLeft: pick(['ChevronLeft', 'ArrowBackIosNew', 'ArrowBack']),
  ChevronRight: pick(['ChevronRight', 'ArrowForwardIos', 'ArrowForward']),
  ChevronDown: pick(['ChevronDown', 'ExpandMore', 'ArrowDropDown']),
  ChevronUp: pick(['ChevronUp', 'ExpandLess', 'ArrowDropUp']),
  ExpandMore: pick(['ExpandMore', 'ArrowDropDown']),
  ExpandLess: pick(['ExpandLess', 'ArrowDropUp']),

  // User & Social
  Person: pick(['Person', 'PersonOutline', 'AccountCircle']),
  PersonOutline: pick(['PersonOutline', 'Person', 'AccountCircleOutlined']),
  PersonRounded: pick(['PersonRounded', 'Person']),
  PersonAdd: pick(['PersonAdd', 'PersonAddOutlined', 'GroupAdd']),
  PersonAddOutlined: pick(['PersonAddOutlined', 'PersonAdd']),
  Group: pick(['Group', 'GroupOutlined', 'People']),
  People: pick(['People', 'PeopleOutline', 'Group']),
  AccountCircle: pick(['AccountCircle', 'AccountCircleOutlined', 'Person']),
  AccountCircleOutlined: pick(['AccountCircleOutlined', 'AccountCircle']),

  // Chat & Communication
  Chat: pick(['Chat', 'ChatBubble', 'ChatOutlined']),
  ChatIcon: pick(['Chat', 'ChatBubble']),
  ChatBubble: pick(['ChatBubble', 'ChatBubbleOutline']),
  ChatBubbleOutline: pick(['ChatBubbleOutline', 'ChatBubble']),
  Message: pick(['Message', 'MessageOutlined', 'ChatBubbleOutline']),
  Send: pick(['Send', 'SendRounded', 'SendOutlined']),
  SendRounded: pick(['SendRounded', 'Send']),
  Mail: pick(['Mail', 'MailOutline', 'Email']),
  Email: pick(['Email', 'EmailOutlined', 'Mail']),
  MailOutlined: pick(['MailOutlined', 'MailOutline', 'Mail']),

  // Time & Calendar
  AccessTime: pick(['AccessTime', 'AccessTimeOutlined', 'Schedule']),
  Clock: pick(['AccessTime', 'AccessTimeOutlined', 'Schedule']),
  AlarmOutlined: pick(['AlarmOutlined', 'Alarm']),
  CalendarToday: pick(['CalendarToday', 'CalendarTodayOutlined', 'CalendarMonth']),
  CalendarTodayOutlined: pick(['CalendarTodayOutlined', 'CalendarToday']),
  CalendarMonth: pick(['CalendarMonth', 'CalendarMonthOutlined', 'CalendarToday']),
  HourglassBottom: pick(['HourglassBottom', 'HourglassEmpty']),
  EventNote: pick(['EventNote', 'EventNoteOutlined', 'CalendarToday']),

  // Maps & Location
  Map: pick(['Map', 'MapOutlined']),
  MapOutlined: pick(['MapOutlined', 'Map']),
  LocationOn: pick(['LocationOn', 'LocationOnOutlined', 'Place']),
  LocationOnOutlined: pick(['LocationOnOutlined', 'LocationOn']),
  Directions: pick(['Directions', 'DirectionsOutlined']),
  TravelExplore: pick(['TravelExplore', 'TravelExploreOutlined', 'Explore']),
  TravelExploreOutlined: pick(['TravelExploreOutlined', 'TravelExplore']),
  Explore: pick(['Explore', 'ExploreOutlined', 'TravelExplore']),
  ExploreOutlined: pick(['ExploreOutlined', 'Explore']),
  FlightTakeoff: pick(['FlightTakeoff', 'FlightTakeoffOutlined', 'Flight']),
  Luggage: pick(['Luggage', 'LuggageOutlined', 'WorkOutline']),
  Backpack: pick(['Backpack', 'BackpackOutlined', 'Luggage']),
  GpsFixed: pick(['GpsFixed', 'GpsFixedOutlined', 'MyLocation']),

  // Media, Photos & Code
  PhotoCamera: pick(['PhotoCamera', 'PhotoCameraOutlined', 'CameraAltOutlined']),
  PhotoLibrary: pick(['PhotoLibrary', 'PhotoLibraryOutlined', 'Collections']),
  PhotoLibraryOutlined: pick(['PhotoLibraryOutlined', 'PhotoLibrary']),
  Image: pick(['Image', 'ImageOutlined']),
  WallpaperOutlined: pick(['WallpaperOutlined', 'Wallpaper', 'ImageOutlined']),
  Code: pick(['Code', 'CodeOutlined']),
  SmartToy: pick(['SmartToy', 'SmartToyOutlined', 'SmartToyRounded']),
  SmartToyRounded: pick(['SmartToyRounded', 'SmartToy']),
  AutoAwesome: pick(['AutoAwesome', 'AutoAwesomeOutlined', 'Star']),
  Sparkles: pick(['AutoAwesome', 'AutoAwesomeOutlined']),
  LiveTv: pick(['LiveTv', 'LiveTvOutlined', 'Tv']),
  MovieOutlined: pick(['MovieOutlined', 'Movie', 'Theaters']),
  YouTube: pick(['YouTube', 'PlayArrow']),
  Instagram: pick(['Instagram', 'CameraAltOutlined']),
  WhatsApp: pick(['WhatsApp', 'Phone']),
  Telegram: pick(['Telegram', 'Send']),
  Twitter: pick(['Twitter']),

  // Status, Alert & Security
  Info: pick(['Info', 'InfoOutlined']),
  InfoOutlined: pick(['InfoOutlined', 'Info']),
  Warning: pick(['Warning', 'WarningAmber', 'WarningAmberRounded']),
  WarningAmber: pick(['WarningAmber', 'WarningAmberRounded', 'Warning']),
  WarningAmberRounded: pick(['WarningAmberRounded', 'WarningAmber']),
  ErrorOutline: pick(['ErrorOutline', 'Error']),
  ReportProblem: pick(['ReportProblem', 'ReportProblemOutlined']),
  Shield: pick(['Shield', 'ShieldOutlined', 'Security']),
  ShieldOutlined: pick(['ShieldOutlined', 'Shield', 'Security']),
  Lock: pick(['Lock', 'LockOutlined']),
  LockOutlined: pick(['LockOutlined', 'Lock']),
  VpnKey: pick(['VpnKey', 'VpnKeyOutlined', 'Key']),
  Visibility: pick(['Visibility', 'VisibilityOutlined']),
  VisibilityOff: pick(['VisibilityOff', 'VisibilityOffOutlined']),
  Block: pick(['Block', 'BlockOutlined']),
  BlockOutlined: pick(['BlockOutlined', 'Block']),

  // Weather & Elements
  WbSunny: pick(['WbSunny', 'WbSunnyOutlined', 'LightMode']),
  WbSunnyOutlined: pick(['WbSunnyOutlined', 'WbSunny', 'LightModeOutlined']),
  Brightness4: pick(['Brightness4', 'DarkMode', 'WbSunnyOutlined']),
  Brightness4Icon: pick(['Brightness4', 'DarkMode', 'WbSunnyOutlined']),
  Cloud: pick(['Cloud', 'CloudOutlined']),
  AcUnit: pick(['AcUnit', 'AcUnitOutlined']),
  Thunderstorm: pick(['Thunderstorm', 'ThunderstormOutlined', 'FlashOn']),
  FlashlightOnOutlined: pick(['FlashlightOnOutlined', 'FlashlightOn', 'Bolt']),
  ElectricBolt: pick(['ElectricBolt', 'Bolt', 'FlashOn']),
  FlashOffRounded: pick(['FlashOffRounded', 'FlashOff']),

  // Links, Documents & Utils
  Link: pick(['Link', 'LinkOutlined', 'AttachFile']),
  LinkIcon: pick(['Link', 'LinkOutlined']),
  LinkOutlined: pick(['LinkOutlined', 'Link']),
  AddLink: pick(['AddLink', 'AddLinkOutlined', 'Link']),
  AddLinkIcon: pick(['AddLink', 'AddLinkOutlined', 'Link']),
  AddLinkOutlined: pick(['AddLinkOutlined', 'AddLink']),
  ContentCopy: pick(['ContentCopy', 'ContentCopyOutlined']),
  ContentCopyOutlined: pick(['ContentCopyOutlined', 'ContentCopy']),
  OpenInNew: pick(['OpenInNew', 'OpenInNewOutlined', 'Launch']),
  DownloadOutlined: pick(['DownloadOutlined', 'Download', 'FileDownloadOutlined']),
  DriveFolderUpload: pick(['DriveFolderUpload', 'DriveFolderUploadOutlined', 'FolderOpen']),
  LayersOutlined: pick(['LayersOutlined', 'Layers']),
  EngineeringOutlined: pick(['EngineeringOutlined', 'Engineering', 'Build']),
  Settings: pick(['Settings', 'SettingsOutlined']),
  SettingsOutlined: pick(['SettingsOutlined', 'Settings']),
  PaletteOutlined: pick(['PaletteOutlined', 'Palette']),
  FormatSizeOutlined: pick(['FormatSizeOutlined', 'FormatSize']),
  FormatBold: pick(['FormatBold', 'FormatBoldOutlined']),
  FormatItalic: pick(['FormatItalic', 'FormatItalicOutlined']),
  LanguageOutlined: pick(['LanguageOutlined', 'Language', 'Public']),
  Language: pick(['Language', 'LanguageOutlined', 'Public']),
  FeedbackOutlined: pick(['FeedbackOutlined', 'Feedback']),
  HelpOutline: pick(['HelpOutline', 'Help', 'HelpOutlineOutlined']),
  NotificationsActive: pick(['NotificationsActive', 'NotificationsActiveOutlined']),
  NotificationsNone: pick(['NotificationsNone', 'NotificationsNoneOutlined', 'Notifications']),
  NotificationsNoneOutlined: pick(['NotificationsNoneOutlined', 'NotificationsNone']),
  RocketLaunch: pick(['RocketLaunch', 'RocketLaunchOutlined', 'Rocket']),
  Favorite: pick(['Favorite', 'FavoriteBorder']),
  FavoriteBorder: pick(['FavoriteBorder', 'FavoriteBorderOutlined']),
  Bookmark: pick(['Bookmark', 'BookmarkBorder', 'BookmarkOutlined']),
  BookmarkBorder: pick(['BookmarkBorder', 'BookmarkBorderOutlined']),
  CategoryOutlined: pick(['CategoryOutlined', 'Category']),
  RestaurantOutlined: pick(['RestaurantOutlined', 'Restaurant']),
  LocalMallOutlined: pick(['LocalMallOutlined', 'LocalMall', 'ShoppingBag']),
  LocalHospitalOutlined: pick(['LocalHospitalOutlined', 'LocalHospital']),
  SchoolOutlined: pick(['SchoolOutlined', 'School']),
  EmojiEventsOutlined: pick(['EmojiEventsOutlined', 'EmojiEvents', 'EmojiEventsRounded']),
  LocalGasStationOutlined: pick(['LocalGasStationOutlined', 'LocalGasStation']),
  LocalAtmOutlined: pick(['LocalAtmOutlined', 'LocalAtm', 'CreditCard']),
  AccountBalanceWalletOutlined: pick(['AccountBalanceWalletOutlined', 'AccountBalanceWallet']),
  Logout: pick(['Logout', 'LogoutOutlined']),
  QrCode: pick(['QrCode', 'QrCode2', 'QrCodeScanner']),
  QrCode2Outlined: pick(['QrCode2Outlined', 'QrCode2']),
  QrCodeScanner: pick(['QrCodeScanner', 'QrCodeScannerOutlined']),
  Home: pick(['Home', 'HomeOutlined']),
  HomeOutlined: pick(['HomeOutlined', 'Home']),
  StickyNote2: pick(['StickyNote2', 'StickyNote2Outlined', 'Note']),
  StickyNote2Outlined: pick(['StickyNote2Outlined', 'StickyNote2']),
  Notes: pick(['Notes', 'NotesOutlined', 'StickyNote2']),
  SwapVert: pick(['SwapVert', 'SwapVertOutlined']),
  CloudUpload: pick(['CloudUpload', 'CloudUploadOutlined']),
  Calculate: pick(['Calculate', 'CalculateOutlined']),
  Timeline: pick(['Timeline', 'TimelineOutlined']),
  TimelineIcon: pick(['Timeline', 'TimelineOutlined']),
  ListAlt: pick(['ListAlt', 'ListAltOutlined']),
  PlaylistAddCheck: pick(['PlaylistAddCheck', 'PlaylistAddCheckOutlined', 'ListAlt']),
  Public: pick(['Public', 'PublicOutlined']),
  PeopleOutline: pick(['PeopleOutline', 'People', 'GroupOutlined']),
  PersonOffOutlined: pick(['PersonOffOutlined', 'PersonOff', 'Block']),
  PersonOff: pick(['PersonOff', 'PersonOffOutlined', 'Block']),
  Circle: pick(['Circle', 'CircleOutlined']),
  WifiTethering: pick(['WifiTethering', 'WifiTetheringOutlined']),
  BroadcastOnPersonal: pick(['BroadcastOnPersonal', 'BroadcastOnPersonalOutlined']),
  TrendingUp: pick(['TrendingUp', 'TrendingUpOutlined']),
  History: pick(['History', 'HistoryOutlined']),
  MedicalInformation: pick(['MedicalInformation', 'MedicalInformationOutlined', 'LocalHospital']),
  Newspaper: pick(['Newspaper', 'NewspaperOutlined', 'Article']),
};

const exportsObj = new Proxy(
  {},
  {
    get: (target, prop) => {
      if (typeof prop !== 'string') return undefined;
      if (target[prop]) return target[prop];

      // Normalize prop to match MUI icon names
      const cleanName = prop.replace(/Icon$/, '');
      const muiKey = Object.keys(M).find(
        (k) =>
          k.toLowerCase() === prop.toLowerCase() ||
          k.toLowerCase() === cleanName.toLowerCase() ||
          k.toLowerCase() === `${cleanName}outlined`.toLowerCase() ||
          k.toLowerCase() === `${cleanName}rounded`.toLowerCase()
      );

      const Comp = map[prop] || map[cleanName] || (muiKey ? M[muiKey] : null) || M.HelpOutline || M.Circle;
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
  LabelOutlined,
  FilterList,
  Tune,
  TuneIcon,
  Straighten,
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
  EventNote,
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
  GpsFixed,
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
  Link,
  LinkIcon,
  LinkOutlined,
  AddLink,
  AddLinkIcon,
  AddLinkOutlined,
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
  PlaylistAddCheck,
  Public,
  PeopleOutline,
  PersonOffOutlined,
  PersonOff,
  Brightness4,
  Brightness4Icon,
  TrendingUp,
  History,
  MedicalInformation,
  Newspaper,
} = exportsObj;
