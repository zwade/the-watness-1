/// <reference path="./wasm.d.ts" />
import * as loader from "assemblyscript/lib/loader";
import { Aliases, Options } from "@watness/common"; 
import * as crypto from "crypto";

let decodeArray = function(typedArray: loader.TypedArray): string {
	if (typeof process === "undefined") {
		let dec = new TextDecoder();
		return dec.decode(typedArray);
	} else {
		return Buffer.from(typedArray).toString();
	}
}

export module Bootstrap {
	type NewConstraint<C extends Aliases.AbstractConstraint> = 
		(kind: string, x: number, y: number, classification: number, serializedArgs: string) => C;

	function stateToPair<C extends Aliases.AbstractConstraint>(
			module: loader.ASUtil, 
			state: any,
			newConstraint: NewConstraint<C>
	): [Aliases.BoardMatrix<C>, Aliases.PartitionList<C>] {
		let exp = (module as any);
		let bm = state.mtx
		let wasmArrMtx = exp.serializeBoardMatrix(bm);
		let arrMtx = module.getArray(Uint8Array, wasmArrMtx);
		let jsonMtx = JSON.parse(decodeArray(arrMtx));
		let mtx: Aliases.BoardMatrix<C> = jsonMtx.map((row: any) => row.map((obj: any) => ({
			p: parseInt(obj.p),
			t: deserializeConstraint(obj, newConstraint),
		})));

		let pl = state.parts
		let wasmArrParts = exp.serializePartitionList(pl);
		let arrParts = module.getArray(Uint8Array, wasmArrParts);
		let jsonParts = JSON.parse(decodeArray(arrParts));
		let parts: Aliases.PartitionList<C> = jsonParts.map((row: any) => row.map((obj: any) => ({
			x: parseInt(obj.x),
			y: parseInt(obj.y),
			t: deserializeConstraint(obj, newConstraint),
		})));

		return [mtx, parts];
	}

	function serializeConstraint<C extends Aliases.AbstractConstraint>(t: C | null): object {
		if (t === null) {
			return {
				t: "null",
			}
		}

		return  {
			t: t.name,
			"t.x": t.x.toString(),
			"t.y": t.y.toString(),
			"t.classification": t.classification.toString(),
			"t.serializedArgs": t.serializedArguments,
		};
	}

	function deserializeConstraint<C extends Aliases.AbstractConstraint>(
			t: any, 
			newConstraint: NewConstraint<C>
	): C | null {
		let kind = t["t"];
		if (kind === "null") {
			return null;
		}

		let x = parseInt(t["t.x"]);
		let y = parseInt(t["t.y"]);
		let classification = parseInt(t["t.classification"]);
		let serializedArgs = t["t.serializedArgs"];

		return newConstraint(kind, x, y, classification, serializedArgs)
	}

	function pairToState<C extends Aliases.AbstractConstraint>(
			module: loader.ASUtil, 
			mtx: Aliases.BoardMatrix<C>, 
			parts: Aliases.PartitionList<C>
	): [any, number] {
		let exp = (module as any);
		let serializedMtx =
			JSON.stringify(mtx.map(row => row.map(({ p, t }) => {
				let obj = serializeConstraint(t);
				return Object.assign(obj, { p: p.toString() });
			})))
			.split("")
			.map((char) => char.charCodeAt(0));
		let arrMtx = new Int8Array(serializedMtx);
		let wasmArrMtx: number = module.newArray(arrMtx);
		let wasmMtx = exp.deserializeBoardMatrix(wasmArrMtx);

		let serializedParts =
			JSON.stringify(parts.map(row => row.map(({ x, y, t }) => {
				let obj = serializeConstraint(t);
				return Object.assign(obj, { x: x.toString(), y: y.toString() });
			})))
			.split("")
			.map((char) => char.charCodeAt(0));
		let arrParts = new Int8Array(serializedParts);
		let wasmArrParts: number = module.newArray(arrParts);
		let wasmParts = exp.deserializePartitionList(wasmArrParts);
		let state = exp.State.create(wasmMtx, wasmParts);

		return [exp.State.wrap(state), state];
	}

