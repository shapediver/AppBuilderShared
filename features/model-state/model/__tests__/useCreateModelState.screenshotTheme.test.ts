/**
 * @jest-environment jsdom
 */
import {act, renderHook} from "@testing-library/react";
import {useCreateModelState} from "../useCreateModelState";

// useViewportId reads from context; mock it to a fixed viewport id.
jest.mock("@AppBuilderLib/entities/viewport/model/useViewportId", () => ({
	useViewportId: () => ({viewportId: "vp1"}),
}));

// useProps needs a Mantine provider; override only useProps, keep the rest real
// (getDefaultZIndex etc. are used transitively via the notification store).
jest.mock("@mantine/core", () => {
	const actual = jest.requireActual("@mantine/core");
	return {
		...actual,
		useProps: jest.fn(),
	};
});

import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import {useProps} from "@mantine/core";

const sessionStore = useShapeDiverStoreSession;
const viewportAccessFunctionsStore = useShapeDiverStoreViewportAccessFunctions;

const sessionApiMock: any = {};

function setSessionApi(overrides: Partial<any> = {}) {
	Object.keys(sessionApiMock).forEach((k) => delete sessionApiMock[k]);
	Object.assign(sessionApiMock, {
		modelViewUrl: "https://backend.example.com/",
		parameters: {
			paramA: {
				id: "paramA",
				name: "Param A",
				displayname: "Param A",
				value: 1,
			},
		},
		createModelState: jest.fn().mockResolvedValue("ms-id-123"),
		...overrides,
	});
	sessionStore.setState({sessions: {ns: sessionApiMock}});
}

let themeFromTest: Record<string, unknown> = {};

describe("useCreateModelState screenshotProps theme", () => {
	beforeEach(() => {
		themeFromTest = {};
		(useProps as jest.Mock).mockImplementation(
			(_name: string, defaults: object, props: object) => ({
				...defaults,
				...themeFromTest,
				...props,
			}),
		);
		setSessionApi();
		viewportAccessFunctionsStore.setState({viewportAccessFunctions: {}});
	});

	it("falls back to theme screenshotProps when the call omits them", async () => {
		const themeScreenshotProps = {
			contentType: "image/jpeg",
			quality: 0.8,
			resolution: {width: 256, height: 256},
		};
		themeFromTest = {screenshotProps: themeScreenshotProps};

		const getScreenshot = jest
			.fn()
			.mockResolvedValue("data:image/png;base64,test");
		viewportAccessFunctionsStore.setState({
			viewportAccessFunctions: {
				vp1: {getScreenshot},
			},
		});

		const {result} = renderHook(() =>
			useCreateModelState({namespace: "ns"}),
		);

		await act(async () => {
			await result.current.createModelState({includeImage: true});
		});

		expect(getScreenshot).toHaveBeenCalledWith(themeScreenshotProps);
	});

	it("uses call screenshotProps over CreateModelStateHook theme defaults", async () => {
		themeFromTest = {screenshotProps: {quality: 0.2}};

		const getScreenshot = jest
			.fn()
			.mockResolvedValue("data:image/png;base64,test");
		viewportAccessFunctionsStore.setState({
			viewportAccessFunctions: {
				vp1: {getScreenshot},
			},
		});

		const {result} = renderHook(() =>
			useCreateModelState({namespace: "ns"}),
		);

		await act(async () => {
			await result.current.createModelState({
				includeImage: true,
				screenshotProps: {quality: 0.9},
			});
		});

		expect(getScreenshot).toHaveBeenCalledWith({quality: 0.9});
	});
});
