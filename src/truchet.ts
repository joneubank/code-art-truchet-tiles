import { Random, Utils } from '@code-not-art/core';
const { array } = Utils;

/**
 * Trochet tiling
 * https://en.wikipedia.org/wiki/Truchet_tiles
 *
 * Generate a square grid with each tile assigned an orientation.
 * Orientations are mapped based on one path starting from the left to its exit side (top, right, or bottom).
 * The other path will then connect the other two sides.
 *
 * This library will determine all unique connected paths in the tileset.
 * These paths can be referenced by tile (to return two path IDs), or can be looped per path (with an unordered list of the tiles connected by that path)
 *  */

export enum TileOrientation {
  LeftDown,
  LeftUp,
  LeftRight,
}
enum TileSide {
  Left,
  Top,
  Right,
  Bottom,
}

function randomOrientation(rng: Random, allowCross: boolean): TileOrientation {
  const selection = rng.int(0, allowCross ? 2 : 1);
  switch (selection) {
    case 0:
      return TileOrientation.LeftDown;
    case 1:
      return TileOrientation.LeftUp;
    case 2:
      return TileOrientation.LeftRight;
    default:
      console.log(
        `Impossible code block reached!!! Random orientation out of range was selected.`,
      );
      return TileOrientation.LeftDown;
  }
}

/**
 *  Each tile has two paths, they are indexed 0 and 1. 0 is the path connecting to the LEFT side always, and the other path is 1
 */
function getTilePathIndex(side: TileSide, orientation: TileOrientation): 0 | 1 {
  switch (side) {
    case TileSide.Left:
      return 0;
    case TileSide.Top:
      switch (orientation) {
        case TileOrientation.LeftDown:
          return 1;
        case TileOrientation.LeftUp:
          return 0;
        case TileOrientation.LeftRight:
          return 1;
      }
    case TileSide.Right:
      switch (orientation) {
        case TileOrientation.LeftDown:
          return 1;
        case TileOrientation.LeftUp:
          return 1;
        case TileOrientation.LeftRight:
          return 0;
      }
    case TileSide.Bottom:
      switch (orientation) {
        case TileOrientation.LeftDown:
          return 0;
        case TileOrientation.LeftUp:
          return 1;
        case TileOrientation.LeftRight:
          return 1;
      }
  }
}

/**
 * Following a given path on a tile (based on entry side), what side will that path enter the next tile on.
 * This is a bit confusing so to repeat:
 *    We are not returning the Exit of the path from this tile, instead it is the Entrance side of the next tile.
 * @param side
 * @param orientation
 * @returns
 */
function getTilePathNextEntry(
  side: TileSide,
  orientation: TileOrientation,
): TileSide {
  switch (side) {
    case TileSide.Left:
      switch (orientation) {
        case TileOrientation.LeftDown:
          return TileSide.Top;
        case TileOrientation.LeftUp:
          return TileSide.Bottom;
        case TileOrientation.LeftRight:
          return TileSide.Left;
      }
    case TileSide.Top:
      switch (orientation) {
        case TileOrientation.LeftDown:
          // Top to Right
          return TileSide.Left;
        case TileOrientation.LeftUp:
          // Top to Left
          return TileSide.Right;
        case TileOrientation.LeftRight:
          // Top to Bottom
          return TileSide.Top;
      }
    case TileSide.Right:
      switch (orientation) {
        case TileOrientation.LeftDown:
          // Right to Top
          return TileSide.Bottom;
        case TileOrientation.LeftUp:
          // Right to Bottom
          return TileSide.Top;
        case TileOrientation.LeftRight:
          // Right to Left
          return TileSide.Right;
      }
    case TileSide.Bottom:
      switch (orientation) {
        case TileOrientation.LeftDown:
          // Bottom to Left
          return TileSide.Right;
        case TileOrientation.LeftUp:
          // Bottom to Right
          return TileSide.Left;
        case TileOrientation.LeftRight:
          // Bottom to Top
          return TileSide.Bottom;
      }
  }
}

/**
 * Following the path through the tiles, this gives the relative coordinates of the next tile.
 * The grid is counted left to right and top to bottom, so based on the exit side:
 * Exit Left: x=-1
 * Exit Top: y=-1
 * Exit Right: x=1
 * Exit Bottom: y=1
 * @param side
 * @param orientation
 * @returns {x: number, y: number}
 */
