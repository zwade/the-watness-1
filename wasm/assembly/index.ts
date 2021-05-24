import "allocator/arena";
import { JSONDecoder, JSONHandler } from "../../node_modules/assemblyscript-json/assembly/decoder";
import { JSONEncoder } from "../../node_modules/assemblyscript-json/assembly/encoder";

declare namespace console {
	function logS(x: string): void;
	function logI(x: i32): void;
}

// @ts-ignore
export { memory } // I promise this is kosher

NativeMath.seedRandom(Date.now()); // again, totally kosher

export const genShuff = function(s: i32): i32[] {
	let shuffle = <i32[]>new Array(s);
	for (let i = 0; i < s; i++) {
		shuffle[i] = i
	}
	for (let i = 0; i < s; i++) {
		Math.random();
		let l = <i32>Math.floor(Math.random() * <f64>(s - i))
		let tmp = shuffle[l + i]
		shuffle[l + i] = shuffle[i]
		shuffle[i] = tmp
	}
	return shuffle
}

export const copyPath = function(path: PathMarker[]): PathMarker[] {
	let result: PathMarker[] = new Array<PathMarker>();
	for (let i = 0; i < path.length; i++) {
		let newElement = new PathMarker(path[i].x, path[i].y, path[i].mark, path[i].tried);
		result.push(newElement);
	}

	return result;
}


export function gaussian (): f64 {
	let n: f64 = 100
	let sum: f64 = 0
	for (let i = 0; i < n; i++) {
		sum += Math.random()
	}
	sum = sum - n * 0.5
	sum = sum / (Math.sqrt(n * 1/12))

	return sum
}


export function arrayMap<T, U>(array: Array<T>, fn: (arg: T) => U): Array<U> {
	let result: Array<U> = new Array<U>();
	for (let i = 0; i < array.length; i++) {
		result.push(fn(array[i]));
	}
	return result;
}


function stringToUint8Array(s: string): Uint8Array {
	let array = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i++) {
		array[i] =  <i8>(load<i16>(changetype<usize>(s) + (i + 2) * 2));
	}
	return array;
}

function uint8ArrayToString(u: Uint8Array): string {
	let array = new Array<string>(u.length);
	for (let i = 0; i < u.length; i++) {
		array[i] = String.fromCharCode(u[i]);
	}
	let result = array.join("");
	return result;
}

function streq(a: string, b: string): boolean {
	let ap = stringToUint8Array(a);
	let bp = stringToUint8Array(b);

	if (ap.length !== bp.length) {
		return false;
	}

	for (let i = 0; i < ap.length; i++) {
		if (ap[i] !== bp[i]) {
			return false;
		}
	}

	return true;
}

export function ArrayLen<T>(array: Array<T>): i32 {
	return array.length;
}

export function ArrayIndex<T>(array: Array<T>, index: i32): T {
	return array[index];
}

export function _constrainer(): void {
	let x: BoardMatrixElement[][] = [];
	let y: PartitionListElement[][] = [];
	ArrayLen<BoardMatrixElement[]>(x);
	ArrayLen<BoardMatrixElement>(x[0]);
	ArrayLen<PartitionListElement[]>(y);
	ArrayLen<PartitionListElement>(y[0]);
	ArrayIndex<BoardMatrixElement[]>(x, 0);
	ArrayIndex<BoardMatrixElement>(x[0], 0);
	ArrayIndex<PartitionListElement[]>(y, 0);
	ArrayIndex<PartitionListElement>(y[0], 0);
}


class PathMarker {
	x: i32;
	y: i32;
	mark: boolean;
	tried: boolean;

	constructor(x: i32, y: i32, mark: boolean, tried: boolean) {
		this.x = x;
		this.y = y;
		this.mark = mark;
		this.tried = tried;
	}
}


export class BoardMatrixElement {
	p: i32;
	t: Constraint | null;

	constructor(p: i32, t: Constraint | null) {
		this.p = p;
		this.t = t;
	}

	public static create(p: i32, t: Constraint | null): BoardMatrixElement {
		return new BoardMatrixElement(p, t);
	}
}

type BoardMatrix = BoardMatrixElement[][];


export class PartitionListElement {
	x: i32;
	y: i32;
	t: Constraint | null;

	constructor(x: i32, y: i32, t: Constraint | null) {
		this.x = x;
		this.y = y;
		this.t = t;
	}

	public static create(x: i32, y: i32, t: Constraint | null): PartitionListElement {
		return new PartitionListElement(x, y, t);
	}
}


type PartitionList = PartitionListElement[][];

class CoordinatePair {
	x: i32;
	y: i32;

	constructor(x: i32, y: i32) {
		this.x = x;
		this.y = y;
	}
}


