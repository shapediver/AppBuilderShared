/**
 * @jest-environment jsdom
 */
jest.mock("@AppBuilderLib/shared/ui/hint/Hint", () => ({
	__esModule: true,
	default: () => null,
}));

import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useImportModelStateDialogStore} from "@AppBuilderLib/features/model-state/model/useImportModelStateDialogStore";
import {MantineProvider} from "@mantine/core";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import ImportModelStateDialogHost from "../ImportModelStateDialogHost";

describe("ImportModelStateDialogHost", () => {
	const getModelState = jest.fn();

	beforeEach(() => {
		getModelState.mockReset();
		getModelState.mockResolvedValue({
			modelState: {parameters: {}},
		});
		useImportModelStateDialogStore.setState({
			current: null,
			queue: [],
		});
		useShapeDiverStoreSession.setState({
			sessions: {
				session: {getModelState} as never,
			},
		});
	});

	afterEach(() => {
		cleanup();
		act(() => {
			useImportModelStateDialogStore.setState({
				current: null,
				queue: [],
			});
			useShapeDiverStoreSession.setState({sessions: {}});
		});
	});

	it("imports against the requested namespace instead of a stale empty session", async () => {
		render(
			<MantineProvider>
				<ImportModelStateDialogHost />
			</MantineProvider>,
		);

		expect(screen.queryByText("Import a model state")).toBeNull();

		act(() => {
			void useImportModelStateDialogStore.getState().open("session");
		});

		const input = await screen.findByPlaceholderText(
			"Model state ID or URL",
		);
		fireEvent.change(input, {target: {value: "ms-1"}});
		fireEvent.click(screen.getByRole("button", {name: "Load"}));

		await waitFor(() => {
			expect(getModelState).toHaveBeenCalledWith("ms-1");
		});
	});
});
