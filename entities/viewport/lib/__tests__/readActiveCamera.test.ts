import {
	activeCameraForAssign,
	planCameraUpdate,
	readActiveCamera,
} from "../readActiveCamera";

describe("readActiveCamera", () => {
	it("returns undefined when there is no camera", () => {
		expect(readActiveCamera(null)).toBeUndefined();
		expect(readActiveCamera(undefined)).toBeUndefined();
	});

	it("copies a perspective vec3 into tuples and includes fov", () => {
		const camera = readActiveCamera({
			id: "default",
			type: "perspective",
			name: "Perspective",
			position: new Float32Array([8, 6, 8]),
			target: new Float32Array([0, 0, 0]),
			fov: 50,
		});

		expect(camera).toEqual({
			id: "default",
			type: "perspective",
			name: "Perspective",
			position: [8, 6, 8],
			target: [0, 0, 0],
			fov: 50,
		});
		expect(camera).not.toHaveProperty("direction");
		expect(JSON.stringify(camera?.position)).toBe("[8,6,8]");
	});

	it("includes orthographic direction and omits fov and name", () => {
		const camera = readActiveCamera({
			id: "top",
			type: "orthographic",
			position: [0, 10, 0],
			target: [0, 0, 0],
			direction: "top",
		});

		expect(camera).toEqual({
			id: "top",
			type: "orthographic",
			position: [0, 10, 0],
			target: [0, 0, 0],
			direction: "top",
		});
		expect(camera).not.toHaveProperty("fov");
		expect(camera).not.toHaveProperty("name");
	});
});

describe("activeCameraForAssign", () => {
	const document = {
		type: "perspective" as const,
		position: [1, 2, 3] as [number, number, number],
		target: [0, 0, 0] as [number, number, number],
		fov: 40,
		direction: "top" as const,
	};
	const active = {id: "current", type: "perspective" as const};

	it("updates fov on the active camera without position or target", () => {
		expect(activeCameraForAssign({fov: 40}, active)).toEqual({
			id: "current",
			fov: 40,
		});
	});

	it("does not invent an id when nothing is set", () => {
		expect(activeCameraForAssign({}, active)).toEqual({});
	});

	it("updates the active camera when type, id, and name are omitted", () => {
		expect(
			activeCameraForAssign(
				{position: [1, 2, 3], target: [0, 0, 0]},
				active,
			),
		).toEqual({
			id: "current",
			position: [1, 2, 3],
			target: [0, 0, 0],
		});
	});

	it("updates the active camera when id and name are omitted", () => {
		expect(activeCameraForAssign(document, active)).toEqual({
			id: "current",
			position: [1, 2, 3],
			target: [0, 0, 0],
			fov: 40,
			direction: "top",
		});
	});

	it("keeps type when there is no camera to update", () => {
		expect(activeCameraForAssign(document)).toEqual({
			type: "perspective",
			position: [1, 2, 3],
			target: [0, 0, 0],
			fov: 40,
			direction: "top",
		});
	});

	it("keeps type when the active camera type differs", () => {
		expect(
			activeCameraForAssign(document, {
				id: "current",
				type: "orthographic",
			}),
		).toEqual({
			type: "perspective",
			position: [1, 2, 3],
			target: [0, 0, 0],
			fov: 40,
			direction: "top",
		});
	});

	it("keeps a requested id and does not create by type", () => {
		expect(
			activeCameraForAssign({...document, id: "other"}, active),
		).toEqual({
			id: "other",
			position: [1, 2, 3],
			target: [0, 0, 0],
			fov: 40,
			direction: "top",
		});
	});

	it("selects by name without substituting the active id", () => {
		expect(
			activeCameraForAssign({...document, name: "Top"}, active),
		).toEqual({
			name: "Top",
			position: [1, 2, 3],
			target: [0, 0, 0],
			fov: 40,
			direction: "top",
		});
	});

	it("keeps fov on an orthographic camera", () => {
		expect(
			activeCameraForAssign(
				{fov: 40},
				{id: "current", type: "orthographic"},
			),
		).toEqual({id: "current", fov: 40});
	});

	it("keeps direction when the active camera is orthographic and type is omitted", () => {
		expect(
			activeCameraForAssign(
				{direction: "top"},
				{id: "current", type: "orthographic"},
			),
		).toEqual({id: "current", direction: "top"});
	});

	it("keeps fov and direction for an orthographic document", () => {
		expect(
			activeCameraForAssign(
				{
					type: "orthographic",
					position: [0, 10, 0],
					target: [0, 0, 0],
					fov: 40,
					direction: "top",
				},
				{id: "current", type: "orthographic"},
			),
		).toEqual({
			id: "current",
			position: [0, 10, 0],
			target: [0, 0, 0],
			fov: 40,
			direction: "top",
		});
	});
});

describe("planCameraUpdate", () => {
	const active = {
		id: "current",
		type: "perspective" as const,
		position: [8, 6, 8] as [number, number, number],
		target: [0, 1, 0] as [number, number, number],
	};

	it("moves position and target through set and keeps the id on assign", () => {
		expect(
			planCameraUpdate({position: [1, 2, 3], target: [0, 0, 0]}, active),
		).toEqual({
			assign: {id: "current"},
			move: {position: [1, 2, 3], target: [0, 0, 0]},
		});
	});

	it("fills a missing target from the active camera", () => {
		expect(planCameraUpdate({position: [1, 2, 3]}, active)).toEqual({
			assign: {id: "current"},
			move: {position: [1, 2, 3], target: [0, 1, 0]},
		});
	});

	it("leaves a lens-only update on assign", () => {
		expect(planCameraUpdate({fov: 40}, active)).toEqual({
			assign: {id: "current", fov: 40},
		});
	});

	it("keeps a different type on assign and moves the pose through set", () => {
		expect(
			planCameraUpdate(
				{
					type: "orthographic",
					position: [0, 10, 0],
					target: [0, 0, 0],
					direction: "top",
				},
				active,
			),
		).toEqual({
			assign: {type: "orthographic", direction: "top"},
			move: {position: [0, 10, 0], target: [0, 0, 0]},
		});
	});
});
