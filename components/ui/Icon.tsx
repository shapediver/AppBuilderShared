import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	MantineThemeComponent,
	parseThemeColor,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import {
	Icon as _TablerIconType,
	IconAdjustments,
	IconAdjustmentsHorizontal,
	IconAlertCircle,
	IconArrowBack,
	IconArrowDown,
	IconArrowForward,
	IconArrowLeft,
	IconArrowRight,
	IconArrowUp,
	IconAugmentedReality,
	IconAugmentedRealityOff,
	IconBookmark,
	IconBookmarkOff,
	IconBookmarks,
	IconBookmarksOff,
	IconBooks,
	IconBooksOff,
	IconCamera,
	IconCameraOff,
	IconCancel,
	IconCheck,
	IconChevronLeft,
	IconChevronRight,
	IconCircleOff,
	IconCopy,
	IconDeviceDesktop,
	IconDeviceDesktopDown,
	IconDeviceDesktopUp,
	IconDeviceFloppy,
	IconDeviceTv,
	IconDots,
	IconDotsVertical,
	IconDownload,
	IconDownloadOff,
	IconEye,
	IconEyeOff,
	IconFileDownload,
	IconFileExport,
	IconFileImport,
	IconHandFinger,
	IconInfoCircleFilled,
	IconKey,
	IconKeyOff,
	IconLink,
	IconLinkOff,
	IconLockSquare,
	IconMailForward,
	IconMaximize,
	IconMaximizeOff,
	IconMoonStars,
	IconNetwork,
	IconNetworkOff,
	IconPaperclip,
	IconPencil,
	IconPhoto,
	IconPhotoOff,
	IconRefresh,
	IconRefreshOff,
	IconReload,
	IconReplace,
	IconSettings,
	IconShare,
	IconShare2,
	IconShare3,
	IconShareOff,
	IconShoppingCartPlus,
	IconSun,
	IconTag,
	IconTagOff,
	IconTags,
	IconTagsOff,
	IconTagStarred,
	IconThumbDown,
	IconThumbUp,
	IconUpload,
	IconUser,
	IconUserCheck,
	IconUserOff,
	IconUserQuestion,
	IconUsers,
	IconUsersGroup,
	IconVideo,
	IconVideoOff,
	IconWorld,
	IconWorldOff,
	IconX,
	IconZoomIn,
	IconZoomScan,
	IconProps as TablerIconProps,
} from "@tabler/icons-react";
import React, {forwardRef} from "react";

export interface IconProps extends TablerIconProps {
	type: IconTypeEnum;
}

const defaultStyleProps: Partial<TablerIconProps> = {
	size: "1.5rem",
	stroke: 1,
};

type IconThemePropsType = Partial<TablerIconProps>;

