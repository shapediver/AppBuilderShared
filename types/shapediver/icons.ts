/**
 * Types of icons
 * @see https://tabler.io/icons
 */
export enum IconTypeEnum {
	Adjustments = "adjustments",
	AdjustmentsHorizontal = "adjustments-horizontal",
	AlertCircle = "alert-circle",
	ArrowBack = "arrow-back",
	ArrowBackUp = "arrow-back-up",
	ArrowDown = "arrow-down",
	ArrowForward = "arrow-forward",
	ArrowForwardUp = "arrow-forward-up",
	ArrowLeft = "arrow-left",
	ArrowRight = "arrow-right",
	ArrowUp = "arrow-up",
	AugmentedReality = "augmented-reality",
	AugmentedRealityOff = "augmented-reality-off",
	Bookmark = "bookmark",
	BookmarkOff = "bookmark-off",
	Bookmarks = "bookmarks",
	BookmarksOff = "bookmarks-off",
	Books = "books",
	BooksOff = "books-off",
	Camera = "camera",
	CameraOff = "camera-off",
	Cancel = "cancel",
	Check = "check",
	CircleOff = "circle-off",
	ClockHour4 = "clock-hour-4",
	Copy = "copy",
	DeviceDesktop = "device-desktop",
	DeviceDesktopDown = "device-desktop-down",
	DeviceDesktopUp = "device-desktop-up",
	DeviceFloppy = "device-floppy",
	DeviceTV = "device-tv",
	Dots = "dots",
	DotsVertical = "dots-vertical",
	Download = "download",
	DownloadOff = "download-off",
	ExclamationMark = "exclamation-mark",
	Eye = "eye",
	EyeOff = "eye-off",
	FileDownload = "file-download",
	FileExport = "file-export",
	FileImport = "file-import",
	IconHandFinger = "icon-hand-finger",
	IconInfoCircleFilled = "icon-info-circle-filled",
	Key = "key",
	KeyOff = "key-off",
	Link = "link",
	LinkOff = "link-off",
	LockSquare = "lock-square",
	MailForward = "mail-forward",
	Maximize = "maximize",
	MaximizeOff = "maximize-off",
	MoonStars = "moon-stars",
	Network = "network",
	NetworkOff = "network-off",
	PaperClip = "paper-clip",
	Pencil = "pencil",
	Photo = "photo",
	PhotoOff = "photo-off",
	Refresh = "refresh",
	RefreshOff = "refresh-off",
	Reload = "reload",
	Replace = "replace",
	Settings = "settings",
	Share = "share",
	Share2 = "share-2",
	Share3 = "share-3",
	ShareOff = "share-off",
	ChevronLeft = "chevron-left",
	ChevronRight = "chevron-right",
	ShoppingCartPlus = "shopping-cart-plus",
	Sun = "sun",
	Tag = "tag",
	TagOff = "tag-off",
	TagStarred = "tag-starred",
	Tags = "tags",
	TagsOff = "tags-off",
	ThumbDown = "thumb-down",
	ThumbUp = "thumb-up",
	Upload = "upload",
	User = "user",
	UserCheck = "user-check",
	UserOff = "user-off",
	UserQuestion = "user-question",
	Users = "users",
	UsersGroup = "users-group",
	Video = "video",
	VideoOff = "video-off",
	World = "world",
	WorldOff = "world-off",
	X = "x",
	ZoomIn = "zoom-in",
	ZoomScan = "zoom-scan",
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const IconTypeEnumType = {
	...IconTypeEnum,
};

export type IconType = (typeof IconTypeEnumType)[keyof typeof IconTypeEnumType];