export class Constraint {
	public x: i32;
	public y: i32;
	public classification: i32;
	public name: string;
	public serializedArgs: string;


	constructor (x: i32, y: i32, classification: i32, name: string, serializedArgs: string | null) {
		this.x = x;
		this.y = y;
		this.classification = classification;
		this.name = name;

		if (serializedArgs === null) {
			this.serializedArgs = "";
		} else {
			this.serializedArgs = serializedArgs;
		}
	}



	public col (x: i32, y: i32, r: i32, classification: i32, name: string): void {
		throw new Error("Uncallable");
	}

	public static check(mtx: BoardMatrix, parts: PartitionList, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		return [];
	}

	public static gen(mtx: BoardMatrix, parts: PartitionList, num: i32, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		return [];
	}

}

export class Constraint1 extends Constraint {
	constructor (x: i32, y: i32, classification: i32, name: string | null, serializedArgs: string | null) {
		if (name === null) {
			name = "constraint1";
		}

		super(x, y, classification, name, serializedArgs);
	}

	public static check (mtx: BoardMatrix, parts: PartitionList, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let invalid: Constraint[] = new Array<Constraint>();
		for (let i = 0; i < parts.length; i++) {
			let currentClass = -1
			for (let j = 0; j < parts[i].length; j++) {
				let t = parts[i][j].t;
				if (t !== null && streq(t.name, "constraint1")) {
					if (currentClass == -1) {
						currentClass = t.classification
					} else if (t.classification != currentClass) {
						console.logS("Invalid constraint1");
						console.logI(t.x);
						console.logI(t.y);
						invalid.push(<Constraint>t)
					}
				}
			}
		}
		return invalid;
	}

	public static gen(mtx: BoardMatrix, parts: PartitionList, num: i32, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let decay = 3/4;
		let offset = 2;

		let out: Constraint[] = new Array<Constraint>();
		for (let pi = 0; pi < parts.length; pi++) {
			let prob = 0.7
			let part = parts[pi]
			let p = pi
			let shuffle = genShuff(part.length)	
			//Number chosen from excessive tweaking
			if (Math.random() < 0.15) {
				while (parts.length > 1 && p == pi) { 
					p = <i32>Math.floor(Math.random() * parts.length)
				}
			}

			for (let i = 0; i < shuffle.length; i++) {
				if (Math.random() < prob) {
					prob = prob * decay/((num + (offset - 1))/offset)
					let pl = part[shuffle[i]]
					let blb = new Constraint1(pl.x, pl.y, p, null, null)
					mtx[pl.y][pl.x].t = blb
					part[shuffle[i]].t = blb
					out.push(blb)
				}
			}
		}
		return out
	}
}


export class Constraint2 extends Constraint {
	constructor (x: i32, y: i32, classification: i32, name: string | null, serializedArgs: string | null) {
		if (name === null) {
			name = "constraint2";
		}
		super(x, y, classification, name, serializedArgs);
	}

	public static gen(mtx: BoardMatrix, parts: PartitionList, num: i32, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let out: Constraint[] = new Array<Constraint>();
		for (let p = 0; p < parts.length; p++) { 
			let part = parts[p]
			let avail = 0
			let cols: Map<i32, i32> = new Map();
			let classes: i32[] = new Array<i32>();


			for (let i = 0; i < part.length; i++) {
				let t = part[i].t;
				if (!t) {
					avail++
				} else {
					if (streq(t.name, "constraint1") || streq(t.name, "constraint2")) {
						let classification = t.classification;
						if (!(cols.has(classification))) {
							cols.set(classification, 0);
							cols.get(classification);
							classes.push(classification);
						}
						cols.set(classification, cols.get(classification)! + 1);
					}
				}
			}

			
			let max = Math.floor(avail/2)
			let should = Math.ceil(max * 1/(1+num))
			let will = Math.round(gaussian() + should)
			will = Math.min(will, max)

			let shuffle = genShuff(part.length)

			let insertConstraint2 = function(mtx: BoardMatrix, part: PartitionListElement[], shuffle: i32[], out: Constraint[], classification: i32): void {
				let shuffi = 0;
				while (part[shuffle[shuffi]].t !== null) {shuffi++}
				let i = shuffle[shuffi]
				let st = new Constraint2(part[i].x, part[i].y, classification, null, null);
				part[i].t = st
				mtx[st.y][st.x].t = st
				out.push(st)
			}

			if (will > 0) {
				for (let i = 0; i < classes.length; i++) {
					let v = classes[i];
					if (cols.get(v) === 1) {
						insertConstraint2(mtx, part, shuffle, out, v);
						will--
						break
					}
				}
			}

			let i = 0;
			while (will > 0) {
				while (classes.length < parts.length) {
					if (cols.has(i) === false) {
						break
					}
					i++
				}
				insertConstraint2(mtx, part, shuffle, out, i);
				insertConstraint2(mtx, part, shuffle, out, i);
				i++
				will--
			}
		}
		return out
	}

