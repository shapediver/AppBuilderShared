/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import {EXPORT_TYPE, PARAMETER_TYPE} from "@shapediver/viewer.session";
import {resolveParameterValueSources} from "../resolveParameterValueSources";

describe("resolveParameterValueSources", () => {
	const originalParameterGetState = useShapeDiverStoreParameters.getState;
	const originalSessionGetState = useShapeDiverStoreSession.getState;
	const originalProcessGetState = useShapeDiverStoreProcessManager.getState;

	afterEach(() => {
		useShapeDiverStoreParameters.getState = originalParameterGetState;
		useShapeDiverStoreSession.getState = originalSessionGetState;
		useShapeDiverStoreProcessManager.getState = originalProcessGetState;
	});

	it("passes literal values through", async () => {
		const values = await resolveParameterValueSources(
			[{id: "p1", value: "hello"}],
			{namespace: "session"},
		);
		expect(values).toEqual(["hello"]);
	});

	it("stringifies a dataOutput source for STRING parameters", async () => {
		const content = [{data: {ok: true}}];
		useShapeDiverStoreSession.getState = () =>
			({
				sessions: {
					session: {
						parameters: {
							p1: {
								id: "p1",
								name: "p1",
								type: PARAMETER_TYPE.STRING,
							},
						},
						outputs: {},
						exports: {},
					},
				},
			}) as unknown as ReturnType<typeof originalSessionGetState>;
		useShapeDiverStoreParameters.getState = () =>
			({
				getOutput: () => ({
					getState: () => ({
						definition: {id: "json", name: "json", version: "v1"},
						content,
					}),
				}),
			}) as unknown as ReturnType<typeof originalParameterGetState>;

		const values = await resolveParameterValueSources(
			[
				{
					id: "p1",
					value: {type: "dataOutput", props: {name: "json"}},
				},
			],
			{namespace: "session"},
		);

		expect(values).toEqual([JSON.stringify({content})]);
	});

	it("resolves nested export parameterValues before requesting the export", async () => {
		const upload = jest.fn(async () => "uploaded-id");
		const request = jest.fn(async () => ({
			content: [{href: "https://example.test/file.bin"}],
			filename: "file.bin",
		}));
		const fetchMock = jest.fn(async () => ({
			blob: async () => new Blob(["bin"]),
		}));
		const originalFetch = globalThis.fetch;
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		useShapeDiverStoreSession.getState = () =>
			({
				sessions: {
					session: {
						parameters: {
							file: {
								id: "file",
								name: "file",
								type: PARAMETER_TYPE.FILE,
								upload,
							},
							nested: {
								id: "nested",
								name: "nested",
								type: PARAMETER_TYPE.STRING,
							},
						},
						outputs: {},
						exports: {
							e1: {
								id: "e1",
								name: "e1",
								type: EXPORT_TYPE.DOWNLOAD,
								request,
								version: "1",
							},
						},
					},
				},
			}) as unknown as ReturnType<typeof originalSessionGetState>;
		useShapeDiverStoreParameters.getState = () =>
			({
				getOutput: () => ({
					getState: () => ({
						definition: {id: "json", name: "json", version: "v1"},
						content: [{data: 1}],
					}),
				}),
			}) as unknown as ReturnType<typeof originalParameterGetState>;

		try {
			const values = await resolveParameterValueSources(
				[
					{
						id: "file",
						value: {
							type: "export",
							props: {
								name: "e1",
								parameterValues: {
									nested: {
										type: "dataOutput",
										props: {name: "json"},
									},
								},
							},
						},
					},
				],
				{namespace: "session"},
			);

			expect(request).toHaveBeenCalledWith({
				nested: JSON.stringify({content: [{data: 1}]}),
			});
			expect(upload).toHaveBeenCalled();
			expect(values).toEqual(["uploaded-id"]);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("uploads an sdTF source to the session that owns the target parameter", async () => {
		const controllerUpload = jest.fn();
		const targetUpload = jest.fn(async () => [{id: "asset-1"}]);
		const createProcessManager = jest.fn(() => "pm");
		const originalFetch = globalThis.fetch;
		globalThis.fetch = jest.fn(async () => ({
			arrayBuffer: async () => new ArrayBuffer(4),
		})) as unknown as typeof fetch;

		useShapeDiverStoreSession.getState = () =>
			({
				sessions: {
					default: {
						parameters: {},
						outputs: {},
						exports: {},
						uploadSDTF: controllerUpload,
					},
					"session-chain-step1": {
						parameters: {},
						outputs: {
							step1_output: {
								id: "out",
								name: "step1_output",
								content: [
									{href: "https://example.test/out.sdtf"},
								],
							},
						},
						exports: {},
					},
					"session-chain-step2": {
						parameters: {
							step1_data: {
								id: "step1_data",
								name: "step1_data",
								type: "sMesh",
							},
						},
						outputs: {},
						exports: {},
						uploadSDTF: targetUpload,
					},
				},
			}) as unknown as ReturnType<typeof originalSessionGetState>;
		useShapeDiverStoreParameters.getState = () =>
			({
				getOutput: () => undefined,
			}) as unknown as ReturnType<typeof originalParameterGetState>;
		useShapeDiverStoreProcessManager.getState = () =>
			({
				createProcessManager,
				addProcess: jest.fn(),
			}) as unknown as ReturnType<typeof originalProcessGetState>;

		try {
			const values = await resolveParameterValueSources(
				[
					{
						id: "step1_data",
						namespace: "session-chain-step2",
						value: {
							type: "sdtf",
							props: {
								name: "step1_output",
								sessionId: "session-chain-step1",
								chunk: {name: "step1_data"},
							},
						},
					},
				],
				{namespace: "default"},
			);

			expect(controllerUpload).not.toHaveBeenCalled();
			expect(targetUpload).toHaveBeenCalledTimes(1);
			expect(values).toEqual([
				JSON.stringify(
					{asset: {id: "asset-1", chunk: {name: "step1_data"}}},
					null,
					2,
				),
			]);
			expect(createProcessManager).toHaveBeenCalledWith("default");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("uploads the same sdTF source separately for each target session", async () => {
		const uploadA = jest.fn(async () => [{id: "asset-a"}]);
		const uploadB = jest.fn(async () => [{id: "asset-b"}]);
		const originalFetch = globalThis.fetch;
		globalThis.fetch = jest.fn(async () => ({
			arrayBuffer: async () => new ArrayBuffer(4),
		})) as unknown as typeof fetch;

		const output = {
			id: "out",
			name: "shared_output",
			content: [{href: "https://example.test/out.sdtf"}],
		};
		const parameter = {
			id: "mesh",
			name: "mesh",
			type: "sMesh",
		};
		useShapeDiverStoreSession.getState = () =>
			({
				sessions: {
					source: {
						parameters: {},
						outputs: {shared_output: output},
						exports: {},
					},
					"session-a": {
						parameters: {mesh: parameter},
						outputs: {},
						exports: {},
						uploadSDTF: uploadA,
					},
					"session-b": {
						parameters: {mesh: parameter},
						outputs: {},
						exports: {},
						uploadSDTF: uploadB,
					},
				},
			}) as unknown as ReturnType<typeof originalSessionGetState>;
		useShapeDiverStoreParameters.getState = () =>
			({
				getOutput: () => undefined,
			}) as unknown as ReturnType<typeof originalParameterGetState>;
		useShapeDiverStoreProcessManager.getState = () =>
			({
				createProcessManager: jest.fn(() => "pm"),
				addProcess: jest.fn(),
			}) as unknown as ReturnType<typeof originalProcessGetState>;

		const source = {
			type: "sdtf" as const,
			props: {name: "shared_output", sessionId: "source"},
		};
		try {
			const values = await resolveParameterValueSources(
				[
					{id: "mesh", namespace: "session-a", value: source},
					{
						id: "mesh",
						namespace: "session-b",
						value: {...source, props: {...source.props}},
					},
				],
				{namespace: "default"},
			);

			expect(uploadA).toHaveBeenCalledTimes(1);
			expect(uploadB).toHaveBeenCalledTimes(1);
			expect(values).toEqual([
				JSON.stringify({asset: {id: "asset-a"}}, null, 2),
				JSON.stringify({asset: {id: "asset-b"}}, null, 2),
			]);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("reads a dataOutput without sessionId from the controller and uploads it to the parameter session", async () => {
		const upload = jest.fn(async () => "uploaded-id");
		const content = [{data: {from: "controller"}}];
		useShapeDiverStoreSession.getState = () =>
			({
				sessions: {
					default: {
						parameters: {},
						outputs: {
							json: {
								id: "json",
								name: "json",
								version: "v1",
								content,
							},
						},
						exports: {},
					},
					step2: {
						parameters: {
							file: {
								id: "file",
								name: "file",
								type: PARAMETER_TYPE.FILE,
								upload,
							},
						},
						outputs: {},
						exports: {},
					},
				},
			}) as unknown as ReturnType<typeof originalSessionGetState>;
		useShapeDiverStoreParameters.getState = () =>
			({
				getOutput: () => undefined,
			}) as unknown as ReturnType<typeof originalParameterGetState>;

		const values = await resolveParameterValueSources(
			[
				{
					id: "file",
					namespace: "step2",
					value: {type: "dataOutput", props: {name: "json"}},
				},
			],
			{namespace: "default"},
		);

		expect(upload).toHaveBeenCalledTimes(1);
		expect(values).toEqual(["uploaded-id"]);
	});

	it("reads an export without sessionId from the controller and uploads it to the parameter session", async () => {
		const upload = jest.fn(async () => "uploaded-id");
		const request = jest.fn(async () => ({
			content: [{href: "https://example.test/file.bin"}],
			filename: "file.bin",
		}));
		const originalFetch = globalThis.fetch;
		globalThis.fetch = jest.fn(async () => ({
			blob: async () => new Blob(["bin"]),
		})) as unknown as typeof fetch;

		useShapeDiverStoreSession.getState = () =>
			({
				sessions: {
					default: {
						parameters: {},
						outputs: {},
						exports: {
							e1: {
								id: "e1",
								name: "e1",
								type: EXPORT_TYPE.DOWNLOAD,
								request,
								version: "1",
							},
						},
					},
					step2: {
						parameters: {
							file: {
								id: "file",
								name: "file",
								type: PARAMETER_TYPE.FILE,
								upload,
							},
						},
						outputs: {},
						exports: {},
					},
				},
			}) as unknown as ReturnType<typeof originalSessionGetState>;

		try {
			const values = await resolveParameterValueSources(
				[
					{
						id: "file",
						namespace: "step2",
						value: {type: "export", props: {name: "e1"}},
					},
				],
				{namespace: "default"},
			);

			expect(request).toHaveBeenCalledTimes(1);
			expect(upload).toHaveBeenCalledTimes(1);
			expect(values).toEqual(["uploaded-id"]);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
