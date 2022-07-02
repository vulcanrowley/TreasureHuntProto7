enum TILES {
  EMPTY = 0,
  WALL = 1,
  FLOOR = 2,
  DOOR = 3
}

type DebugTileMap = {
  empty?: number | string;
  wall?: number | string;
  floor?: number | string;
  door?: number | string;
};

export default TILES;
export { DebugTileMap };
