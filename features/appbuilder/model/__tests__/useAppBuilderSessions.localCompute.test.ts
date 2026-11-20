/**
 * @jest-environment jsdom
 */
import {renderHook} from "@testing-library/react";

const resolveMock = jest.fn();
jest.mock("../useResolveAppBuilderSessions", () => ({
	__esModule: true,
	default: (...args: unknown[]) => resolveMock(...args),
}));

const saveReloadMock = jest.fn();
jest.mock("../useLocalComputeSaveReload", () => ({
	useLocalComputeSaveReload: (urls: unknown) => saveReloadMock(urls),
}));

jest.mock("@AppBuilderLib/shared/lib/useEventTracking", () => ({
	useEventTracking: () => ({}),
}));

jest.mock(
	"@AppBuilderLib/entities/session/model/useShapeDiverStoreSession",
	() => ({
		useShapeDiverStoreSession: {
			getState: () => ({
				sessions: {},
				pendingSessions: {},
				createSession: jest.fn(async () => undefined),
				closeSession: jest.fn(),
			}),
		},
	}),
);

jest.mock(
	"@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters",
	() => ({
		useShapeDiverStoreParameters: {
			getState: () => ({addSession: jest.fn(), removeSession: jest.fn()}),
		},
	}),
);

import {IAppBuilder} from "../../config/appbuilder";
import {useAppBuilderSessions} from "../useAppBuilderSessions";

describe("useAppBuilderSessions with a local controller", () => {
	it("passes the controller to the resolve step and watches the local server a session was opened from", () => {
		resolveMock.mockReturnValue({
			sessions: [
				{
					id: "chair",
					slug: "chair",
					ticket: "chair-ticket",
					modelViewUrl: "http://127.0.0.1:5002",
				},
			],
			error: undefined,
			resolveErrors: [],
		});
		const controller = {
			modelViewUrl: "http://127.0.0.1:5001",
			ticket: "table-ticket",
		};
		const appBuilderData = {
			version: "1.0",
			sessions: [{sessionId: "chair"}],
		} as unknown as IAppBuilder;

		renderHook(() =>
			useAppBuilderSessions({
				namespace: "table",
				appBuilderData,
				controller,
			}),
		);

		expect(resolveMock).toHaveBeenCalledWith(
			[expect.objectContaining({id: "chair", slug: "chair"})],
			false,
			true,
			controller,
		);
		expect(saveReloadMock).toHaveBeenLastCalledWith([
			"http://127.0.0.1:5002",
		]);
	});
});
