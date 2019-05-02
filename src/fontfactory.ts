export class FontFactory {
	static createDynamicFont(game: g.Game, size: number, fontFamily: g.FontFamily = g.FontFamily.Monospace) {
		return new g.DynamicFont({
			game,
			size,
			fontFamily
		});
	}
}
