/**
 * @jest-environment jsdom
 */
jest.mock("../AppBuilderActionBase", () => {
	const React = jest.requireActual("react") as typeof import("react");
	return {
		__esModule: true,
		default: ({
			buttonRef,
			label,
		}: {
			buttonRef?: React.Ref<HTMLButtonElement>;
			label?: string;
		}) =>
			React.createElement(
				"button",
				{ref: buttonRef, type: "button"},
				label ?? "Open container",
			),
	};
});

import {useViewportAnchorTriggerRegistry} from "@AppBuilderLib/entities/viewport-anchor/model/useViewportAnchorTriggerRegistry";
import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {render} from "@testing-library/react";
import {createElement} from "react";
import AppBuilderActionSetContainerVisibilityComponent from "../AppBuilderActionSetContainerVisibilityComponent";

describe("AppBuilderActionSetContainerVisibilityComponent trigger", () => {
	beforeEach(() => {
		useViewportAnchorTriggerRegistry.setState({triggers: {}});
	});

	function renderButton() {
		return render(
			createElement(AppBuilderActionSetContainerVisibilityComponent, {
				container: {
					name: AppBuilderContainerNameType.Anchor2d,
					props: {id: "panel-a"},
				},
				mode: "open",
			}),
		);
	}

	it("clears the anchor trigger on unmount when this button still owns it", () => {
		const view = renderButton();
		const button = view.getByRole("button");

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBe(button);

		view.unmount();

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBeNull();
	});

	it("leaves the trigger in place when another button has taken the anchor", () => {
		const view = renderButton();
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
