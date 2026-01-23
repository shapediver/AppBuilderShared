import {NotificationStyleProps} from "@AppBuilderShared/types/context/notificationcontext";
import {MantineThemeComponent, useProps} from "@mantine/core";
import React, {useEffect} from "react";
import {useNotificationStore} from "~/shared/shared/model";

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

export function NotificationWrapperThemeProps(
	props: NotificationWrapperThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Initializes notification store with theme-based style props.
 * @param props
 * @returns
 */
export default function NotificationWrapper(
	props: Props & Partial<NotificationStyleProps>,
) {
	const {children = <></>, ...rest} = props;
	const _props = useProps("NotificationWrapper", defaultStyleProps, rest);
	const setStyleProps = useNotificationStore((state) => state.setStyleProps);

	// Initialize store with style props from theme
	useEffect(() => {
		setStyleProps(_props);
	}, [
		_props.errorColor,
		_props.successColor,
		_props.warningColor,
		_props.autoClose,
		setStyleProps,
	]);

	return <>{children}</>;
}