	public static check (mtx: BoardMatrix, parts: PartitionList, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let invalid: Constraint[] = new Array<Constraint>();
		for (let p = 0; p < parts.length; p++) {
			let cols: Map<i32, i32> = new Map();
			let constraint2s: Map<i32, Constraint[]> = new Map();
			let classes: i32[] = new Array<i32>();
			let part = parts[p]
			for (let i = 0; i < part.length; i++) {
				let t = part[i].t;
				if (t !== null && (streq(t.name, "constraint1") || streq(t.name, "constraint2"))) {
					let classification = t.classification;
					if (!cols.has(classification)) {
						cols.set(classification, 0);
						classes.push(classification);
					}

					if (streq(t.name, "constraint2")) {
						if (!constraint2s.has(classification)) {
							constraint2s.set(classification, new Array<Constraint>());
						}
						constraint2s.get(classification)!.push(<Constraint>t);
					}
					cols.set(classification, cols.get(classification)! + 1); 
				}
			}
			for (let i = 0; i < classes.length; i++) {
				let cls = classes[i];
				if (constraint2s.has(cls) && constraint2s.get(cls)!.length > 0 && cols.get(cls) != 2) {
					invalid = invalid.concat(constraint2s.get(cls)!);
				}
			}
		}
		return invalid;
	}
}


export class Constraint3 extends Constraint {
	private shape: i32[][];

	constructor (x: i32, y: i32, classification: i32, name: string | null, serializedArgs: string | null) {
		if (name === null) {
			name = "constraint3";
		}
		super(x, y, classification, name, serializedArgs);
		if (serializedArgs !== null) {
			let shapeDecoder = new MatrixDecoder<i32>(decodeI32);
			let decoder = new JSONDecoder<MatrixDecoder<i32>>(shapeDecoder);
			decoder.deserialize(stringToUint8Array(serializedArgs));
			this.shape = shapeDecoder.getResult();
		} else {
			this.shape = []; // come back to me;
		}
	}

	private static checkHelper (
			element: PathMarker, 
			dir: CoordinatePair, 
			path: PathMarker[]
	): PathMarker | null {
		let x = element.x;
		let y = element.y;
		x += dir.x;
		y += dir.y;

		for (let i = 0; i < path.length; i++) {
			if (path[i].x === x && path[i].y === y) return path[i]
		}

		return null;
	}

	public static brute(
			match: (path: PathMarker[], shape: i32[][], el: PathMarker) => PathMarker[] | null,
			path: PathMarker[], 
			toCheck: i32[][][]
	): boolean {
		if (toCheck.length === 0) {
			return true ;
		}
		toCheck = toCheck.slice(1);

		path = copyPath(path)
		let shape = toCheck.pop()
		if (!shape) {
			return false;
		}
		for (let i = 0; i < path.length; i++) {
			let testResult = match(path, shape, path[i])
			if (testResult === null) {
				continue;
			}
			let test = <PathMarker[]>testResult;
			for (let e = 0; e < test.length; e++) test[e].mark = true
			let res = Constraint3.brute(match, path, toCheck)	
			for (let e = 0; e < test.length; e++) test[e].mark = false
			if (res) return true
		}
		return false
	}

	public static check (mtx: BoardMatrix, parts: PartitionList, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let match = (
				path: PathMarker[], 
				shape: i32[][], 
				el: PathMarker
		): PathMarker[] | null => {
			let out: PathMarker[] = new Array<PathMarker>();
			let sx = 0
			let sy = 0
			let run = true
			for (let i = 0; i < shape.length && run; i++) {
				for (let j = 0; j < shape[i].length && run; j++) {
					if (shape[i][j] !== 0) {
						sx = j
						sy = i
						run = false
					}
				}
			}
			for (let i = 0; i < shape.length; i++) {
				for (let j = 0; j < shape[i].length; j++) {
					if (shape[i][j] !== 0) {
						let res = Constraint3.checkHelper( el, new CoordinatePair(j-sx, i-sy) , path)
						if (res === null || res.mark) return null;
						out.push(<PathMarker>res)
					}
				}
			}
			return out
		}

		let invalid: Constraint[] = new Array<Constraint>();
		for (let p = 0; p < parts.length; p++) {
			let part = parts[p]

			let constraint3s: Constraint3[] = new Array<Constraint3>();
			let count = 0;
			for (let i = 0; i < part.length; i++) {
				let t = part[i].t
				if (t !== null && t instanceof Constraint3) {
					let constraint3 = <Constraint3>t;
					constraint3s.push(constraint3)

					let s = constraint3.shape
					for (let y = 0; y < s.length; y++) {
						for (let x = 0; x < s[y].length; x++) {
							if (s[y][x]) count++
						}
					}
				}
			}
			if (count != 0 && 
				(count != part.length 
					|| !Constraint3.brute(match, arrayMap<PartitionListElement, PathMarker>(part, (el: PartitionListElement): PathMarker => {
						return new PathMarker(el.x, el.y, false, false);
					}), arrayMap<Constraint3, i32[][]>(constraint3s, (x: Constraint3): i32[][] => x.shape)))) {

				invalid = invalid.concat(<Array<Constraint>>constraint3s);
			}
		}
		let result: Constraint[] = new Array<Constraint>();
		return result;
	}

