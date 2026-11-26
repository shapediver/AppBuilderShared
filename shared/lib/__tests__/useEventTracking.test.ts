/**
 * @jest-environment jsdom
 */
import {renderHook} from "@testing-library/react";
import {useEventTracking} from "../useEventTracking";

const mockError = jest.fn();

jest.mock("@shapediver/viewer.session", () => ({
	isViewerCustomizationError: (e: {errorObject?: unknown}) =>
		!!e?.errorObject,
}));

jest.mock("@shapediver/sdk.geometry-api-sdk-v2", () => ({
	ResComputationStatus: {SUCCESS: "success"},
}));

jest.mock(
	"@AppBuilderLib/features/notifications/model/useNotificationStore",
	() => ({
		useNotificationStore: () => ({error: mockError}),
	}),
);

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {debug: jest.fn(), warn: jest.fn(), error: jest.fn()},
}));

const failed = (msg?: string) => ({
	status_computation: "timeout",
	status_collect: "success",
	msg,
});

const customizationError = (
	message: string,
	outputs: Record<string, unknown>,
	exports: Record<string, unknown> = {},
) => ({message, errorObject: {outputs, exports}});

describe("useEventTracking onError", () => {
	beforeEach(() => mockError.mockClear());

	const notify = (e: unknown) => {
		const {result} = renderHook(() => useEventTracking());
		result.current.onError(e, {namespace: "ns", action: "customize"});
		expect(mockError).toHaveBeenCalledTimes(1);
		return mockError.mock.calls[0][0] as {title: string; message: string};
	};

	it("shows a message shared by several outputs and exports once", () => {
		const {title, message} = notify(
			customizationError(
				"Computation failed",
				{a: failed("Timed out"), b: failed("Timed out")},
				{c: failed("Timed out")},
			),
		);
		expect(message).toBe("Computation failed\nTimed out");
		expect(title).toContain("(timeout)");
	});

	it("keeps distinct messages in order", () => {
		const {message} = notify(
			customizationError("Computation failed", {
				a: failed("First"),
				b: failed("Second"),
				c: failed("First"),
			}),
		);
		expect(message).toBe("Computation failed\nFirst\nSecond");
	});

	it("does not repeat the error message or add an empty line", () => {
		const {message} = notify(
			customizationError("Computation failed", {
				a: failed("Computation failed"),
				b: failed(),
			}),
		);
		expect(message).toBe("Computation failed");
	});
});
