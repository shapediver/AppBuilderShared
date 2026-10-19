/**
 * @jest-environment jsdom
 */
jest.mock("../AppBuilderActionBase", () => {
	const React = jest.requireActual("react") as typeof import("react");
	return {
		__esModule: true,
		default: ({
			onClick,
			disabled,
			label,
			buttonRef,
		}: {
			onClick?: () => void;
			disabled?: boolean;
			label?: string;
			buttonRef?: React.Ref<HTMLButtonElement>;
		}) =>
			React.createElement(
				"button",
				{onClick, disabled, type: "button", ref: buttonRef},
				label ?? "Toggle container",
			),
	};
});

import {useViewportAnchorTriggerRegistry} from "@AppBuilderLib/entities/viewport-anchor/model/useViewportAnchorTriggerRegistry";
import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {render, screen} from "@testing-library/react";
import {createElement} from "react";
import AppBuilderActionSetContainerVisibilityComponent from "../AppBuilderActionSetContainerVisibilityComponent";

const props = {
	container: {
		name: AppBuilderContainerNameType.Anchor2d,
		props: {id: "panel-a"},
	},
	mode: "toggle" as const,
	namespace: "session",
};

describe("AppBuilderActionSetContainerVisibilityComponent", () => {
	beforeEach(() => {
		useViewportAnchorTriggerRegistry.setState({triggers: {}});
	});

	it("clears the trigger on unmount when this button still owns it", () => {
		const view = render(
			createElement(
				AppBuilderActionSetContainerVisibilityComponent,
				props,
			),
		);
		const button = screen.getByRole("button");

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBe(button);

		view.unmount();

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBe(null);
	});

	it("leaves the trigger when another button has taken the anchor", () => {
		const view = render(
			createElement(
				AppBuilderActionSetContainerVisibilityComponent,
				props,
			),
		);
		const other = document.createElement("button");
		useViewportAnchorTriggerRegistry
			.getState()
			.setTrigger("panel-a", other);

		view.unmount();

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBe(other);
	});
});