	function encodeIntMatrix(module: loader.ASUtil, ints: number[][]) {
		let exp = (module as any);
		let serializedInts = 
			JSON.stringify(ints.map(row => row.map(num => (
				{ value: num.toString() }
			))))
			.split("")
			.map(char => char.charCodeAt(0));
		let arrInts = new Int8Array(serializedInts);
		let wasmArrInts: number = module.newArray(arrInts);
		let wasmInts = exp.deserializeI32(wasmArrInts);
		return wasmInts;
	}

	export class WasmModule<C extends Aliases.AbstractConstraint> {
		public module: loader.ASUtil;
		public newConstraint: NewConstraint<C>;

		constructor (module: loader.ASUtil, newConstraint: NewConstraint<C>) {
			this.module = module;
			this.newConstraint = newConstraint;
		}

		check(
				mtx: Aliases.BoardMatrix<C>, 
				parts: Aliases.PartitionList<C>, 
				horizontalPathSegments: number[][], 
				verticalPathSegments: number[][]
		): number {
			let exp = this.module as any;
			let [stateObj, statePtr] = pairToState(this.module, mtx, parts);
			let wasmHorizontalPathSegments = encodeIntMatrix(this.module, horizontalPathSegments);
			let wasmVerticalPathSegments = encodeIntMatrix(this.module, verticalPathSegments);
			let failures = exp.checkAll(stateObj.mtx, stateObj.parts, wasmHorizontalPathSegments, wasmVerticalPathSegments);
			return failures;
		}

		gen(
				mtx: Aliases.BoardMatrix<C>, 
				parts: Aliases.PartitionList<C>, 
				horizontalPathSegments: number[][], 
				verticalPathSegments: number[][],
				selection?: [boolean, boolean, boolean, boolean, boolean, boolean]
		): [Aliases.BoardMatrix<C>, Aliases.PartitionList<C>] {
			let exp = this.module as any;
			let [stateObj, statePtr] = pairToState(this.module, mtx, parts);
			let wasmHorizontalPathSegments = encodeIntMatrix(this.module, horizontalPathSegments);
			let wasmVerticalPathSegments = encodeIntMatrix(this.module, verticalPathSegments);
			selection = selection || [true, true, true, true, true, true];
			exp.genAll(statePtr, wasmHorizontalPathSegments, wasmVerticalPathSegments, ...selection);
			let result = stateToPair(this.module, stateObj, this.newConstraint);
			return result;
		}

		serializeState(
			args: [
				Aliases.BoardMatrix<C>,
				Partial<Options.GameOptions>,
			][],
			secret?: string,
		): string {
			let resultArgs = args.map(([mtx, options]) => [
					mtx.map(row => row.map(({ p, t }) => {
						let obj = serializeConstraint(t);
						return Object.assign(obj, { p: p.toString() });
					})
				), options
			]);
			let signature = "";
			let bundle = JSON.stringify({
				data: resultArgs,
				metadata: {
					timestamp: Date.now(),
				},
			});
			if (secret !== undefined) {
				signature = crypto.createHmac("sha256", secret).update(bundle).digest("base64");
			}
			return `${Buffer.from(bundle).toString("base64")}.${signature}`;
		}

		deserializeState(state: string, secret?: string): [Aliases.BoardMatrix<C>, Partial<Options.GameOptions>][] | null {
			let [encodedBundle, signature] = state.split(".");
			let bundle = Buffer.from(encodedBundle, "base64").toString();
			if (secret !== undefined) {
				let verifiedSignature = crypto.createHmac("sha256", secret).update(bundle).digest("base64");
				if (signature !== verifiedSignature) {
					console.error(signature, verifiedSignature);
					return null;
				}
			}

			let { data, metadata } = JSON.parse(bundle);
			if (!metadata.timestamp || (Date.now() - metadata.timestamp > Options.TimeLimit)) {
				console.error("Out of time");
				return null;
			}
			let result = data.map(([mtx, options]: any) => [
					mtx.map((row: any) => row.map((obj: any) => ({
						p: parseInt(obj.p),
						t: deserializeConstraint(obj, this.newConstraint),
					}))
				), options
			]);
			return result
		}
	}
}