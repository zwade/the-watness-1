import * as $ from "jquery";
import { Constraint } from "./constraints";
import { Utils, PathUtils, Options, Aliases } from "@watness/common/src";

type BoardMatrix = Aliases.BoardMatrix<Constraint>
type PartitionList = Aliases.PartitionList<Constraint>
type Constrainer = Aliases.Constrainer<Constraint>

export type DeepPartial<T extends {}> = {
	[K in keyof T]?:
		T[K] extends {}
		? T[K] extends Array<infer U>
		? T[K] 
		: DeepPartial<T[K]>
		: T[K]
};

export function createGame (
		el: HTMLElement, 
		additionalOptions: DeepPartial<Options.GameOptions> = {}, 
		constrainers: Constrainer[],
		constraints: Constraint[],
) {
	let options = {...Options.defaultOptions, ...additionalOptions};

	options.tiles = options.tiles || {}
	options.colors = options.colors || {}

	let width = options.width || 800
	let height = options.height || 650
	let scale = options.scale || 0.5;
	let game = options.gameHeight || 512
	let w = options.tiles.width || 5
	let h = options.tiles.height || 5

	let constraint2ts = options.startingPoints || [{x:0, y:0}]
	let ends = options.endingPoints || [{x:0, y: h, d: 1}]

	let rad = options.circleRadius || 30
	let crad = options.pointerRadius || 16

	let pathColor = options.colors.grid || 0xFFD54F
	let shadowColor = options.colors.outline || 0xFFECB3
	let plateColor = options.colors.background || 0xFFA726
	let plateOpacity = options.colors.backgroundAlpha || 1
	let drawColor = options.colors.path || 0xFFFFEE
	let finColor = options.colors.completePath || 0xFFEB3B
	let cursorColor = options.colors.cursor || 0x9E9E9E

	let bgColor = 0x0


	let stage: PIXI.Container;
	let drawStage: PIXI.Container;
	let renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;

	let pathData = {
		circleSize: 0,
		selected: {
			x: 0,
			y: 0,
		},
		growRate: 0.2,
		fallRate: 0.3,
		active: false,
		cooldown: false,
		alpha: 1,
		paths: <{ x: number, y: number, l: number, d: number }[]>[],
		modded: {x: 0, y: 5, d: 0, l: 0},
		lerp: 0,
		bitmap: <PIXI.Sprite | null>null,
		fin: false,
		valid: false,
	}
	return new Promise<Aliases.Segment[]>(async (resolve, reject) => {
		$("witness-game").removeClass("gone");
		let draw = new PIXI.Graphics()
		let cursor = new PIXI.Graphics()

		let sX = (width  - game)/2
		let sY = (height - game)/2
		let gth = 100/w
		let sth = gth + 4
		let mFx = (game)/(w)
		let mFy = (game)/(h)

		rad = gth * 1.5

		let constraint2t = function() {

			let pointerLockChange = function() {
				setGameState((document as any).pointerLockElement === null)
			};

			let setGameState = function(hasPointerLock: boolean) {
				if (hasPointerLock) {
					pathData.cooldown = true
					pathData.bitmap = new PIXI.Sprite(renderer.generateTexture(draw))
					pathData.bitmap.position = new PIXI.Point(draw.getLocalBounds().x, draw.getLocalBounds().y);
					drawStage.addChild (pathData.bitmap)
					pathData.lerp = 0
					pathData.fin = false
					pathData.active = false
				} else {
					pathData.active = true
					pathData.circleSize = 0
					pathData.alpha = 1
				}
			}

			let mousemove = function(e: JQuery.MouseMoveEvent) {
				if (pathData.active && e.originalEvent) {
					movePath(e.originalEvent)
				}
			}

			let movePath = function(originalEvent: MouseEvent) {
				let m = pathData.modded

				//Crazy Trickery to get the corner traversal smooth
				//TODO: document this crap
				//TODO: put in its own function for goodness' sake
				let diff = Math.abs(m.l) % 1
				let toward = -1

				//See if we're moving toward or away from a junction
				if (1-diff < diff) {
					toward = toward * -1
					diff = 1-diff
				}

				//Transition axes
				if (diff < gth/mFx/4) {
					//transition y to x
					if (m.d == 1 && Math.abs(originalEvent.movementX) > Math.abs(originalEvent.movementY)) {
						//check for backtracking
						let bt = false
						if (Math.abs(m.l) < 0.5) {
							for (let i = 0; i < pathData.paths.length; i++) {
								let p = pathData.paths[i]
								if (p.d == 0 && p.y == m.y && p.x + p.l == m.x) {
									//We found a place to backtrack to
									pathData.modded = pathData.paths.splice(i, 1)[0]
									bt = true
									break
								}
							}
						}
						if (!bt) {
							pathData.paths.push({x: m.x, y: m.y, l: Math.round(m.l), d: 1})
							pathData.modded = {x: m.x, y: m.y + Math.round(m.l), d: 0, l: 0}
						}

					//transition x to y
					} else if (m.d == 0 && Math.abs(originalEvent.movementY) > Math.abs(originalEvent.movementX)) {
						//Same as above -- Probably a way to abstract away this code, but I didn't see an obvious way to
						let bt = false
						if (Math.abs(m.l) < 0.5) {
							for (let i = 0; i < pathData.paths.length; i++) {
								let p = pathData.paths[i]
								if (p.d == 1 && p.x == m.x && p.y + p.l == m.y) {
									pathData.modded = pathData.paths.splice(i, 1)[0]
									bt = true
									break
								}
							}
						}
						if (!bt) {
							pathData.paths.push({x: m.x, y: m.y, l: Math.round(m.l), d: 0})
							pathData.modded = {x: m.x + Math.round(m.l), y: m.y, d: 1, l: 0}
						}

					}
				} else if (diff < gth/mFx) {
					let norm = Math.sqrt(Math.pow(originalEvent.movementX, 2) + Math.pow(originalEvent.movementY, 2))
					if (norm > 0) {
						if (m.d == 1) {
							m.l = Math.sign(m.l) * (Math.abs(m.l) + toward * Math.abs(originalEvent.movementX)/2/mFx)
						} else if (m.d == 0) {
							m.l = Math.sign(m.l) * (Math.abs(m.l) + toward * Math.abs(originalEvent.movementY)/2/mFy)
						}
					}
				}

				let prev = pathData.fin
				pathData.fin = false
				m = pathData.modded
				if (m.d == 1) {
					m.l += originalEvent.movementY/mFy
					let prhps = clamp (-m.y, h - m.y, m.l)

					//If not in normal bounds, see if we're at an endpoint and allow it

					if (m.l > h - m.y || m.l < -m.y) {
						let Aok = false
						for (let i = 0; i < ends.length; i++) {
							if (ends[i].d % 2 == 1 && ends[i].x == m.x && ends[i].y == (m.y + prhps)) {
								if (m.l > h - m.y + 0.265) {
									pathData.fin = true
									m.l = h - m.y + 0.3
								}
								if (m.l < -m.y - 0.265) {
									pathData.fin = true
									m.l = -m.y - 0.3
								}
								Aok = true
								break
							}
						}
						if (!Aok) m.l = prhps 
					}

					//Check for intersecting with existing path

					if (Math.abs(m.l) > 0.5) {
						for (let i = 0; i < pathData.paths.length; i++) {
							let p = pathData.paths[i]
							//Ever heard of 80 character line limits? 
							//At least like half of this could be abstracted to helper methods
							if (p.d == 0 && (p.y <= Math.max (m.y, m.y + Math.round(m.l)) && p.y >= Math.min (m.y, m.y + Math.round(m.l)) && p.y != m.y) &&
									m.x <= Math.max (p.x, p.x + p.l) && m.x >= Math.min (p.x, p.x + p.l)) {
								if (m.l > 0) {
									m.l = Math.min(m.l, p.y - m.y - gth/mFy - 0.05)
									break
								} else {
									m.l = Math.max(m.l, p.y - m.y + gth/mFy + 0.05)
									break
								}
							}
						}
					}
				} else if (m.d == 0) {
					m.l += originalEvent.movementX/mFx
					let prhps = clamp (-m.x, w - m.x, m.l)

					//Theres gotta be a better way than writing all my code twice...
					
					if (m.l > w - m.x || m.l < -m.x) {
						let Aok = false
						for (let i = 0; i < ends.length; i++) {
							if (ends[i].d % 2 == 0 && ends[i].y == m.y && ends[i].x == (m.x + prhps)) {
								if (m.l > w - m.x + 0.265) {
									pathData.fin = true
									m.l = w - m.x + 0.3
								}
								if (m.l < -m.x - 0.265) {
									pathData.fin = true
									m.l = -m.x - 0.3
								}
								Aok = true
								break
							}
						}
						if (!Aok) m.l = prhps
					}

					if (Math.abs(m.l) > 0.5) {
						for (let i = 0; i < pathData.paths.length; i++) {
							let p = pathData.paths[i]

							if (p.d == 1 && (p.x <= Math.max (m.x, m.x + Math.round(m.l)) && p.x >= Math.min (m.x, m.x + Math.round(m.l)) && p.x != m.x) &&
									m.y <= Math.max (p.y, p.y + p.l) && m.y >= Math.min (p.y, p.y + p.l)) {
								if (m.l > 0) {
									m.l = Math.min(m.l, p.x - m.x - gth/mFx - 0.05)
									break
								} else {
									m.l = Math.max(m.l, p.x - m.x + gth/mFy + 0.05)
									break

								}
							}
						}
					}
				}
			}

			let board = new PIXI.Graphics()
			board.beginFill(plateColor)
			board.lineStyle(0, 0xFFFFFF)
			board.drawRect( sX, sY, game, game )
			board.endFill()
			stage.addChild(board)

			let paths  = new PIXI.Graphics()
			let shadow = new PIXI.Graphics()
			paths.beginFill(pathColor)
			shadow.beginFill(shadowColor)

			for (let i = 0; i < w+1; i++) {
				drawLine (paths,  i, 0, h, 1, gth)
				drawLine (shadow, i, 0, h, 1, sth)
			}
			for (let i = 0; i < h+1; i++) {
				drawLine (paths,  0, i, w, 0, gth)
				drawLine (shadow, 0, i, w, 0, sth)
			}


			for (let i = 0; i < constraint2ts.length; i++) {
				drawCircle( paths,  constraint2ts[i].x, constraint2ts[i].y, rad - 2)
				drawCircle( shadow, constraint2ts[i].x, constraint2ts[i].y, rad )
			}

			for (let i = 0; i < ends.length; i++) {
				drawLine (paths,  ends[i].x, ends[i].y, 0.3, ends[i].d, gth)
				drawLine (shadow, ends[i].x, ends[i].y, 0.3, ends[i].d, sth)
			}

			for (let i = 0; i < constraints.length; i++) {
				let { x, y, name, classification } = constraints[i];
				stage.addChild(constraints[i].col(sX + (x + 1/2) * mFx, sY + (y + 1/2) * mFy, mFx/6, classification, name))
			}

			let witnessClick = async function(this: HTMLElement, e: JQuery.ClickEvent) {
				if (e.which == 1 && !pathData.active) {
					for (let i = 0; i < constraint2ts.length; i++) {
						let cX = constraint2ts[i].x
						let cY = constraint2ts[i].y
						if (Math.sqrt(Math.pow(cX * mFx + sX - e.offsetX, 2) + 
							      Math.pow(cY * mFy + sY - e.offsetY, 2)) < rad) {
							(<any>this).requestPointerLock()
							pathData.modded = {
								x: cX,
								y: cY,
								d: 0,
								l: 0
							}
							pathData.selected = {x: cX, y: cY}
						}
					}
				} else if (e.which == 3) {
					(document as any).exitPointerLock()
				} else if (e.which == 1 && pathData.active) {
					if (!pathData.fin) {
						(document as any).exitPointerLock()
					} else {
						// Check win condition. Again, should be migrated to its own function but i'll do it later ;)
						pathData.valid = true
						let m = pathData.modded
						pathData.paths.push({x: m.x, y: m.y, l: Math.round(m.l), d: m.d})

						if (!PathUtils.determinePathLegality(w, h, constraint2ts[0], ends[0], [...pathData.paths])) {
							pathData.valid = false;
							(document as any).exitPointerLock()
							return;
						}

						let [horizontalPathSegments, verticalPathSegments] = PathUtils.getPathSegments(w, h, pathData.paths);
						let ps = PathUtils.partition(w, h, constraints)(pathData.paths)
						let mtx = ps[0]
						let parts = ps[1]
						let invalid = 0
						for (let i = 0; i < constrainers.length; i++) {
							invalid += (constrainers[i](mtx, parts, horizontalPathSegments, verticalPathSegments));
						}
						if (invalid > 0) {
							console.log("Invalid: ", invalid);
							pathData.valid = false;
						}
						if (pathData.valid) {
							console.log("Cancelling game");
							shutoff.cancel = true;
							$("witness-game > canvas").off("click", witnessClick);
							$(document).off("mousemove", mousemove);
							$(document).off("pointerlockchange", pointerLockChange);
							(document as any).exitPointerLock()
							await (new Promise((resolve) => setTimeout(resolve, 1000)));
							$("witness-game").addClass("gone");
							await (new Promise((resolve) => setTimeout(resolve, 1000)));
							$("witness-game > canvas").remove();
							resolve([...pathData.paths]);
						} else {
							(document as any).exitPointerLock()
						}
					}
				}
			}

			paths.endFill()
			paths.cacheAsBitmap = true
			shadow.endFill()
			shadow.cacheAsBitmap = true
			stage.addChild(shadow)
			stage.addChild(paths)

			drawStage.addChild(draw)
			drawStage.addChild(cursor)
			stage.addChild(drawStage)

			let shutoff = { cancel: false };
			requestAnimationFrame(animate(shutoff))		

			$("witness-game > canvas").on("click", witnessClick);
			$(document).on("mousemove", mousemove);
			$(document).on("pointerlockchange", pointerLockChange);
		}

		let lt = Date.now()

		let clamp = function(l: number, u: number, x: number) {
			if (u < l) {
				let tmp = u;
				u = l;
				l = tmp;
			}
			if (x < l) x = l;
			if (x > u) x = u;
			return x;
		}

		let drawLine = function(g: PIXI.Graphics, x: number, y: number, l: number, d: number, girth: number) {
			if (l < 0) {
				d = (d + 2) % 4;
				l = -l;
			}
			switch (d) {
				case 0: 
					g.drawRoundedRect ( sX + x * mFx - girth/2, sY + y * mFy - girth/2, l * mFx + girth, girth, girth/2 )
					break
				case 1: 
					g.drawRoundedRect ( sX + x * mFx - girth/2, sY + y * mFy - girth/2, girth, l * mFy + girth, girth/2 )
					break
				case 2: 
					g.drawRoundedRect ( sX + x * mFx - girth/2 - (l * mFx), sY + y * mFy - girth/2, l * mFx + girth, girth, girth/2 )
					break
				case 3: 
					g.drawRoundedRect ( sX + x * mFx - girth/2, sY + y * mFy - girth/2 - (l * mFy), girth, l * mFy + girth, girth/2 )
					break
			}
		}

		let drawCircle = function(g: PIXI.Graphics, x: number, y: number, rad: number) {
			g.drawCircle ( sX + x * mFx, sY + y * mFy, rad )
		}

		let animate = (shutoff: { cancel: boolean }) => function() {
			if (shutoff.cancel) {
				return;
			}

			requestAnimationFrame(animate(shutoff))

			let nt = Date.now()
			let dt = (nt-lt)/1000
			if (isNaN(dt)) {
				dt = 0
			}
			lt = nt

			//Animate mah paths
			if (pathData.active || pathData.cooldown) {
				if (!pathData.cooldown && pathData.bitmap) {
					drawStage.removeChild(pathData.bitmap)
					pathData.bitmap = null
				}
				draw.clear()
				cursor.clear()
				if (pathData.circleSize < rad) {
					pathData.circleSize += dt * rad/pathData.growRate * ((pathData.circleSize)/rad + 1)
				} else {
					pathData.circleSize = rad
				}

				if (pathData.cooldown) {
					if (pathData.alpha <= 0 && !pathData.valid) {
						pathData.alpha = 0
						pathData.active = false
						pathData.cooldown = false
						pathData.paths = []
						if (pathData.bitmap) {
							drawStage.removeChild(pathData.bitmap)
						}
						pathData.bitmap = null
						drawStage.alpha = 1
						draw.clear()
						cursor.clear()
					} else if (pathData.valid) {
						pathData.active = false
						pathData.cooldown = false
						pathData.valid = false
						pathData.paths = []
					} else {
						pathData.alpha -= dt * 1/pathData.fallRate 
						drawStage.alpha = pathData.alpha
					}
				} else {
					let c1 = Utils.RGBtoHSV(drawColor)
					let c2 = Utils.RGBtoHSV(finColor)
					let lerp = null
					if (pathData.fin) {
						pathData.lerp += dt/pathData.fallRate
						if (pathData.lerp > 1) pathData.lerp = 1
					} else {
						pathData.lerp -= dt/pathData.fallRate
						if (pathData.lerp < 0) pathData.lerp = 0
					}
					lerp = pathData.lerp * (Math.sin(nt/1000*8)/8 + 15/16)

					draw.beginFill(Utils.HSVtoRGB(c1.h + (c2.h - c1.h) * lerp, c1.s + (c2.s - c1.s) * lerp, c1.v + (c2.v - c1.v) * lerp))
					drawCircle( draw, pathData.selected.x, pathData.selected.y, pathData.circleSize)
					let m = pathData.modded
					if (pathData.circleSize >= sth/2) { // Lazy check to see if circle is drawn 
						drawLine(draw, m.x, m.y, m.l, m.d, sth)
						cursor.beginFill(drawColor, 0.66)
						cursor.lineStyle(3, 0x0, 0.1)

						drawCircle(cursor, m.x + (m.d == 0 ? m.l : 0), m.y + (m.d == 1 ? m.l : 0), crad)

						for (let i = 0; i < pathData.paths.length; i++) {
							let p = pathData.paths[i]
							drawLine(draw, p.x, p.y, p.l, p.d, sth)
						}
					}
					
					draw.endFill()
				}
			}

			renderer.render(stage)	
		}

		renderer = PIXI.autoDetectRenderer(
			width, 
			height,
			{transparent: true, backgroundColor : bgColor, antialias: true}
		);

		el.appendChild(renderer.view);
		stage = new PIXI.Container()
		drawStage = new PIXI.Container()
		constraint2t()
	})
}