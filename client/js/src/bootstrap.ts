import * as wasmPath from "@watness/wasm/build/untouched.wasm";
import { Constraint, Constraint2, Constraint1, Constraint3, Constraint4, Constraint5, Constraint6 } from "./constraints"; 
import * as loader from "assemblyscript/lib/loader";
import { Bootstrap } from "@watness/common/src";


export function newConstraint(kind: string, x: number, y: number, classification: number, serializedArgs: string) {
	switch(kind) {
		case "constraint1":
			return new Constraint1(x, y, classification, kind, serializedArgs);
		case "constraint2": 
			return new Constraint2(x, y, classification, kind, serializedArgs);
		case "constraint3":
			return new Constraint3(x, y, classification, kind, serializedArgs);
		case "constraint4":
			return new Constraint4(x, y, classification, kind, serializedArgs);
		case "constraint5":
			return new Constraint5(x, y, classification, kind, serializedArgs);
		case "constraint6":
			return new Constraint6(x, y, classification, kind, serializedArgs);
		default:
			throw new Error(`Unknown constraint ${kind}`);
	}
}

export default async function() {
	let module = await loader.instantiateStreaming(fetch(wasmPath as unknown as string), {
		env: {},
		index: {
			"console.logI": (x: number) => console.log("Wasm:", x),
			"console.logS": (x: number) => console.log("Wasm:", module.getString(x)),
			"console.logIA": (x: number) => console.log("Wasm:", module.getArray(Int32Array, x)),
		},
	});

	return new Bootstrap.WasmModule(module, newConstraint);
}