	// I hate everything about this code
	//
	// Update: I hate it even more. Basically what's happening, is i'm doing a recursive search on the
	// partition to try and fill it with appx. 4 sized tiles, however, 
	// 	A: my search is pretty kludgey. I could probably use continuations to clean it up, but that's 
	// 		a project for a later day. 
	// 	B: There are some starting positions for which this algorithm doesn't work, so we have to try
	// 		all possible starting positions
	// 	C: Even with (B) there are some arrangements that won't be filled. In this case the only remaining
	// 		option is to surrender (and/or be more flexible with constraint3 sizes, but then you're adding 
	// 		in a factor of like (n + k + 1) Choose (n) because of bucketing
	// 	FFFFFFF: IT STILL DOESN"T FRICKING WORK WHY THE HECK DOES IT NOT WORK IM SO FRICKING DONE WITH THIS CODE FDJSDAJKFGHKJDFSJKHDFSHJKDFS
	// 	Z: I have resigned myself to sometimes letting it fail and just calling that part of the "randomness"
	//
	// TL;DR this is like O (n 2^(Sqrt n)) (I think) and I hate it.
	//

	//let global = "gross"

	private static formShape (
			path: PathMarker[],
			stack: PathMarker[], 
			shapes: PathMarker[][], 
			inputShape: PathMarker[], 
			size: i32, 
			remaining: i32
	): PathMarker[][] | null {
		let dirs: CoordinatePair[] = [
			new CoordinatePair(1, 0),
			new CoordinatePair(0, 1),
			new CoordinatePair(-1, 0),
			new CoordinatePair(0, -1),
		];
	
		let shape = copyPath(inputShape);
		if (remaining == 0) {
			let next = new Array<PathMarker[]>(1);
			next[0] = shape;
			return shapes.concat(next);
		}
		if (size == 0) {
			for (let i = 0; i < stack.length; i++) {
				let newStack = new Array<PathMarker>(1);
				newStack[0] = stack[i];
				let newShape = new Array<PathMarker[]>(1);
				newShape[0] = shape;
				let t = Constraint3.formShape(
					path,
					newStack, 
					shapes.concat(newShape), 
					new Array<PathMarker>(),
					<i32>Math.min(4, remaining), 
					remaining
				); 
				if (t !== null) return t
			}
			return null
		}

		stack = copyPath(stack)
		let part = copyPath(path)
		while (stack.length > 0) {
			let el = stack.pop()!;
			let pe = Constraint3.checkHelper(el, new CoordinatePair(0, 0), part);
			if (pe === null || pe.mark) continue
			pe.mark = true
			pe.tried = true
			let out: PathMarker[] = new Array<PathMarker>();
			let arr = genShuff(4)
			for (let idx = 0; idx < arr.length; idx++) {
				let i = arr[idx];
				let t = Constraint3.checkHelper(el, dirs[i], part)
				if (t !== null && !t.tried && !t.mark) {
					out.push(<PathMarker>t)
				}
			}
			let newShape = new Array<PathMarker>(1);
			newShape[0] = <PathMarker>pe;
			let test = Constraint3.formShape(part, stack.concat(out), shapes, shape.concat(newShape), size - 1, remaining - 1)
			pe.mark = false
			if (test) return test
		}
		return null
	}

