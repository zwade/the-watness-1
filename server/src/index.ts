import * as express from "express";
import * as bodyParser from "body-parser";
import { generateBoard, getModule, checkBoard } from "./board";
import { Aliases, PathUtils } from "@watness/common";
import { Provider } from "nconf";
import * as path from "path";
import { fs } from "mz";

let nconf =
	(new Provider())
	.argv()
	.env()
	.defaults({
		"SERVER_SECRET": "supasecretpasswd2",
		"FLAG": "pctf{Please_bug_zwad3_to_make_a_real_flag}"
	});

const secret = nconf.get("SERVER_SECRET");

let app = express();
app.use(bodyParser.json());

app.options("*", (req, res) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Headers", "*");
	res.end();
});

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "../../client/index.html"));
})

app.use("/assets", express.static(path.join(__dirname, "../../client/assets")));
app.use("/css", express.static(path.join(__dirname, "../../client/css")));
app.use("/dist", (() => {
	let dist = express.static(path.join(__dirname, "../../client/dist"))
	return async (req: express.Request, res: express.Response, next) => {
		let extension = req.path.split(".").slice(-1)[0];
		let fileName = req.path.split("/").slice(-1)[0];
		if (extension === "wasm") {
			res.setHeader("Content-Type", "application/wasm");
			let file = await fs.readFile(path.join(__dirname, "../../client/dist", fileName)); 
			res.send(file);
		} else {
			dist(req, res, next);
		}
	}
})());

app.get("/get-puzzle", async (req, res) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	let module = await getModule();
	let args = await generateBoard();
	let stringified = module.serializeState(args, secret);
	res.header("Content-Type", "application/json").send(stringified);
});

app.post("/check-puzzle", async (req, res) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	let module = await getModule();
	let { bundle, segments } = <{ bundle: string, segments: Aliases.Segment[][] }>req.body;
	let args = module.deserializeState(bundle, secret);
	if (args === null) {
		return res.status(503).send("Bad signature");
	}
	let veracity = await checkBoard(args, segments);
	res.header("Content-Type", "application/json")
	if (veracity) {
		res.send({ correct: true, flag: nconf.get("FLAG") });
	} else {
		res.send({ correct: false });
	}
});

app.listen("7744");

process.on("unhandledRejection", (e) => { throw e });