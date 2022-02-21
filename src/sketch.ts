import { Color, Path, Vec2, Utils } from '@code-not-art/core';
import { Sketch, SketchProps, Params, Parameter, Config } from '@code-not-art/sketch';
import TruchetTiles, { Tile, TileOrientation } from './truchet';

const { repeat } = Utils;

const config = Config({
  menuDelay: 0,
});

const params: Parameter[] = [
  Params.header('Grid'),
  Params.range('imageFill', 1),
  Params.range('gridWidth', 11, { max: 128, min: 3, step: 1 }),
  Params.header('Paths'),
  Params.range('numColors', 2, { max: 5, min: 0, step: 1 }),
  Params.range('strokeFill', 0.3),
  Params.range('colorFuzz', 0.3, { min: 0, max: 20, step: 0.25 }),
  Params.checkbox('rounded', true),

  Params.header('Crosses'),
  Params.checkbox('allowCrosses', true),
  Params.checkbox('hideCrosses', true),
  Params.range('hideHorizontalChance', 0.5),
];

// const init = ({}: SketchProps) => {};

const draw = ({ canvas, palette, params, rng }: SketchProps) => {
  const gridWidth = params.gridWidth as number;
  const imageFill = params.imageFill as number;

  const numColors = params.numColors as number;
  const strokeFill = params.strokeFill as number;
  const rounded = params.rounded as boolean;
  const colorFuzz = params.colorFuzz as number;
  const allowCrosses = params.allowCrosses as boolean;
  const hideCrosses = params.hideCrosses as boolean;
  const hideHorizontalChance = params.hideHorizontalChance as number;

  canvas.draw.rect({
    height: canvas.get.height(),
    width: canvas.get.width(),
    point: Vec2.origin(),
    fill: '#191919',
  });

  const imageDim = canvas.get.minDim() * imageFill;

  canvas.transform.translate(new Vec2((canvas.get.width() - imageDim) / 2, (canvas.get.height() - imageDim) / 2));
  canvas.transform.scale(new Vec2(imageFill, imageFill));
  const tileWidth = canvas.get.minDim() / gridWidth;

  rng.push('trochet generation');
  const tileSet = new TruchetTiles(
    {
      height: gridWidth,
      width: gridWidth,
      allowCross: allowCrosses,
    },
    rng,
  );
  rng.pop();

  const pathColors: Record<number, Color> = {};
  const getPathColor = (path: number): Color => {
    if (numColors === 0) {
      // Use (near) white
      return new Color('#eee');
    }
    rng.push(`path color - ${path}`, { seed: `${path}` });
    if (pathColors[path]) {
      return pathColors[path];
    }
    const color = fuzzyColor(palette.colors[rng.int(0, numColors - 1)]);
    pathColors[path] = color;

    return color;
  };

  const fuzzyColor = (color: Color): Color =>
    new Color(color.color().darken(rng.fuzzy(0).int(colorFuzz)).lighten(rng.fuzzy(0).int(colorFuzz)).toRgbString());

  const drawPath = (path: Path, pathId: number): void => {
    canvas.draw.path({
      path,
      stroke: {
        color: getPathColor(pathId),
        width: strokeFill * tileWidth,
        cap: rounded ? 'round' : 'square',
      },
    });
  };

  function drawTile(tile: Tile, x: number, y: number) {
    // for each tile make an array of their lines as drawable paths and their path ID
    let paths: [Path, number][] = [];

    switch (tile.orientation) {
      case TileOrientation.LeftDown:
        const leftDown = new Path(new Vec2(x * tileWidth, (y + 0.5) * tileWidth)).line(
          new Vec2((x + 0.5) * tileWidth, (y + 1) * tileWidth),
        );

        const rightUp = new Path(new Vec2((x + 1) * tileWidth, (y + 0.5) * tileWidth)).line(
          new Vec2((x + 0.5) * tileWidth, y * tileWidth),
        );
        paths.push([leftDown, tile.path[0] || 0], [rightUp, tile.path[1] || 0]); // path should never be undefined, but the generation algorithm temporarily sets them that way. defaulting to 0 shouldnt be needed in practice but it will keep the TS linter happy. Yes, this means there is a problem with my implementation :P

        break;
      case TileOrientation.LeftUp:
        const leftUp = new Path(new Vec2(x * tileWidth, (y + 0.5) * tileWidth)).line(
          new Vec2((x + 0.5) * tileWidth, y * tileWidth),
        );

        const rightDown = new Path(new Vec2((x + 1) * tileWidth, (y + 0.5) * tileWidth)).line(
          new Vec2((x + 0.5) * tileWidth, (y + 1) * tileWidth),
        );
        paths.push([leftUp, tile.path[0] || 0], [rightDown, tile.path[1] || 0]);

        break;
      case TileOrientation.LeftRight:
        const hideHorizontal = hideCrosses && rng.bool(hideHorizontalChance);
        const hideVertical = hideCrosses && !hideHorizontal;
        const leftRight = new Path(new Vec2(x * tileWidth, (y + 0.5) * tileWidth)).line(
          new Vec2((x + 1) * tileWidth, (y + 0.5) * tileWidth),
        );

        const upDown = new Path(new Vec2((x + 0.5) * tileWidth, y * tileWidth)).line(
          new Vec2((x + 0.5) * tileWidth, (y + 1) * tileWidth),
        );
        !hideHorizontal && paths.push([leftRight, tile.path[0] || 0]);
        !hideVertical && paths.push([upDown, tile.path[1] || 0]);

        break;
    }

    rng.shuffle(paths).forEach((pathData) => drawPath(pathData[0], pathData[1]));
  }

  repeat(tileSet.width, (x) => {
    repeat(tileSet.height, (y) => {
      drawTile(tileSet.tiles[x][y], x, y);
    });
  });
};

export default Sketch({
  config,
  params,
  draw,
});