function getTilePathCoordinateMods(
  side: TileSide,
  orientation: TileOrientation,
): { x: -1 | 0 | 1; y: -1 | 0 | 1 } {
  switch (side) {
    case TileSide.Left:
      switch (orientation) {
        case TileOrientation.LeftDown:
          return { x: 0, y: 1 };
        case TileOrientation.LeftUp:
          return { x: 0, y: -1 };
        case TileOrientation.LeftRight:
          return { x: 1, y: 0 };
      }
    case TileSide.Top:
      switch (orientation) {
        case TileOrientation.LeftDown:
          // Top to Right
          return { x: 1, y: 0 };
        case TileOrientation.LeftUp:
          // Top to Left
          return { x: -1, y: 0 };
        case TileOrientation.LeftRight:
          // Top to Bottom
          return { x: 0, y: 1 };
      }
    case TileSide.Right:
      switch (orientation) {
        case TileOrientation.LeftDown:
          // Right to Top
          return { x: 0, y: -1 };
        case TileOrientation.LeftUp:
          // Right to Bottom
          return { x: 0, y: 1 };
        case TileOrientation.LeftRight:
          // Right to Left
          return { x: -1, y: 0 };
      }
    case TileSide.Bottom:
      switch (orientation) {
        case TileOrientation.LeftDown:
          // Bottom to Left
          return { x: -1, y: 0 };
        case TileOrientation.LeftUp:
          // Bottom to Right
          return { x: 1, y: 0 };
        case TileOrientation.LeftRight:
          // Bottom to Top
          return { x: 0, y: -1 };
      }
  }
}

type TilePathRecord = [number | undefined, number | undefined];
type Tile = {
  x: number;
  y: number;
  orientation: TileOrientation;
  path: TilePathRecord;
};

type TruchetParams = {
  width: number;
  height: number;
  allowCross: boolean;
};
export default class TruchetTiles {
  width: number;
  height: number;
  allowCross: boolean;
  tiles: Tile[][];

  constructor(
    { width, height, allowCross = false }: TruchetParams,
    rng: Random = new Random('truchet tiles'),
  ) {
    this.width = width;
    this.height = height;
    this.allowCross = allowCross;

    this.tiles = array(this.width).map((x) =>
      array(this.height).map((y) => ({
        x,
        y,
        orientation: randomOrientation(rng, this.allowCross),
        path: [undefined, undefined],
      })),
    );

    this.updateTilePaths();
  }

  updateTilePaths() {
    let path: number = 0;
    let maxPath: number = 0;

    // 0-left, 1-top, 2-right, 3-bottom
    let nextEntry = 0;
    let nextX = 0;
    let nextY = 0;

    // returns false if path alrady assigned to the provided tile coords
    // otherwise this has side-effects, updating the `path` and `nextXYZ` variables defined above.
    const addPathToTile = (entry: TileSide, x: number, y: number) => {
      const tile = this.tiles[x][y];
      let output = true;
      const orientation = tile.orientation;

      nextEntry = getTilePathNextEntry(entry, orientation);
      const coordMods = getTilePathCoordinateMods(entry, orientation);
      const pathIndex = getTilePathIndex(entry, orientation);
      // check if path already assigned
      if (tile.path[pathIndex]) {
        output = false;
        path = <number>tile.path[pathIndex];
      }
      tile.path[pathIndex] = path;

      nextX += coordMods.x;
      nextY += coordMods.y;

      return output;
    };

    this.tiles.forEach((_columnData, x) =>
      this.tiles[x].forEach((_tileData, y) => {
        // map paths for this tile entering from all directions
        const self = this;
        [0, 1, 2, 3].forEach((entry) => {
          path = ++maxPath;

          nextX = x;
          nextY = y;
          nextEntry = entry;
          // do this once, because after the first two loops this is gauranteed to return false;
          addPathToTile(nextEntry, nextX, nextY);
          do {
            // break if we are left with coordinates outside of our grid
            if (
              nextX < 0 ||
              nextX >= self.width ||
              nextY < 0 ||
              nextY >= self.height
            ) {
              break;
            }
          } while (addPathToTile(nextEntry, nextX, nextY));
        });
      }),
    );
  }
}
