import { Constraint1, Constraint3, Constraint2, Constraint } from "./constraints";
import { createGame } from "./script";
import { Utils, PathUtils, Options, Aliases, Bootstrap } from "@watness/common/src";
import wasm, { newConstraint } from "./bootstrap";
import { Howl, Howler } from "howler";
import * as challenge from "../../assets/Challenge.mp3";

import * as $ from "jquery";

async function runGames(
		wasmInstance: Bootstrap.WasmModule<Constraint>, 
		args: [ Aliases.BoardMatrix<Constraint>, Partial<Options.GameOptions> ][]
) {
	$(".selection").addClass("gone");
	let constrainers: Aliases.Constrainer<Constraint>[] = [
		(mtx, parts, horizontalPathSegments, verticalPathSegments) => 
			wasmInstance.check(mtx, parts, horizontalPathSegments, verticalPathSegments)
	];

	let results: Aliases.Segment[][] = [];
	for (let [mtx, additionalOptions] of args) {
		let constraints = mtx.map(row => row.map(({ t }) => t).filter((t): t is Constraint => t !== null)).reduce((l, nxt) => l.concat(nxt), []);
		let segment = await createGame($("witness-game")[0], additionalOptions, constrainers, constraints);
		results.push(segment);
	}
	$(".selection").removeClass("gone");
	return results;
}

async function runPuzzleRemote(wasmInstance: Bootstrap.WasmModule<Constraint>) {
	let query = await fetch("/get-puzzle");
	let bundle = await query.text();
	let args = wasmInstance.deserializeState(bundle)
	if (args === null) {
		throw new Error("Unreachable");
	}

	let howl = new Howl({
		src: [challenge],
	});
	howl.play()

	let gamePromise = runGames(wasmInstance, args);
	let songPromise = new Promise((resolve) => setTimeout(resolve, Options.TimeLimit));
	let segments = await Promise.race([gamePromise, songPromise]);
	
	howl.stop()

	if (!segments) {
		$("witness-game").addClass("gone");
		await new Promise((resolve) => setTimeout(resolve, 1000));
		$(".failure").removeClass("gone");
		return;
	}

	let result = {
		bundle,
		segments,
	};


	let response = await fetch("/check-puzzle", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(result),
	});
	let answer = await response.json();


	if (answer.correct) {
		$(".selection").addClass("gone");
		$(".flag-contents").text(answer.flag);
		$(".flag").removeClass("gone");
	} else {
		// failed
	}
}

async function runPuzzleLocal(wasmInstance: Bootstrap.WasmModule<Constraint>) {
	let pts: { x: number, y: number, t: Constraint | null }[][] = [];
	let mtx: { p: number, t: Constraint | null }[][] = [];

	let def = Options.defaultOptions;
	let options: Partial<Options.GameOptions> = {};

	options.startingPoints = [
		{
			x: Math.floor(Math.random() * (def.tiles.width + 1)), 
			y: Math.floor(Math.random() * (def.tiles.height + 1))
		}
	]
	let path: Aliases.Segment[] | null = null;
	while (pts.length < 3) {
		path = PathUtils.generatePath (def.tiles.width, def.tiles.height, options.startingPoints[0], def.endingPoints[0])
		if (path === null) continue;
		let out = PathUtils.partition(def.tiles.width, def.tiles.height, [])(path);
		
		mtx = out[0]
		pts = out[1]
	}

	if (path === null) {
		throw new Error("Unreachable");
	}

	let [horizontalPathSegments, verticalPathSegments] = PathUtils.getPathSegments(def.tiles.width, def.tiles.height, path);
	let mtxFinal = wasmInstance.gen(mtx, pts, horizontalPathSegments, verticalPathSegments, [true, true, true, true, true, true])[0];
	await runGames(wasmInstance, [[mtxFinal, options]]);
}

$(window).ready(async function() {
	let wasmInstance = await wasm();
	$("#local").on("click", () => runPuzzleLocal(wasmInstance));
	$("#remote").on("click", () => runPuzzleRemote(wasmInstance));
})