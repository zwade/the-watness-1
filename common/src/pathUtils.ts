import { Aliases } from "./aliases";

export namespace PathUtils {
	export let generatePath = function(wo: number, ho: number, s: { x: number, y: number }, e: { x: number, y: number }) {
		//They pass width and height of vertex matrix, we need width and height of edge matrix
		let w = wo + 1
		let h = ho + 1

		let mtx: number[][] = []
		for (let i = 0; i < w; i++) {
			mtx[i] = []
			for (let j = 0; j < h; j++) {
				mtx[i][j] = -1
			}
		}

		let straightness = -0.1 //To be tweaked

		let dirEqual = function(d1: [number, number] | null, d2: [number, number] | null) {
			if (!d1 || !d2) return null
			return d1[0] == d2[0] && d1[1] == d2[1]
		}

		let arrToDir = function(dir: [number, number] | null) {
			if (dirEqual(dir, [1,0 ])) return 0
			if (dirEqual(dir, [-1,0])) return 2
			if (dirEqual(dir, [0,1 ])) return 1
			if (dirEqual(dir, [0,-1])) return 3
			return 0
		}

		let pathGen = function(
				el: [number, number], 
				lastDir: [number, number] | null, 
				currlength: number, 
				tlength: number, 
				mlength: number, 
				paths: { x: number, y: number, l: number, d: number }[]
		): { x: number, y: number, l: number, d: number }[] | null {
			mtx[el[1]][el[0]] = 1

			if (el[0] == e.x && el[1] == e.y) {
				if (tlength < mlength) return null
				let d = arrToDir(lastDir)
				paths.push({x: el[0], y: el[1], l: (d >= 2 ? 1 : -1) * currlength, d: d % 2})
				return paths
			}
			
			let dirs = [[1,0],[-1,0], [0,1],[0,-1]] as [number, number][];
			for (let i = 0; i < 4; i++) {
				let swp = Math.floor(Math.random() * (4-i))
				let tmp = dirs[i+swp]
				dirs[i+swp] = dirs[0]
				dirs[0] = tmp
			}
			if (straightness > 0) {
				if (Math.random() < straightness && lastDir) {
					for (let i = 0; i < dirs.length; i++) {
						if (dirEqual(dirs[i], lastDir)) {
							let tmp = dirs[i]
							dirs[i] = dirs[0]
							dirs[0] = tmp
							break
						}
					}
				}
			} else {
				if (Math.random() < -straightness && lastDir) {
					for (let i = 0; i < dirs.length; i++) {
						if (dirEqual(dirs[i], lastDir)) {
							let tmp = dirs[i]
							dirs[i] = dirs[3]
							dirs[3] = tmp
							break
						}
					}
				}
			}

			for (let i = 0; i < dirs.length; i++) {
				let nx = dirs[i][0] + el[0]
				let ny = dirs[i][1] + el[1]
				if (nx >= 0 && nx < w && ny >= 0 && ny < h && mtx[ny][nx] < 0) {
					if (!dirEqual(dirs[i], lastDir)) {
						let d = arrToDir(lastDir)
						paths.push({x: el[0], y: el[1], l: (d >= 2 ? 1 : -1) * currlength, d: d % 2})
						currlength = 0
					}
					lastDir = dirs[i]
					let out = pathGen([nx, ny], lastDir, currlength + 1, tlength + 1, mlength, paths.slice())
					if (out !== null) return out
				}
			}
			return null
		}

		return pathGen([s.x, s.y], null, 0, 0, 3 * w, [])

	}

