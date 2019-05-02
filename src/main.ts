import {Tile} from "@akashic-extension/akashic-tile";
import {Natalia} from "./natalia";
import {Ogre, OgreFactory} from "./ogre";
import {Sushi, SushiFactory} from "./sushi";
import {FontFactory} from "./fontfactory";

const DEFAULT_CHIP_SIZE = 48;
const SUSHI_LIMIT = 5;
const OGRE_THRESHOLD = 1000;
const MAX_OGRE_COUNT = 13;
export = (param: g.GameMainParameterObject): void => {
	g.game.pushScene(createTitleScene());
};

const createTitleScene = (): g.Scene => {
	const scene = new g.Scene({
		game: g.game,
		assetIds: ["mgs_title"]
	});
	scene.loaded.add(() => {
		scene.append(createBgRect(scene));
		const titleSprite = new g.Sprite({
			scene: scene,
			src: scene.assets["mgs_title"] as g.ImageAsset,
			width: g.game.width,
			height: 0.29 * g.game.width,
			srcWidth: 1422,
			srcHeight: 417,
			y: 0.1 * g.game.height
		});
		scene.append(titleSprite);
		const font = FontFactory.createDynamicFont(g.game, 24);
		const miniLabel = new g.Label({
			scene,
			text: "- touch screen to play -",
			font,
			fontSize: font.size,
			textColor: "black",
			x: 0.3 * g.game.width,
			y: 0.8 * g.game.height
		});
		scene.append(miniLabel);
		scene.pointUpCapture.add(() => {
			g.game.pushScene(createDescriptionScene());
		});
	});
	return scene;
};

const createDescriptionScene = (): g.Scene => {
	const scene = new g.Scene({
		game: g.game,
		assetIds: ["mgs_description"]
	});
	scene.loaded.add(() => {
		scene.append(createBgRect(scene));
		const descriptionSprite = new g.Sprite({
			scene: scene,
			src: scene.assets["mgs_description"] as g.ImageAsset,
			width: g.game.width,
			height: 0.52 * g.game.width,
			srcWidth: 1500,
			srcHeight: 776,
			y: 0.1 * g.game.height
		});
		scene.append(descriptionSprite);
		const font = FontFactory.createDynamicFont(g.game, 24);
		const miniLabel = new g.Label({
			scene,
			text: "画面をタッチするとゲームが始まります。",
			font,
			fontSize: font.size,
			textColor: "black",
			x: 0.23 * g.game.width,
			y: 0.85 * g.game.height
		});
		scene.append(miniLabel);
		scene.pointUpCapture.add(() => {
			g.game.pushScene(createGameScene());
		});
	});
	return scene;
};