	public static gen(mtx: BoardMatrix, parts: PartitionList, num: i32, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let shapeList = function (path: PathMarker[]): i32[][][] | null {
			//console.log("*-------------*")
			//global = path.length
			let shapesInitial: PathMarker[][] | null = null;
			for (let i = 0; i < path.length; i++) {
				//console.log("    Starting Position: "+i+" -------* ")
				let stack = new Array<PathMarker>();
				stack.push(path[i]);
				shapesInitial = Constraint3.formShape(path, stack, new Array<PathMarker[]>(), new Array<PathMarker>(), <i32>Math.min(4, path.length), path.length)
				if (shapesInitial !== null) break
			}

			if (shapesInitial === null) {
				return null;
			} else {
			}
			let shapes = <PathMarker[][]>shapesInitial;

			let constraint3s: i32[][][] = new Array<i32[][]>();

			for (let s = 0; s < shapes.length; s++) {
				let maxx = 0
				let minx = 10000 // Ok i'm a touch lazy
				let maxy = 0
				let miny = 10000
				for (let j = 0; j < shapes[s].length; j++) {
					let square = shapes[s][j]
					if (square.x > maxx) maxx = square.x
					if (square.x < minx) minx = square.x
					if (square.y > maxy) maxy = square.y
					if (square.y < miny) miny = square.y
				}

				let obj: i32[][] = new Array<i32[]>();
				for (let i = 0; i < (maxy - miny) + 1; i++) {
					obj[i] = new Array<i32>();
					for (let j = 0; j < (maxx - minx) + 1; j++) {
						obj[i][j] = 0
					}
				}
				for (let i = 0; i < shapes[s].length; i++) {
					obj[shapes[s][i].y - miny][shapes[s][i].x - minx] = 1
				}
				constraint3s.push(obj)
			}
			return constraint3s
		}

		let cons: Constraint[] = new Array<Constraint>();
		let partOrder = genShuff(parts.length);
		let prob = 1;
		for (let po = 0; po < parts.length; po++) {
			let part = parts[partOrder[po]]
			if (part.length < 4 && num > 1) {
				if (!(Math.random() < 0.1)) continue
			} else if (part.length > 16) {
				if (!(Math.random() < 0.1)) continue
			} else {
				if (!(Math.random() < prob)) continue 
			}

			let shapesInitial = shapeList(arrayMap<PartitionListElement, PathMarker>(part, (el: PartitionListElement): PathMarker => {
				return new PathMarker(el.x, el.y, false, false);
			}));

			if (shapesInitial === null) continue;
			let shapes = <i32[][][]>shapesInitial;

			let open = 0;
			for (let i = 0; i < part.length; i++) {
				if (!part[i].t) open++;
			}
			if (open < shapes.length) continue;

			let sn = 0;
			let order = genShuff(part.length);
			for (let sp = 0; sp < part.length && sn < shapes.length; sp++) {
				let argument = shapes[sn];
				let array = serializeI32(argument);
				let serializedArray = uint8ArrayToString(array);
				let p = order[sp];
				if (part[p].t === null) {
					let c = new Constraint3(
						part[p].x,
						part[p].y,
						sp,
						null,
						serializedArray,
					);
					part[p].t = c;
					mtx[part[p].y][part[p].x].t = c;
					cons.push(c);
					sn++
				}
			}
			prob = prob * 2/(num + 1);
		}
		return cons;
	}
}

export class Constraint4 extends Constraint {
	private value: i32;

	constructor (x: i32, y: i32, classification: i32, name: string | null, serializedArgs: string) {
		if (name === null) {
			name = "constraint4";
		}
		super(x, y, classification, name, serializedArgs);
		this.value = parseI32(serializedArgs);
	}

	public static check (mtx: BoardMatrix, parts: PartitionList, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let res = new Array<Constraint>();
		for (let y = 0; y < mtx.length; y++) {
			for (let x = 0; x < mtx[y].length; x++) {
				if (mtx[y][x].t !== null && streq((<Constraint>mtx[y][x].t).name, "constraint4")){
					let p = mtx[y][x].p;

					let total = horizontalPathSegments[y][x]
						+ horizontalPathSegments[y+1][x]
						+ verticalPathSegments[y][x]
						+ verticalPathSegments[y][x+1];

					if ((<Constraint4>mtx[y][x].t).value !== total) {
						res.push(<Constraint>mtx[y][x].t);
					}
				}
			}
		}
		return res;
	}

	public static gen(mtx: BoardMatrix, parts: PartitionList, num: i32, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let res = new Array<Constraint>();
		for (let y = 0; y < mtx.length; y++) {
			for (let x = 0; x < mtx[y].length; x++) {
				if (Math.random() < 0.1 && mtx[y][x].t === null){
					let p = mtx[y][x].p;

					let total = horizontalPathSegments[y][x]
						+ horizontalPathSegments[y+1][x]
						+ verticalPathSegments[y][x]
						+ verticalPathSegments[y][x+1];

					if (total !== 0) {
						let constraint = new Constraint4(x, y, p, null, total.toString());
						mtx[y][x].t = constraint;
						for (let i = 0; i < parts[p].length; i++) {
							if (parts[p][i].x === x && parts[p][i].y === y) {
								parts[p][i].t = constraint;
							}
						}

						res.push(constraint);
					}
				}
			}
		}
		return res;
	}
}

