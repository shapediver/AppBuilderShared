import {ComponentContext} from "@AppBuilderLib/shared/lib/ComponentContext";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import ModelCardOverlayWrapper, {
	ModelCardOverlayWrapperThemePropsType,
} from "@AppBuilderShared/components/shapediver/platform/ModelCardOverlayWrapper";
import ToggleIcon from "@AppBuilderShared/components/ui/ToggleIcon";
import {TModelItem} from "@AppBuilderShared/types/store/shapediverStorePlatformModels";
import {Avatar} from "@mantine/core";
import React, {useContext, useMemo} from "react";

export type ModelCardOverlayPropsType = {
	/** If true, show the model's bookmark status. Defaults to false. */
	showBookmark?: boolean;
	/** If true, show information about the owner of the model. Defaults to true. */
	showUser?: boolean;
	/** Model to be displayed */
	item: TModelItem;
} & ModelCardOverlayWrapperThemePropsType;

export default function ModelCardOverlay(props: ModelCardOverlayPropsType) {
	const {
		item: {data: model, actions},
		showBookmark = false,
		showUser = true,
		...overlayProps
	} = props;

	const displayBookmark = showBookmark; // && model.bookmark?.bookmarked;
	const displayUser = showUser && model.user;

	const username = useMemo(() => {
		const user = model.user;
		if (!user) return "unknown user";

		if (user.first_name && user.last_name) {
			return `${user.first_name} ${user.last_name}`;
		}

		return user.username;
	}, [model.user]);

	const userInitials = useMemo(() => {
		const user = model.user;
		if (!user) return "?";

		if (user.first_name && user.last_name) {
			return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
		}

		if (user.username) return user.username.charAt(0);

		return "?";
	}, [model.user]);

	const {modelCardOverlay: {component: CustomModelCardOverlay} = {}} =
		useContext(ComponentContext);

	return (
		<>
			{displayBookmark ? (
				<ModelCardOverlayWrapper {...overlayProps} position="top-left">
					<ToggleIcon
						value={model.bookmark?.bookmarked ?? false}
						iconActive={"tabler:bookmark"}
						iconInactive={"tabler:bookmark-off"}
						onActivate={actions.bookmark}
						onDeactivate={actions.unbookmark}
						tooltipActive="Remove bookmark"
						tooltipInactive="Add bookmark"
						hideInactive={true}
					/>
				</ModelCardOverlayWrapper>
			) : undefined}
			{displayUser ? (
				<ModelCardOverlayWrapper {...overlayProps} position="top-right">
					<TooltipWrapper label={username}>
						{model.user.avatar_url ? (
							<Avatar
								src={model.user.avatar_url}
								alt={username}
							/>
						) : (
							<Avatar>{userInitials}</Avatar>
						)}
					</TooltipWrapper>
				</ModelCardOverlayWrapper>
			) : undefined}
			{CustomModelCardOverlay ? (
				<CustomModelCardOverlay {...props} />
			) : undefined}
		</>
	);
}
