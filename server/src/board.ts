import * as loader from "assemblyscript/lib/loader";
import { Utils, PathUtils, Options, Aliases, Bootstrap } from "@watness/common";
import * as path from "path";
import { fs } from "mz";

type Constraint = Aliases.AbstractConstraint;

let globalModule: Bootstrap.WasmModule<Constraint> | null = null;

function newConstraint(name: string, x: number, y: number, classification: number, serializedArguments: string): Constraint {
	return {
		name,
		x,
		y,
		classification,
		serializedArguments
	};
}

export async function getModule() {
	if (globalModule !== null) {
		return globalModule;
	}
	let module = await loader.instantiateBuffer(fs.readFileSync(path.join(__dirname, "../../wasm/build/untouched.wasm")), {
		env: {},
		index: {
			"console.logI": (x: number) => console.log("Wasm:", x),
			"console.logS": (x: number) => console.log("Wasm:", module.getString(x)),
			"console.logIA": (x: number) => console.log("Wasm:", module.getArray(Int32Array, x)),
		},
	});
	globalModule = new Bootstrap.WasmModule(module, newConstraint);
	return globalModule;
}

let problems: [boolean, boolean, boolean, boolean, boolean, boolean][] = [
	[true, false, false, true, false, true],
	[true, true, false, false, false, false],
	[true, true, true, false, false, true],
	[true, true, false, true, true, true],
	[true, true, true, true, true, false],
]

export async function generateBoard() {
	let module = await getModule();

	let options = Options.defaultOptions;

	let generateSingleBoard = (
			selection: [boolean, boolean, boolean, boolean, boolean, boolean]
	): [ Aliases.BoardMatrix<Constraint>, Partial<Options.GameOptions> ] => {
		let additionalOptions: Partial<Options.GameOptions> = {};
		let path: Aliases.Segment[] | null = null;
		let mtx: Aliases.BoardMatrix<Constraint> = [];
		let pts: Aliases.PartitionList<Constraint> = [];
		let startingPoint: { x: number, y: number } | null = null;
		while (startingPoint === null 
			|| (startingPoint.x === options.endingPoints[0].x && startingPoint.y === options.endingPoints[0].y)) {
				startingPoint = {
				x: Math.floor(Math.random() * (options.tiles.width + 1)), 
				y: Math.floor(Math.random() * (options.tiles.height + 1))
			};
		}
		additionalOptions.startingPoints = [startingPoint];
		let i = 0;
		while (pts.length < 3) {
			i++;
			path = PathUtils.generatePath(options.tiles.width, options.tiles.height, startingPoint, options.endingPoints[0]);
			if (path === null) continue;
			let out = PathUtils.partition(options.tiles.width, options.tiles.height, [])(path);
			
			mtx = out[0]
			pts = out[1]
		}


		if (path === null) {
			throw new Error("What?");
		}

		let [horizontalPathSegments, verticalPathSegments] = PathUtils.getPathSegments(options.tiles.width, options.tiles.height, path);
		let [mtxPrime, parts] = module.gen(mtx, pts, horizontalPathSegments, verticalPathSegments, selection);
		let totalConstraints = mtxPrime.reduce((count, row) => count + row.reduce((count2, elt) => count2 + (elt.t === null ? 0 : 1), 0), 0);
		if (totalConstraints < 6) {
			return generateSingleBoard(selection);
		}

		console.log(PathUtils.pathToString(horizontalPathSegments, verticalPathSegments));
		console.info(PathUtils.mtxToString(mtxPrime));
		mtxPrime = mtxPrime.map(row => row.map(({ t }) => ({ p: 0, t })));
		return [mtxPrime, additionalOptions];
	}
	let mtxes = Array.from(problems, generateSingleBoard);

	(module.module as any).memory.reset();
	return mtxes;
}

export async function checkBoard(
		args: [
			Aliases.BoardMatrix<Aliases.AbstractConstraint>,
			Partial<Options.GameOptions>,
		][],
		segmentsList: Aliases.Segment[][],
) {
	let module = await getModule();
	if (args.length !== segmentsList.length) {
		return false;
	}

	for (let i = 0; i < args.length; i++) {
		let [matrix, additionalOptions] = args[i];
		let segments = segmentsList[i];
		let options = { ...Options.defaultOptions, ...additionalOptions };

		// Need actual constraint2t and end points
		if (!PathUtils.determinePathLegality(
			options.tiles.width, 
			options.tiles.height, 
			options.startingPoints[0], 
			options.endingPoints[0], 
			segments)
		) {
			return false;
		}

		let constraints = 
			matrix
				.map(row => row.map(({ t }) => t)
				.filter((t): t is Constraint => t !== null))
				.reduce((l, nxt) => l.concat(nxt), []);

		let [mtx, parts] = PathUtils.partition(options.tiles.width, options.tiles.height, constraints)(segments);
		let [horizontalPathSegments, verticalPathSegments] = PathUtils.getPathSegments(options.tiles.width, options.tiles.height, segments);

		let invalid = module.check(mtx, parts, horizontalPathSegments, verticalPathSegments);
		console.log(invalid);
		if (invalid !== 0) {
			return false;
		}
	}

	return true;
}