export class Constraint5 extends Constraint {
	constructor (x: i32, y: i32, classification: i32, name: string | null, serializedArgs: string) {
		if (name === null) {
			name = "constraint5";
		}
		super(x, y, classification, name, serializedArgs);
	}

	public static check (mtx: BoardMatrix, parts: PartitionList, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let res = new Array<Constraint>();
		for (let i = 0; i < parts.length; i++) {
			let total: i32 = 0
			let entity: i32 = 0
			let currentEntities = new Array<Constraint>();
			for (let j = 0; j < parts[i].length; j++) {
				let t = parts[i][j].t;
				if (t !== null && streq(t.name, "constraint5")) {
					entity ++;
					currentEntities.push(<Constraint>t);
				}

				if (parts[i][j].x - 1 < 0 || mtx[parts[i][j].y][parts[i][j].x - 1].p !== i) {
					total ++;
				}
				if (parts[i][j].x + 1 >= mtx[parts[i][j].y].length || mtx[parts[i][j].y][parts[i][j].x + 1].p !== i) {
					total ++;
				}
				if (parts[i][j].y - 1 < 0 || mtx[parts[i][j].y - 1][parts[i][j].x].p !== i) {
					total ++;
				}
				if (parts[i][j].y + 1 >= mtx.length || mtx[parts[i][j].y + 1][parts[i][j].x].p !== i) {
					total ++;
				}
			}
			if (entity !== 0 && (total + 2) % 3 + 1 !== entity) {
				res = res.concat(currentEntities);
			}
		}
		return res;
	}

	public static gen(mtx: BoardMatrix, parts: PartitionList, num: i32, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let res = new Array<Constraint>();
		for (let i = 0; i < parts.length; i++) {
			let total: i32 = 0
			let numFree: i32 = 0
			for (let j = 0; j < parts[i].length; j++) {
				let t = parts[i][j].t;
				if (t === null) {
					numFree ++;
				}

				if (parts[i][j].x - 1 < 0 || mtx[parts[i][j].y][parts[i][j].x - 1].p !== i) {
					total ++;
				}
				if (parts[i][j].x + 1 >= mtx[parts[i][j].y].length || mtx[parts[i][j].y][parts[i][j].x + 1].p !== i) {
					total ++;
				}
				if (parts[i][j].y - 1 < 0 || mtx[parts[i][j].y - 1][parts[i][j].x].p !== i) {
					total ++;
				}
				if (parts[i][j].y + 1 >= mtx.length || mtx[parts[i][j].y + 1][parts[i][j].x].p !== i) {
					total ++;
				}
			}

			if (numFree > 3 && (numFree > 12 || Math.random() < (numFree - 3)/12 + 0.2)) {
				let order = genShuff(parts[i].length);
				let remaining = (total + 2) % 3 + 1;
				let j = 0;
				while (remaining > 0) {
					let element = parts[i][order[j]];
					if (element.t === null) {
						let constraint = new Constraint5(element.x, element.y, 0, null, "");
						element.t = constraint;
						mtx[element.y][element.x].t = constraint;
						res.push(constraint)
						remaining --;
					}
					j ++;
				}
			}
		}
		return res;
	}
}


export class Constraint6 extends Constraint {

	constructor (x: i32, y: i32, classification: i32, name: string | null, serializedArgs: string) {
		if (name === null) {
			name = "constraint6";
		}
		super(x, y, classification, name, serializedArgs);
	}

	public static check (mtx: BoardMatrix, parts: PartitionList, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let res = new Array<Constraint>();
		for (let y = 0; y < mtx.length; y++) {
			for (let x = 0; x < mtx[y].length; x++) {
				if (mtx[y][x].t !== null && streq((<Constraint>mtx[y][x].t).name, "constraint6")){
					let p = mtx[y][x].p;

					let total = horizontalPathSegments[y][x]
						+ horizontalPathSegments[y+1][x]
						+ verticalPathSegments[y][x]
						+ verticalPathSegments[y][x+1];

					if (total !== 0) {
						res.push(<Constraint>mtx[y][x].t);
					}
				}
			}
		}
		return res;
	}

	public static gen(mtx: BoardMatrix, parts: PartitionList, num: i32, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): Constraint[] {
		let res = new Array<Constraint>();
		for (let y = 0; y < mtx.length; y++) {
			for (let x = 0; x < mtx[y].length; x++) {
				if (Math.random() < 0.2 && mtx[y][x].t === null){
					let p = mtx[y][x].p;

					let total = horizontalPathSegments[y][x]
						+ horizontalPathSegments[y+1][x]
						+ verticalPathSegments[y][x]
						+ verticalPathSegments[y][x+1];

					if (total === 0) {
						console.logS("Generating");
						let constraint = new Constraint6(x, y, <i32>Math.floor(Math.random() * 3), null, "");
						mtx[y][x].t = constraint;
						for (let i = 0; i < parts[p].length; i++) {
							if (parts[p][i].x === x && parts[p][i].y === y) {
								parts[p][i].t = constraint;
							}
						}

						res.push(constraint);
					}
				}
			}
		}
		return res;
	}
}


