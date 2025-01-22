import { createNotificationsWithDefaults, NotificationContext } from "@AppBuilderShared/context/NotificationContext";
import { NotificationStyleProps } from "@AppBuilderShared/types/context/notificationcontext";
import { MantineThemeComponent, useProps } from "@mantine/core";
import React, { useMemo } from "react";

interface Props {
	children?: React.ReactNode;
}

const defaultStyleProps: NotificationStyleProps = {
	errorColor: "red",
	warningColor: "yellow",
	successColor: undefined,
	autoClose: 20000,
};

type NotificationWrapperThemePropsType = Partial<NotificationStyleProps>;

export function NotificationWrapperThemeProps(props: NotificationWrapperThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Provides a context for notifications, styled according to the theme.
 * @param props 
 * @returns 
 */
export default function NotificationWrapper(props: Props & Partial<NotificationStyleProps>) {

	const { children = <></>, ...rest } = props;
	const _props = useProps("NotificationWrapper", defaultStyleProps, rest);

	const notificationsWithDefaults = useMemo(
		() => createNotificationsWithDefaults(_props), 
		[_props.errorColor, _props.successColor]
	);

	return <NotificationContext.Provider value={notificationsWithDefaults}>
		{ children }
	</NotificationContext.Provider>;
}
