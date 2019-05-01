import {Tile} from "@akashic-extension/akashic-tile";
import {Natalia} from "./natalia";
import {Ogre, OgreFactory} from "./ogre";
import {Sushi, SushiFactory} from "./sushi";

const DEFAULT_CHIP_SIZE = 48;
const SUSHI_LIMIT = 3;
const OGRE_THRESHOLD = 1000;
const MAX_OGRE_COUNT = 10;
export = (param: g.GameMainParameterObject): void => {
	const scene = new g.Scene({
		game: g.game,
		assetIds: []
	});
	let score: number = 0;
	let tile: Tile;
	let natalia: Natalia;
	let cardboardSprite: g.Sprite;
	const ogres: Ogre[] = [];
	const sushis: Sushi[] = [];
	scene.loaded.add(() => {
		tile = new Tile({
			scene,
			src: this.assets["mapchips"],
			tileWidth: 32,
			tileHeight: 32,
			tileData: JSON.parse((this.assets["field"] as g.TextAsset).data)
		});
		scene.append(tile);
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
		cardboardSprite = new g.Sprite({
			scene: scene,
			src: scene.assets["cardboard"] as g.ImageAsset,
			width: 0.89 * DEFAULT_CHIP_SIZE,
			height: DEFAULT_CHIP_SIZE,
			srcWidth: 677,
			srcHeight: 761,
			hidden: true
		});
		scene.append(cardboardSprite);
		scene.update.add(() => {

		});
	});
	g.game.pushScene(scene);
};

const eatenSushi = (natalia: Natalia, sushi: Sushi): boolean => {
	return g.Collision.intersectAreas(natalia.getCommonArea(), sushi.getCommonArea());
};

const isFound = (natalia: Natalia, ogre: Ogre): boolean => {
	return natalia.isMoving() && g.Collision.intersectAreas(natalia.getCommonArea(), ogre.getSearchArea());
};

const isCaught = (natalia: Natalia, ogres: Ogre[]): boolean => {
	return ogres.some(ogre => g.Collision.intersectAreas(natalia.getCommonArea(), ogre.getCommonArea()));
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
		sushis.push(SushiFactory.create(scene, sushiType, place.x, place.y));
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
		ogres.push(OgreFactory.create(scene, place.x, place.y));
	}
};

const hideEvent = (natalia: Natalia, ogres: Ogre[], cardboard: g.Sprite): void => {
	cardboard.hide();
	natalia.setStatus("move");
	ogres.forEach(ogre => ogre.lost());
};

const getRandomPlace = (): g.CommonOffset => {
	const x = DEFAULT_CHIP_SIZE * g.game.random.get(0, Math.floor(g.game.width / DEFAULT_CHIP_SIZE) - 1);
	const y = DEFAULT_CHIP_SIZE * g.game.random.get(0, Math.floor(g.game.height / DEFAULT_CHIP_SIZE) - 1);
	return {x, y};
};