const createGameScene = (): g.Scene => {
	const scene = new g.Scene({
		game: g.game,
		assetIds: [
			"bikkuri",
			"cardboard",
			"mapchips",
			"nata_dan",
			"nata_escape",
			"ogre_dot",
			"pointer",
			"sushi_ebi",
			"sushi_salmon",
			"sushi_toro",
			"field",
			"normal_bgm",
			"found_bgm",
			"enemy_found",
			"gameover_se",
			"get_danball",
			"get_sushi"
		]
	});
	let score: number = 0;
	let tile: Tile;
	let natalia: Natalia;
	let cardboardSprite: g.Sprite;
	let scoreLabel: g.Label;
	const ogres: Ogre[] = [];
	const sushis: Sushi[] = [];
	scene.loaded.add(() => {
		tile = new Tile({
			scene,
			src: scene.assets["mapchips"],
			tileWidth: 32,
			tileHeight: 32,
			tileData: JSON.parse((scene.assets["field"] as g.TextAsset).data)
		});
		scene.append(tile);
		const font = FontFactory.createDynamicFont(g.game, 32);
		scoreLabel = new g.Label({
			scene,
			text: "SCORE: 0",
			font,
			fontSize: font.size,
			textColor: "white",
			x: 0.7 * g.game.width,
			y: 0
		});
		scene.append(scoreLabel);
		natalia = new Natalia({
			movingFrameSprite: new g.FrameSprite({
				scene: scene,
				src: scene.assets["nata_dan"] as g.ImageAsset,
				width: DEFAULT_CHIP_SIZE,
				height: DEFAULT_CHIP_SIZE,
				srcWidth: 80,
				srcHeight: 80,
				frames: [0, 1, 2, 3, 4, 5, 6, 7],
				frameNumber: 0,
				x: (g.game.width - DEFAULT_CHIP_SIZE) / 2,
				y: (g.game.height - DEFAULT_CHIP_SIZE) / 2
			}),
			escapeSprite: new g.Sprite({
				scene: scene,
				src: scene.assets["nata_escape"] as g.ImageAsset,
				width: DEFAULT_CHIP_SIZE,
				height: 0.76 * DEFAULT_CHIP_SIZE,
				srcWidth: 300,
				srcHeight: 230,
				x: (g.game.width - DEFAULT_CHIP_SIZE) / 2,
				y: (g.game.height - DEFAULT_CHIP_SIZE) / 2,
				hidden: true
			}),
			targetPlaceSprite: new g.FrameSprite({
				scene: scene,
				src: scene.assets["pointer"] as g.ImageAsset,
				width: DEFAULT_CHIP_SIZE,
				height: DEFAULT_CHIP_SIZE,
				srcWidth: 192,
				srcHeight: 192,
				frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
				frameNumber: 0
			})
		});
		natalia.register(scene);
		const cardboardPlace = getRandomPlace();
		cardboardSprite = new g.Sprite({
			scene: scene,
			src: scene.assets["cardboard"] as g.ImageAsset,
			width: 0.89 * DEFAULT_CHIP_SIZE,
			height: DEFAULT_CHIP_SIZE,
			srcWidth: 677,
			srcHeight: 761,
			x: cardboardPlace.x,
			y: cardboardPlace.y
		});
		scene.append(cardboardSprite);
		(scene.assets["normal_bgm"] as g.AudioAsset).play();
		scene.pointUpCapture.add((ev) => {
			natalia.setTargetPlace(ev.point.x, ev.point.y);
		});
		scene.update.add(() => {
			natalia.move();
			if (isHidden(natalia, cardboardSprite)) {
				hideEvent(scene, natalia, ogres, cardboardSprite);
			}
			ogres.forEach(ogre => {
				if (ogre.isFound()) {
					ogre.moveToTarget(natalia.getCommonArea());
					if (g.Collision.intersectAreas(natalia.getCommonArea(), ogre.getCommonArea())) {
						// ゲームオーバー
						console.log("game over");
						(scene.assets["found_bgm"] as g.AudioAsset).stop();
						(scene.assets["gameover_se"] as g.AudioAsset).play();
						g.game.pushScene(createGameOverScene(score));
					}
				} else {
					ogre.moveToSearch();
					if (isFound(natalia, ogre)) {
						(scene.assets["enemy_found"] as g.AudioAsset).play();
						ogre.find();
						if (natalia.status === "move") {
							(scene.assets["normal_bgm"] as g.AudioAsset).stop();
							(scene.assets["found_bgm"] as g.AudioAsset).play();
							natalia.setStatus("escape");
						}
					}
				}
			});
			let index = 0;
			while (index < sushis.length) {
				if (eatenSushi(natalia, sushis[index])) {
					(scene.assets["get_sushi"] as g.AudioAsset).play();
					score += sushis[index].getScore();
					scoreLabel.text = "SCORE: " + score;
					scoreLabel.invalidate();
					sushis[index].unregister(scene);
					sushis.splice(index, 1);
				} else {
					index++;
				}
			}
			addSushi(scene, sushis);
			addOgre(scene, ogres, score);
		});
	});
	return scene;
};

