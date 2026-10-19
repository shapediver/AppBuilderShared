/**
 * @jest-environment jsdom
 */
import {ParameterStringInputMode} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {MantineProvider} from "@mantine/core";
import {fireEvent, render, screen} from "@testing-library/react";
import ParameterStringComponent from "../ParameterStringComponent";

const setUiValue = jest.fn((next: string) => {
	commonsState.uiValue = next;
	commonsState.dirty = next !== commonsState.commitValue;
	return true;
});
const setValue = jest.fn();
const handleChange = jest.fn();
const cancelPendingChange = jest.fn();
const restoreFocus = jest.fn();

jest.mock("../../model/useFocus", () => ({
	useFocus: () => ({
		onFocusHandler: jest.fn(),
		onBlurHandler: jest.fn(),
		restoreFocus,
	}),
}));

jest.mock("../../model/useParameter", () => ({
	useParameter: () => ({
		definition: {
			id: "p1",
			name: "Text",
			displayname: "Text",
		},
		state: {uiValue: "hello", commitValue: "hello", dirty: false},
		actions: {},
	}),
}));

const commonsState: {
	uiValue: string;
	commitValue: string;
	dirty: boolean;
} = {
	uiValue: "hello",
	commitValue: "hello",
	dirty: false,
};
const commonsSettings: {lines?: number} = {};

const mockUseParameterComponentCommons = jest.fn(
	(
		_props: unknown,
		_debounce: unknown,
		_initializer: unknown,
		disableWhileDirty = true,
	) => ({
		definition: {
			id: "p1",
			name: "Text",
			displayname: "Text",
			max: 100,
			settings: commonsSettings,
		},
		actions: {setUiValue},
		state: commonsState,
		value: commonsState.uiValue,
		setValue,
		handleChange,
		cancelPendingChange,
		onCancel: undefined,
		disabled: disableWhileDirty && commonsState.dirty,
		showReset: false,
		resetToDefault: jest.fn(),
		formInputProps: null,
		formKey: null,
	}),
);

jest.mock("../../model/useParameterComponentCommons", () => ({
	useParameterComponentCommons: (...args: unknown[]) =>
		mockUseParameterComponentCommons(...args),
}));

function renderInput(props: {mode?: ParameterStringInputMode} = {}) {
	return render(
		<MantineProvider>
			<ParameterStringComponent
				namespace="session"
				parameterId="p1"
				mode={props.mode}
			/>
		</MantineProvider>,
	);
}

function renderDuplicateInputs(props: {mode?: ParameterStringInputMode} = {}) {
	return render(
		<MantineProvider>
			<ParameterStringComponent
				namespace="session"
				parameterId="p1"
				mode={props.mode}
			/>
			<ParameterStringComponent
				namespace="session"
				parameterId="p1"
				mode={props.mode}
			/>
		</MantineProvider>,
	);
}

describe("ParameterStringComponent drafts", () => {
	beforeEach(() => {
		setUiValue.mockClear();
		setValue.mockClear();
		handleChange.mockClear();
		cancelPendingChange.mockClear();
		mockUseParameterComponentCommons.mockClear();
		commonsState.uiValue = "hello";
		commonsState.commitValue = "hello";
		commonsState.dirty = false;
		delete commonsSettings.lines;
	});

	it("publishes uiValue while typing in validate mode and executes on blur", () => {
		const view = renderInput({mode: ParameterStringInputMode.Validate});
		const input = screen.getByRole("textbox");

		fireEvent.change(input, {target: {value: "hello!"}});

		expect(setUiValue).toHaveBeenCalledWith("hello!");
		expect(setValue).toHaveBeenCalledWith("hello!");
		expect(handleChange).not.toHaveBeenCalled();

		view.rerender(
			<MantineProvider>
				<ParameterStringComponent
					namespace="session"
					parameterId="p1"
					mode={ParameterStringInputMode.Validate}
				/>
			</MantineProvider>,
		);

		const dirtyInput = screen.getByRole("textbox");
		expect((dirtyInput as HTMLTextAreaElement).disabled).toBe(false);
		fireEvent.blur(dirtyInput);

		expect(handleChange).toHaveBeenCalledWith("hello!", 0, undefined);
	});

	it("keeps duplicate references synchronized and editable while debounce is pending", () => {
		const view = renderDuplicateInputs({
			mode: ParameterStringInputMode.Debounce,
		});
		const [firstInput] = screen.getAllByRole("textbox");

		fireEvent.change(firstInput, {target: {value: "hello!"}});
		view.rerender(
			<MantineProvider>
				<ParameterStringComponent
					namespace="session"
					parameterId="p1"
					mode={ParameterStringInputMode.Debounce}
				/>
				<ParameterStringComponent
					namespace="session"
					parameterId="p1"
					mode={ParameterStringInputMode.Debounce}
				/>
			</MantineProvider>,
		);

		const inputs = screen.getAllByRole("textbox");
		expect(inputs).toHaveLength(2);
		expect((inputs[0] as HTMLTextAreaElement).value).toBe("hello!");
		expect((inputs[1] as HTMLTextAreaElement).value).toBe("hello!");
		expect((inputs[0] as HTMLTextAreaElement).disabled).toBe(false);
		expect((inputs[1] as HTMLTextAreaElement).disabled).toBe(false);
	});

	it("cancels a pending debounce when switching to validate mode", () => {
		const view = renderInput({mode: ParameterStringInputMode.Debounce});
		cancelPendingChange.mockClear();

		view.rerender(
			<MantineProvider>
				<ParameterStringComponent
					namespace="session"
					parameterId="p1"
					mode={ParameterStringInputMode.Validate}
				/>
			</MantineProvider>,
		);

		expect(cancelPendingChange).toHaveBeenCalledTimes(1);
	});

	it("renders lines: 1 as a single-line input and validates on Enter", () => {
		commonsSettings.lines = 1;
		const view = renderInput({mode: ParameterStringInputMode.Validate});
		const input = screen.getByRole("textbox");

		expect(input.tagName).toBe("INPUT");
		fireEvent.change(input, {target: {value: "hello!"}});
		view.rerender(
			<MantineProvider>
				<ParameterStringComponent
					namespace="session"
					parameterId="p1"
					mode={ParameterStringInputMode.Validate}
				/>
			</MantineProvider>,
		);
		fireEvent.keyDown(screen.getByRole("textbox"), {key: "Enter"});

		expect(handleChange).toHaveBeenCalledWith("hello!", 0, restoreFocus);
	});

	it("publishes uiValue while typing in debounce mode and still defers execution", () => {
		renderInput({mode: ParameterStringInputMode.Debounce});
		const input = screen.getByRole("textbox");

		fireEvent.change(input, {target: {value: "hello!"}});

		expect(setUiValue).toHaveBeenCalledWith("hello!");
		expect(handleChange).toHaveBeenCalledWith(
			"hello!",
			undefined,
			restoreFocus,
		);
	});

	it("does not execute on blur when the field matches the committed value", () => {
		renderInput({mode: ParameterStringInputMode.Validate});
		const input = screen.getByRole("textbox");

		fireEvent.blur(input, {target: {value: "hello"}});

		expect(handleChange).not.toHaveBeenCalled();
	});
});
