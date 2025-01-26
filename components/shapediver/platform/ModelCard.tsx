import { Anchor, Card, Group, Image, Pill, px, Text } from "@mantine/core";
import classes from "./ModelCard.module.css";
import React, { useMemo } from "react";
import { TModelItem } from "@AppBuilderShared/types/store/shapediverStorePlatformModels";
import ModelCardOverlay from "@AppBuilderShared/components/shapediver/platform/ModelCardOverlay";
import ModelStatusIcon from "@AppBuilderShared/components/shapediver/platform/ModelStatusIcon";

export interface IModelCardProps {
	/** If true, show information about the owner of the model. Defaults to true. */
	showUser?: boolean
	/** If true, show the model's organization confirmation status. Defaults to false. */
	showConfirmationStatus?: boolean
	/** If true, allow updating the model's organization confirmation status. Defaults to false. */
	enableConfirmationStatusUpdate?: boolean,
	/** If true, show the model's tags. Defaults to true. */
	showTags?: boolean
	/** If true, show the model's bookmark status. Defaults to false. */
	showBookmark?: boolean
}

interface Props extends IModelCardProps {
	/** Model to be displayed */
	item: TModelItem,
	/** Optional link */
	href?: string
	/** Target for the link */
	target?: string
}

export default function ModelCard(props: Props) {

	const {
		item,
		href,
		target,
		showUser = true,
		showConfirmationStatus,
		enableConfirmationStatusUpdate,
		showTags = true,
		showBookmark,
	} = props;

	const model = item.data;

	const username = useMemo(() => {
		const user = model.user;
		if (!user) return "unknown user";

		if (user.first_name && user.last_name) {
			return `${user.first_name} ${user.last_name}`;
		}

		return user.username;
	}, [model.user]);

	return <Card w="18em">
		<Card.Section>
			<Anchor href={href} target={target}>
				<Image
					src={model.thumbnail_url}
					height={px("12em")}
					alt={model.title}
					fallbackSrc="data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjREREREREIi8+PHBhdGggZmlsbD0iIzk5OTk5OSIgZD0ibTEwLjgzIDkuODY1IDEuNzUgMi43aC0xLjE5cS0uMTMgMC0uMjItLjA3LS4wOC0uMDctLjEzLS4xNmwtMS4wOS0xLjc5cS0uMDIuMDktLjA2LjE3LS4wMy4wNy0uMDcuMTNsLS45NiAxLjQ5cS0uMDUuMDktLjEzLjE2dC0uMi4wN0g3LjQybDEuNzYtMi42NS0xLjY5LTIuNDhoMS4xOXEuMTQgMCAuMi4wNC4wNy4wNC4xMi4xMmwxLjA3IDEuNzFxLjA2LS4xNy4xNi0uMzRsLjg2LTEuMzVxLjExLS4xOC4yOS0uMThoMS4xM2wtMS42OCAyLjQzWiIvPjwvc3ZnPg=="
				/>
				<ModelCardOverlay item={item} showBookmark={showBookmark} showUser={showUser} />
			</Anchor>
		</Card.Section>
		<Group justify="space-between" pt="sm" wrap="nowrap">
			<Anchor href={href} target={target} underline="never">
				<Text size="md" fw={500} lineClamp={1} className={classes.title}>{model.title}</Text>
			</Anchor>
			<ModelStatusIcon item={item}
				showConfirmationStatus={showConfirmationStatus}
				enableConfirmationStatusUpdate={enableConfirmationStatusUpdate}
				className={classes.icon} />
		</Group>
		{ showUser ?
			<Group justify="space-between" wrap="nowrap">
				<Text lineClamp={1} size="sm">
					by {username}
				</Text>
			</Group> : undefined
		}
		{ showTags && model.tags?.length ?
			<Group justify="flex-start" wrap="nowrap" pt="sm" className={classes.tagsContainer} >
				{model.tags.map((tag, index) => <Pill key={index} size="sm">{tag.name}</Pill>)}
			</Group> : undefined
		}
	</Card>;
}