export function checkAll(mtx: BoardMatrix, parts: PartitionList, horizontalPathSegments: i32[][], verticalPathSegments: i32[][]): i32 {
	let invalid = Constraint1.check(mtx, parts, horizontalPathSegments, verticalPathSegments).length;
	invalid += (Constraint2.check(mtx, parts, horizontalPathSegments, verticalPathSegments)).length;
	invalid += (Constraint3.check(mtx, parts, horizontalPathSegments, verticalPathSegments)).length;
	invalid += (Constraint4.check(mtx, parts, horizontalPathSegments, verticalPathSegments)).length;
	invalid += (Constraint5.check(mtx, parts, horizontalPathSegments, verticalPathSegments)).length;
	invalid += (Constraint6.check(mtx, parts, horizontalPathSegments, verticalPathSegments)).length;
	return invalid;
}

export class State {
	public mtx: BoardMatrix;
	public parts: PartitionList;

	constructor(mtx: BoardMatrix, parts: PartitionList) {
		this.mtx = mtx;
		this.parts = parts;
	}

	public static create(mtx: BoardMatrix, parts: PartitionList): State {
		return new State(mtx, parts);
	}
}

export function genAll(
		state: State, 
		horizontalPathSegments: i32[][], 
		verticalPathSegments: i32[][],
		c1: bool,
		c2: bool,
		c3: bool,
		c4: bool,
		c5: bool,
		c6: bool,
): State {
	if (c1) Constraint1.gen(state.mtx, state.parts, 3, horizontalPathSegments, verticalPathSegments);
	if (c2) Constraint2.gen(state.mtx, state.parts, 3, horizontalPathSegments, verticalPathSegments);
	if (c3) Constraint3.gen(state.mtx, state.parts, 3, horizontalPathSegments, verticalPathSegments);
	if (c4) Constraint4.gen(state.mtx, state.parts, 3, horizontalPathSegments, verticalPathSegments);
	if (c5) Constraint5.gen(state.mtx, state.parts, 3, horizontalPathSegments, verticalPathSegments);
	if (c6) Constraint6.gen(state.mtx, state.parts, 3, horizontalPathSegments, verticalPathSegments);

	return state;
}

class MatrixDecoder<T> extends JSONHandler {
	private mtx: T[][];
	private depth: i32 = 0;
	private activeElement: Map<string, string> | null;
	private cns: (map: Map<string, string>) => T;


	constructor(cns: (map: Map<string, string>) => T) {
		super();
		this.mtx = new Array<T[]>();
		this.cns = cns;
	}

	pushArray(key: string): boolean {
		if (this.depth === 0) {
			this.depth = 1;
		} else if (this.depth === 1) {
			this.mtx.push(new Array<T>());
			this.depth = 2;
		} else {
			unreachable();
		}
		return true;
	}

	popArray(): void {
		if (this.depth === 1) {
			// we're done;
		} else {
			// step down a level;
			this.depth = 1;
		}
	}

	pushObject(key: string): boolean {
		assert(this.activeElement === null);

		this.activeElement = new Map<string, string>();

		return true;
	}

	popObject(): void {
		assert(this.activeElement !== null);

		this.mtx[this.mtx.length - 1].push(this.cns(<Map<string,string>>this.activeElement));
		this.activeElement = null;
	}

	setString(key: string, value: string): void {
		assert(this.activeElement !== null);
		(<Map<string, string>>this.activeElement).set(key, value);
	}

	getResult(): T[][] {
		return this.mtx;
	}
}