	export function getPathSegments(gameWidth: number, gameHeight: number, paths: { x: number, y: number, l: number, d: number }[]) {
		let verticalPathSegments: number[][] = [];
		let horizontalPathSegments: number[][] = [];
		for (let i = 0; i < gameHeight; i++) {
			verticalPathSegments[i] = Array.from(new Array(gameWidth + 1), () => 0);
		}
		for (let i = 0; i < gameHeight + 1; i++) {
			horizontalPathSegments[i] = Array.from(new Array(gameWidth), () => 0);
		}
		for (let { x, y, l, d } of paths) {
			let dx = 0;
			let dy = 0;
			switch (d) {
				case 0:
					dx += l;
					break;
				case 1:
					dy += l;
					break;
				case 2:
					dx -= l;
					break;
				case 3:
					dy -= l;
					break;
				default:
					console.error(paths);
					throw new Error(`Unreasonable direction ${d}`);
			}

			for (let xv = Math.min(x, x + dx); xv < Math.max(x, x + dx); xv++) {
				horizontalPathSegments[y][xv] = 1;
			}

			for (let yv = Math.min(y, y + dy); yv < Math.max(y, y + dy); yv++) {
				verticalPathSegments[yv][x] = 1;
			}
		}

		return [horizontalPathSegments, verticalPathSegments];
	}

	export let partition = <C extends Aliases.AbstractConstraint>(w: number, h: number, constraints: C[]) => (path: Aliases.Segment[]) => {
		let mtx: Aliases.BoardMatrix<C> = [];
		for (let i = 0; i < h; i++) {
			mtx[i] = []
			for (let j = 0; j < w; j++) {
				mtx[i][j] = {p: -1, t: null}
			}
		}
		path = path.map(segment => ({...segment, d: segment.d % 2, l: segment.d < 2 ? segment.l : -segment.l }));

		let hasEdge = function(x1: number, y1: number, x2: number, y2: number) {
			if ( !(x1 == x2 && Math.abs(y2-y1) == 1) &&
			     !(y1 == y2 && Math.abs(x2-x1) == 1) ) {
				return false
			}
			if (y1 == y2) {
				let m = Math.max(x1, x2)
				for (let i = 0; i < path.length; i++) {
					if (path[i].x == m && (path[i].d % 2) == 1 &&
						y1 >= Math.min(path[i].y, path[i].y + path[i].l) &&
						y1 <  Math.max(path[i].y, path[i].y + path[i].l) ) {
						return true
					}
				}
			} else {
				let m = Math.max(y1, y2)
				for (let i = 0; i < path.length; i++) {
					if (path[i].y == m && (path[i].d % 2) == 0 &&
						x2 >= Math.min(path[i].x, path[i].x + path[i].l) &&
						x1 <  Math.max(path[i].x, path[i].x + path[i].l) ) {
						return true
					}
				}
			}
			return false

		}

		let fill = function(stack: { x: number, y: number }[], val: number, out: { x: number, y: number, t: C | null }[]): typeof out {

			//Gotta love this baconstraint2dization of functional and stateful proconstraint3ming
			if (stack.length == 0) return out
			let c = stack.pop()!
			if (mtx[c.y][c.x].p != -1) return fill(stack, val, out)
			let initial = { ...c, t: mtx[c.y][c.x].t };
			out.push(initial)

			//Mark
			mtx[c.y][c.x].p = val

			//Add neighbors to stack if there's no edge between them
			if (c.x > 0     && mtx[c.y][c.x - 1].p == -1 && !hasEdge(c.x, c.y, c.x - 1, c.y))
				stack.unshift({x: c.x - 1, y: c.y})

			if (c.x < w - 1 && mtx[c.y][c.x + 1].p == -1 && !hasEdge(c.x, c.y, c.x + 1, c.y))
				stack.unshift({x: c.x + 1, y: c.y})

			if (c.y > 0     && mtx[c.y - 1][c.x].p == -1 && !hasEdge(c.x, c.y, c.x, c.y - 1))
				stack.unshift({x: c.x, y: c.y - 1})

			if (c.y < h - 1 && mtx[c.y + 1][c.x].p == -1 && !hasEdge(c.x, c.y, c.x, c.y + 1))
				stack.unshift({x: c.x, y: c.y + 1})

			return fill(stack, val, out)
		}

		for (let i = 0; i < constraints.length; i++) {
			mtx[constraints[i].y][constraints[i].x].t = constraints[i]
		}

		let c = 0
		let parts = []
		for (let i = 0; i < h; i++) {
			for (let j = 0; j < w; j++) {
				if (mtx[i][j].p == -1) parts.push(fill([{x: j, y: i}], c++, []))
			}
		}

		return [mtx, parts] as [Aliases.BoardMatrix<C>, Aliases.PartitionList<C>];
	}

