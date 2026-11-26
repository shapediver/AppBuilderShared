/**
 * @jest-environment jsdom
 */
import {renderHook, waitFor} from "@testing-library/react";

const PLATFORM_URL = "https://platform.test";

jest.mock("@AppBuilderLib/shared/lib/platform/environment", () => ({
	getDefaultPlatformUrl: () => "https://platform.test",
	getPlatformClientId: () => "client",
	shouldUsePlatform: () => true,
}));

const modelsGet = jest.fn();
const authenticate = jest.fn();
jest.mock("@AppBuilderLib/shared/model/useShapeDiverStorePlatform", () => ({
	useShapeDiverStorePlatform: (selector: (s: unknown) => unknown) =>
		selector({
			authenticate,
			setCurrentModel: jest.fn(),
			setModelForSession: jest.fn(),
		}),
}));

jest.mock(
	"@AppBuilderLib/features/model-state/model/useShapeDiverStorePlatformSavedStates",
	() => ({
		useShapeDiverStorePlatformSavedStates: (
			selector: (s: unknown) => unknown,
		) => selector({addItem: jest.fn()}),
	}),
);

jest.mock("@modelstorage", () => ({MODELS: {}}));

import {IAppBuilderSettingsJsonSession} from "../../config/appbuilder";
import useResolveAppBuilderSessions from "../useResolveAppBuilderSessions";

const LOCAL_CONTROLLER = {
	modelViewUrl: "http://127.0.0.1:5001",
	ticket: "table-ticket",
};
const PLATFORM_CONTROLLER = {
	modelViewUrl: "https://sdr8euc1.eu-central-1.shapediver.com",
	ticket: "platform-ticket",
};

const fetchMock = jest.fn();

function jsonResponse(status: number, body: unknown) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	};
}

function platformModel(slug: string) {
	return {
		data: {
			settings: {},
			ticket: {ticket: `${slug}-platform-ticket`},
			backend_system: {
				model_view_url: "https://sdr8euc1.eu-central-1.shapediver.com",
			},
			access_token: "jwt",
		},
	};
}

const sessions: IAppBuilderSettingsJsonSession[] = [
	{id: "chair", slug: "chair"},
];

beforeEach(() => {
	jest.clearAllMocks();
	(globalThis as {fetch?: unknown}).fetch = fetchMock;
	authenticate.mockResolvedValue({
		platformUrl: PLATFORM_URL,
		client: {models: {get: modelsGet}},
	});
	modelsGet.mockImplementation(async (slug: string) => platformModel(slug));
});

describe("useResolveAppBuilderSessions with a local controller", () => {
	it("opens a slug served by another local document with its ticket and model view, without the platform", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(200, {
				slug: "chair",
				ticket: "chair-ticket",
				modelViewUrl: "http://127.0.0.1:5002",
			}),
		);

		const {result} = renderHook(() =>
			useResolveAppBuilderSessions(
				sessions,
				false,
				true,
				LOCAL_CONTROLLER,
			),
		);

		await waitFor(() => expect(result.current.sessions).toHaveLength(1));
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(
			"http://127.0.0.1:5001/api/v2/local/resolve?slug=chair",
		);
		expect(init.headers).toEqual({Authorization: "Bearer table-ticket"});
		expect(result.current.sessions![0]).toMatchObject({
			id: "chair",
			slug: "chair",
			ticket: "chair-ticket",
			modelViewUrl: "http://127.0.0.1:5002",
		});
		expect(result.current.sessions![0].jwtToken).toBeUndefined();
		expect(modelsGet).not.toHaveBeenCalled();
	});

	it.each([
		["404", () => fetchMock.mockResolvedValue(jsonResponse(404, {}))],
		["401", () => fetchMock.mockResolvedValue(jsonResponse(401, {}))],
		[
			"a network error",
			() => fetchMock.mockRejectedValue(new TypeError("Failed to fetch")),
		],
	])("falls back to the platform slug on %s", async (_, setup) => {
		setup();

		const {result} = renderHook(() =>
			useResolveAppBuilderSessions(
				sessions,
				false,
				true,
				LOCAL_CONTROLLER,
			),
		);

		await waitFor(() => expect(result.current.sessions).toHaveLength(1));
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(modelsGet).toHaveBeenCalledWith("chair", expect.any(Array));
		expect(result.current.sessions![0]).toMatchObject({
			id: "chair",
			ticket: "chair-platform-ticket",
			jwtToken: "jwt",
		});
	});

	it("never calls the resolve endpoint for a controller on the platform", async () => {
		const {result} = renderHook(() =>
			useResolveAppBuilderSessions(
				sessions,
				false,
				true,
				PLATFORM_CONTROLLER,
			),
		);

		await waitFor(() => expect(result.current.sessions).toHaveLength(1));
		expect(fetchMock).not.toHaveBeenCalled();
		expect(modelsGet).toHaveBeenCalledWith("chair", expect.any(Array));
	});

	it("never calls the resolve endpoint without a controller", async () => {
		const {result} = renderHook(() =>
			useResolveAppBuilderSessions(sessions, false, true),
		);

		await waitFor(() => expect(result.current.sessions).toHaveLength(1));
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