function decodeConstraint(map: Map<string, string>): Constraint | null {
	let kind = map.get("t");

	if (kind === null || streq(kind, "null")) {
		return null;
	}

	let x = map.get("t.x");
	let y = map.get("t.y");
	let classification = map.get("t.classification");
	let serializedArgs = map.get("t.serializedArgs");

	if (x === null || y === null || classification === null) {
		console.logS("Bad args");
		return unreachable();
	}

	let xi32 = parseI32(<string>x);
	let yi32 = parseI32(<string>y);
	let ci32 = parseI32(<string>classification);

	if (streq(kind, "constraint1")) {
		return new Constraint1(xi32, yi32, ci32, null, serializedArgs);
	} else if (streq(kind, "constraint2")) {
		return new Constraint2(xi32, yi32, ci32, null, serializedArgs);
	} else if (streq(kind, "constraint3")) {
		return new Constraint3(xi32, yi32, ci32, null, serializedArgs);
	} else if (streq(kind, "constraint4")) {
		return new Constraint4(xi32, yi32, ci32, null, <string>serializedArgs);
	} else if (streq(kind, "constraint5")) {
		return new Constraint5(xi32, yi32, ci32, null, <string>serializedArgs);
	} else if (streq(kind, "constraint6")) {
		return new Constraint6(xi32, yi32, ci32, null, <string>serializedArgs);
	}

	console.logS("Bad kind");
	console.logS(kind);
	return unreachable();
}

function decodeBoardMatrixElement(map: Map<string, string>): BoardMatrixElement {
	let p = map.get("p");
	let t = decodeConstraint(map);

	if (p === null) {
		return unreachable();
	}

	let pi32 = parseI32(<string>p);

	return new BoardMatrixElement(pi32, t);
}

function decodePartitionListElement(map: Map<string, string>): PartitionListElement {
	let x = map.get("x");
	let y = map.get("y");
	let t = decodeConstraint(map);

	if (x === null || y === null) {
		return unreachable();
	}

	let xi32 = parseI32(x);
	let yi32 = parseI32(y);

	return new PartitionListElement(xi32, yi32, t);
}

function decodeI32(map: Map<string, string>): i32 {
	let val = map.get("value");

	if (val === null) {
		return unreachable();
	}

	return (parseI32(val));
}

export function deserializeBoardMatrix(array: Uint8Array): BoardMatrix {
	let handler = new MatrixDecoder<BoardMatrixElement>(decodeBoardMatrixElement);
	let decoder = new JSONDecoder<MatrixDecoder<BoardMatrixElement>>(handler);
	decoder.deserialize(array);
	return handler.getResult();
}

export function deserializePartitionList(array: Uint8Array): PartitionList {
	let handler = new MatrixDecoder<PartitionListElement>(decodePartitionListElement);
	let decoder = new JSONDecoder<MatrixDecoder<PartitionListElement>>(handler);
	decoder.deserialize(array);
	return handler.getResult();
}

export function deserializeI32(array: Uint8Array): i32[][] {
	let handler = new MatrixDecoder<i32>(decodeI32);
	let decoder = new JSONDecoder<MatrixDecoder<i32>>(handler);
	decoder.deserialize(array);
	let result = handler.getResult();
	return result;
}

export function MatrixEncoder<T>(matrix: T[][], encodeFn: (encoder: JSONEncoder, element: T) => void): Uint8Array {
	let encoder = new JSONEncoder()
	encoder.pushArray(changetype<string>(0));
	for (let i = 0; i < matrix.length; i++) {
		encoder.pushArray(changetype<string>(0));
		for (let j = 0; j < matrix[i].length; j++) {
			encoder.pushObject(changetype<string>(0));
			encodeFn(encoder, matrix[i][j]);
			encoder.popObject();
		}
		encoder.popArray();
	}
	encoder.popArray();

	return encoder.serialize();
}

function encodeConstraint(encoder: JSONEncoder, element: Constraint | null): void {
	if (element === null) {
		encoder.setString("t", "null");
		return;
	}

	let t = element.name;
	let x = element.x.toString();
	let y = element.y.toString();
	let classification = element.classification.toString();
	let serializedArgs = element.serializedArgs;

	encoder.setString("t", t);
	encoder.setString("t.x", x);
	encoder.setString("t.y", y);
	encoder.setString("t.classification", classification)
	encoder.setString("t.serializedArgs", serializedArgs);
}

function encodeBoardMatrixElement(encoder: JSONEncoder, element: BoardMatrixElement): void {
	encoder.setString("p", element.p.toString());
	encodeConstraint(encoder, element.t);
}

function encodePartitionListElement(encoder: JSONEncoder, element: PartitionListElement): void {
	encoder.setString("x", element.x.toString());
	encoder.setString("y", element.y.toString());
	encodeConstraint(encoder, element.t);
}

function encodeI32(encoder: JSONEncoder, element: i32): void {
	encoder.setString("value", element.toString());
}

export function serializeBoardMatrix(mtx: BoardMatrix): Uint8Array {
	return MatrixEncoder<BoardMatrixElement>(mtx, encodeBoardMatrixElement);
}

export function serializePartitionList(parts: PartitionList): Uint8Array {
	return MatrixEncoder<PartitionListElement>(parts, encodePartitionListElement);
}

export function serializeI32(list: i32[][]): Uint8Array {
	return MatrixEncoder<i32>(list, encodeI32);
}