const createGameOverScene = (score: number): g.Scene => {
	const scene = new g.Scene({game: g.game});
	scene.loaded.add(() => {
		scene.append(createBgRect(scene));
		const font = FontFactory.createDynamicFont(g.game, 100);
		const gameoverLabel = new g.Label({
			scene,
			text: "GAME OVER",
			font,
			fontSize: font.size,
			textColor: "black",
			x: 0.22 * g.game.width,
			y: 0.1 * g.game.height
		});
		scene.append(gameoverLabel);
		const scoreLabel = new g.Label({
			scene,
			text: "SCORE: " + score,
			font,
			fontSize: font.size * 2 / 3,
			textColor: "black",
			x: 0.31 * g.game.width,
			y: 0.65 * g.game.height
		});
		scene.append(scoreLabel);
		const atsumaru = (window as any).RPGAtsumaru;
		const boardId = 1;
		if (atsumaru) {
			atsumaru.experimental.scoreboards.setRecord(boardId, score).then(() => {
				atsumaru.experimental.scoreboards.display(boardId);
			});
		}
	});
	return scene;
};

const eatenSushi = (natalia: Natalia, sushi: Sushi): boolean => {
	return g.Collision.intersectAreas(natalia.getCommonArea(), sushi.getCommonArea());
};

const isFound = (natalia: Natalia, ogre: Ogre): boolean => {
	return natalia.isMoving() && g.Collision.intersectAreas(natalia.getCommonArea(), ogre.getSearchArea());
};

const isHidden = (natalia: Natalia, sprite: g.Sprite): boolean => {
	const area = natalia.getCommonArea();
	return natalia.status === "escape"
		&& g.Collision.intersect(area.x, area.y, area.width, area.height, sprite.x, sprite.y, sprite.width, sprite.height);
};

const addSushi = (scene: g.Scene, sushis: Sushi[]): void => {
	const current = sushis.length;
	for (let i = 0; i < SUSHI_LIMIT - current; i++) {
		const sushiType = SushiFactory.getRandomSushiType();
		const place = getRandomPlace();
		const sushi = SushiFactory.create(scene, sushiType, place.x, place.y);
		sushi.register(scene);
		sushis.push(sushi);
	}
};

// 追加するかどうかの判定も一緒に行う。不都合が出たら切り離す感じで。
const addOgre = (scene: g.Scene, ogres: Ogre[], score: number): void => {
	const current = ogres.length;
	let next: number;
	for (next = current; next < MAX_OGRE_COUNT; next++) {
		if (next < 1) {
			continue;
		}
		if (score < OGRE_THRESHOLD * Math.pow(2, next - 1)) {
			break;
		}
	}
	for (let i = 0; i < next - current; i++) {
		const place = getRandomPlace();
		const ogre = OgreFactory.create(scene, place.x, place.y);
		ogre.register(scene);
		ogres.push(ogre);
	}
};

const hideEvent = (scene: g.Scene, natalia: Natalia, ogres: Ogre[], cardboard: g.Sprite): void => {
	(scene.assets["get_danball"] as g.AudioAsset).play();
	(scene.assets["found_bgm"] as g.AudioAsset).stop();
	(scene.assets["normal_bgm"] as g.AudioAsset).play();
	natalia.setStatus("move");
	ogres.forEach(ogre => ogre.lost());
	const place = getRandomPlace();
	cardboard.x = place.x;
	cardboard.y = place.y;
	cardboard.modified();
};

const getRandomPlace = (): g.CommonOffset => {
	const x = DEFAULT_CHIP_SIZE * g.game.random.get(0, Math.floor(g.game.width / DEFAULT_CHIP_SIZE) - 1);
	const y = DEFAULT_CHIP_SIZE * g.game.random.get(0, Math.floor(g.game.height / DEFAULT_CHIP_SIZE) - 1);
	return {x, y};
};

const createBgRect = (scene: g.Scene): g.FilledRect => {
	return new g.FilledRect({
		scene,
		cssColor: "white",
		width: g.game.width,
		height: g.game.height
	});
};
