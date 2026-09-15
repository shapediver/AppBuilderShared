/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {EXPORT_TYPE, PARAMETER_TYPE} from "@shapediver/viewer.session";
import {resolveParameterValueSources} from "../resolveParameterValueSources";

describe("resolveParameterValueSources", () => {
	const originalParameterGetState = useShapeDiverStoreParameters.getState;
	const originalSessionGetState = useShapeDiverStoreSession.getState;

	afterEach(() => {
		useShapeDiverStoreParameters.getState = originalParameterGetState;
		useShapeDiverStoreSession.getState = originalSessionGetState;
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
});