export function IconThemeProps(
	props: IconThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export function useIconProps(props: Partial<TablerIconProps>): TablerIconProps {
	return useProps("Icon", defaultStyleProps, props);
}

const Icon = forwardRef<_TablerIconType, IconProps>(function Icon(
	{type, size, stroke, color, ...rest}: IconProps,
	ref,
) {
	const theme = useMantineTheme();

	const iconPropsStyle = useIconProps({size, stroke, color});
	const parsedColor = iconPropsStyle.color
		? parseThemeColor({color: iconPropsStyle.color, theme}).value
		: iconPropsStyle.color;
	const iconProps = {...iconPropsStyle, ref, color: parsedColor, ...rest};

	switch (type) {
		case IconTypeEnum.Adjustments:
			return <IconAdjustments {...iconProps} />;
		case IconTypeEnum.AdjustmentsHorizontal:
			return <IconAdjustmentsHorizontal {...iconProps} />;
		case IconTypeEnum.AlertCircle:
			return <IconAlertCircle {...iconProps} />;
		case IconTypeEnum.ArrowBack:
			return <IconArrowBack {...iconProps} />;
		case IconTypeEnum.ArrowDown:
			return <IconArrowDown {...iconProps} />;
		case IconTypeEnum.ArrowForward:
			return <IconArrowForward {...iconProps} />;
		case IconTypeEnum.ArrowLeft:
			return <IconArrowLeft {...iconProps} />;
		case IconTypeEnum.ArrowRight:
			return <IconArrowRight {...iconProps} />;
		case IconTypeEnum.ArrowUp:
			return <IconArrowUp {...iconProps} />;
		case IconTypeEnum.AugmentedReality:
			return <IconAugmentedReality {...iconProps} />;
		case IconTypeEnum.AugmentedRealityOff:
			return <IconAugmentedRealityOff {...iconProps} />;
		case IconTypeEnum.Bookmark:
			return <IconBookmark {...iconProps} />;
		case IconTypeEnum.BookmarkOff:
			return <IconBookmarkOff {...iconProps} />;
		case IconTypeEnum.Bookmarks:
			return <IconBookmarks {...iconProps} />;
		case IconTypeEnum.BookmarksOff:
			return <IconBookmarksOff {...iconProps} />;
		case IconTypeEnum.Books:
			return <IconBooks {...iconProps} />;
		case IconTypeEnum.BooksOff:
			return <IconBooksOff {...iconProps} />;
		case IconTypeEnum.Camera:
			return <IconCamera {...iconProps} />;
		case IconTypeEnum.CameraOff:
			return <IconCameraOff {...iconProps} />;
		case IconTypeEnum.Cancel:
			return <IconCancel {...iconProps} />;
		case IconTypeEnum.Check:
			return <IconCheck {...iconProps} />;
		case IconTypeEnum.CircleOff:
			return <IconCircleOff {...iconProps} />;
		case IconTypeEnum.Copy:
			return <IconCopy {...iconProps} />;
		case IconTypeEnum.DeviceDesktop:
			return <IconDeviceDesktop {...iconProps} />;
		case IconTypeEnum.DeviceDesktopDown:
			return <IconDeviceDesktopDown {...iconProps} />;
		case IconTypeEnum.DeviceDesktopUp:
			return <IconDeviceDesktopUp {...iconProps} />;
		case IconTypeEnum.DeviceFloppy:
			return <IconDeviceFloppy {...iconProps} />;
		case IconTypeEnum.DeviceTV:
			return <IconDeviceTv {...iconProps} />;
		case IconTypeEnum.Dots:
			return <IconDots {...iconProps} />;
		case IconTypeEnum.DotsVertical:
			return <IconDotsVertical {...iconProps} />;
		case IconTypeEnum.Download:
			return <IconDownload {...iconProps} />;
		case IconTypeEnum.DownloadOff:
			return <IconDownloadOff {...iconProps} />;
		case IconTypeEnum.Eye:
			return <IconEye {...iconProps} />;
		case IconTypeEnum.EyeOff:
			return <IconEyeOff {...iconProps} />;
		case IconTypeEnum.FileDownload:
			return <IconFileDownload {...iconProps} />;
		case IconTypeEnum.FileExport:
			return <IconFileExport {...iconProps} />;
		case IconTypeEnum.FileImport:
			return <IconFileImport {...iconProps} />;
		case IconTypeEnum.IconHandFinger:
			return <IconHandFinger {...iconProps} />;
		case IconTypeEnum.IconInfoCircleFilled:
			return <IconInfoCircleFilled {...iconProps} />;
		case IconTypeEnum.Key:
			return <IconKey {...iconProps} />;
		case IconTypeEnum.KeyOff:
			return <IconKeyOff {...iconProps} />;
		case IconTypeEnum.Link:
			return <IconLink {...iconProps} />;
		case IconTypeEnum.LinkOff:
			return <IconLinkOff {...iconProps} />;
		case IconTypeEnum.LockSquare:
			return <IconLockSquare {...iconProps} />;
		case IconTypeEnum.MailFoward:
			return <IconMailForward {...iconProps} />;
		case IconTypeEnum.Maximize:
			return <IconMaximize {...iconProps} />;
		case IconTypeEnum.MaximizeOff:
			return <IconMaximizeOff {...iconProps} />;
		case IconTypeEnum.MoonStars:
			return <IconMoonStars {...iconProps} />;
		case IconTypeEnum.Network:
			return <IconNetwork {...iconProps} />;
		case IconTypeEnum.NetworkOff:
			return <IconNetworkOff {...iconProps} />;
		case IconTypeEnum.PaperClip:
			return <IconPaperclip {...iconProps} />;
		case IconTypeEnum.Pencil:
			return <IconPencil {...iconProps} />;
		case IconTypeEnum.Photo:
			return <IconPhoto {...iconProps} />;
		case IconTypeEnum.PhotoOff:
			return <IconPhotoOff {...iconProps} />;
		case IconTypeEnum.Refresh:
			return <IconRefresh {...iconProps} />;
		case IconTypeEnum.RefreshOff:
			return <IconRefreshOff {...iconProps} />;
		case IconTypeEnum.Reload:
			return <IconReload {...iconProps} />;
		case IconTypeEnum.Replace:
			return <IconReplace {...iconProps} />;
		case IconTypeEnum.Settings:
			return <IconSettings {...iconProps} />;
		case IconTypeEnum.Share:
			return <IconShare {...iconProps} />;
		case IconTypeEnum.Share2:
			return <IconShare2 {...iconProps} />;
		case IconTypeEnum.Share3:
			return <IconShare3 {...iconProps} />;
		case IconTypeEnum.ShareOff:
			return <IconShareOff {...iconProps} />;
		case IconTypeEnum.ChevronLeft:
			return <IconChevronLeft {...iconProps} />;
		case IconTypeEnum.ChevronRight:
			return <IconChevronRight {...iconProps} />;
		case IconTypeEnum.ShoppingCartPlus:
			return <IconShoppingCartPlus {...iconProps} />;
		case IconTypeEnum.Sun:
			return <IconSun {...iconProps} />;
		case IconTypeEnum.Tag:
			return <IconTag {...iconProps} />;
		case IconTypeEnum.TagOff:
			return <IconTagOff {...iconProps} />;
		case IconTypeEnum.TagStarred:
			return <IconTagStarred {...iconProps} />;
		case IconTypeEnum.Tags:
			return <IconTags {...iconProps} />;
		case IconTypeEnum.TagsOff:
			return <IconTagsOff {...iconProps} />;
		case IconTypeEnum.ThumbDown:
			return <IconThumbDown {...iconProps} />;
		case IconTypeEnum.ThumbUp:
			return <IconThumbUp {...iconProps} />;
		case IconTypeEnum.Upload:
			return <IconUpload {...iconProps} />;
		case IconTypeEnum.User:
			return <IconUser {...iconProps} />;
		case IconTypeEnum.UserCheck:
			return <IconUserCheck {...iconProps} />;
		case IconTypeEnum.UserOff:
			return <IconUserOff {...iconProps} />;
		case IconTypeEnum.UserQuestion:
			return <IconUserQuestion {...iconProps} />;
		case IconTypeEnum.Users:
			return <IconUsers {...iconProps} />;
		case IconTypeEnum.UsersGroup:
			return <IconUsersGroup {...iconProps} />;
		case IconTypeEnum.Video:
			return <IconVideo {...iconProps} />;
		case IconTypeEnum.VideoOff:
			return <IconVideoOff {...iconProps} />;
		case IconTypeEnum.World:
			return <IconWorld {...iconProps} />;
		case IconTypeEnum.WorldOff:
			return <IconWorldOff {...iconProps} />;
		case IconTypeEnum.X:
			return <IconX {...iconProps} />;
		case IconTypeEnum.ZoomIn:
			return <IconZoomIn {...iconProps} />;
		case IconTypeEnum.ZoomScan:
			return <IconZoomScan {...iconProps} />;
		default:
			return null;
	}
});

export default Icon;