	export function determinePathLegality(
			w: number,
			h: number, 
			constraint2t: { x: number, y: number },
			end: { x: number, y: number },
			segments: Aliases.Segment[],
	): boolean {
		let intersectionMtx = Array.from(new Array(h + 1), () => Array.from(new Array(w + 1), () => false));

		if (segments.length === 0) {
			console.error("No path provided");
			return false
		}

		let currentX = constraint2t.x;
		let currentY = constraint2t.y;
		intersectionMtx[currentY][currentX] = true;

		for (let segment of segments) {
			if (segment.x !== currentX || segment.y !== currentY) {
				console.error("Path does not provide continuity");
				return false;
			}
			if (segment.l < 0) {
				segment.l = -segment.l;
				segment.d += 2;
				segment.d %= 4;
			}
			switch (segment.d) {
				case 0:
					for (let x = currentX; x < currentX + segment.l; x++) {
						if (x >= w) {
							console.error("Path goes out of bounds");
							return false
						}
						if (intersectionMtx[currentY][x+1]) {
							console.error("Path is self overlapping");
							return false;
						}
						intersectionMtx[currentY][x+1] = true;
					}
					currentX += segment.l;
					break;
				case 1:
					for (let y = currentY; y < currentY + segment.l; y++) {
						if (y >= h) {
							console.error("Path goes out of bounds");
							return false
						}
						if (intersectionMtx[y+1][currentX]) {
							console.error("Path is self overlapping");
							return false;
						}
						intersectionMtx[y+1][currentX] = true;
					}
					currentY += segment.l;
					break;
				case 2:
					for (let x = currentX; x > currentX - segment.l; x--) {
						if (x < 0) {
							console.error("Path goes out of bounds");
							return false
						}
						if (intersectionMtx[currentY][x-1]) {
							console.error("Path is self overlapping");
							return false;
						}
						intersectionMtx[currentY][x-1] = true;
					}
					currentX -= segment.l;
					break;
				case 3:
					for (let y = currentY; y > currentY - segment.l; y--) {
						if (y < 0) {
							console.error("Path goes out of bounds");
							return false
						}
						if (intersectionMtx[y-1][currentX]) {
							console.error("Path is self overlapping");
							return false;
						}
						intersectionMtx[y-1][currentX] = true;
					}
					currentY -= segment.l
					break;
				default:
					console.error("Moving in invalid direction");
					return false;
			}
		}
		if (currentX !== end.x || currentY !== end.y) {
			console.error("Path is not complete");
			return false;
		}

		return true;
	}

	export function mtxToString<C extends Aliases.AbstractConstraint>(mtx: { p: number, t: C | null}[][]) {
		let out = ""
		for (let i = 0; i < mtx.length; i ++) {
			for (let j = 0; j < mtx[i].length; j++) {
				if (mtx[i][j].t) {
					out += `[${mtx[i][j].p}]`;
				} else {
					out += ` ${mtx[i][j].p} `;
				}
			}
			out += "\n"
		}
		return out
	}

	export function pathToString(horizontalPathSegments: number[][], verticalPathSegments: number[][]) {
		let out = ""
		let gray = "\x1b[38;5;237m";
		let white = "\x1b[38;5;7m";
		let clear = "\x1b[0m";
		for (let i = 0; i < verticalPathSegments.length + 1; i++) {
			for (let j = 0; j < horizontalPathSegments[i].length; j++) {
				if (!horizontalPathSegments[i][j]) {
					out += `${gray}+---${clear}`
				} else {
					out += `${white}+---${clear}`
				}
			}
			out += `${gray}+${clear}\n`
			if (i === verticalPathSegments.length) {
				continue;
			}
			for (let j = 0; j < verticalPathSegments[i].length; j++) {
				if (!verticalPathSegments[i][j]) {
					out += `${gray}| · ${clear}`
				} else {
					out += `${white}|${gray} · ${clear}`
				}
			}
			out += "\n";
		}
		return out;
	}
}