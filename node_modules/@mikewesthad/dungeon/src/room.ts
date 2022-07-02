import TILES from "./tiles";
import Point from "./point";
import create2DArray from "./create-2d-array";

export default class Room {
  private tiles: TILES[][];
  public x = 0;
  public y = 0;
  public left = 0;
  public right = 0;
  public top = 0;
  public bottom = 0;
  public centerX = 0;
  public centerY = 0;

  constructor(public width: number, public height: number) {
    this.width = width;
    this.height = height;

    this.setPosition(0, 0);

    this.tiles = create2DArray<TILES>(width, height, TILES.FLOOR);

    // Place walls around edges of room.
    for (let y = 0; y < this.height; y++) {
      this.setTileAt(0, y, TILES.WALL);
      this.setTileAt(width - 1, y, TILES.WALL);
    }
    for (let x = 0; x < this.width; x++) {
      this.setTileAt(x, 0, TILES.WALL);
      this.setTileAt(x, height - 1, TILES.WALL);
    }
  }

  public forEachTile(fn: (p: Point, t: TILES) => void) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        fn({ x, y }, this.getTileAt(x, y));
      }
    }
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.left = x;
    this.right = x + (this.width - 1);
    this.top = y;
    this.bottom = y + (this.height - 1);
    this.centerX = x + Math.floor(this.width / 2);
    this.centerY = y + Math.floor(this.height / 2);
  }

  public getDoorLocations(): Point[] {
    const doors = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.getTileAt(x, y) == TILES.DOOR) {
          doors.push({ x, y });
        }
      }
    }
    return doors;
  }

  public overlaps(otherRoom: Room) {
    if (this.right < otherRoom.left) return false;
    else if (this.left > otherRoom.right) return false;
    else if (this.bottom < otherRoom.top) return false;
    else if (this.top > otherRoom.bottom) return false;
    else return true;
  }

  /**
   * Check if the given local coordinates are within the dimensions of the room.
   * @param x
   * @param y
   */
  public isInBounds(x: number, y: number) {
    return x >= 0 && x < this.width - 1 && y >= 0 && y < this.height - 1;
  }

  /**
   * Get the tile at the given local coordinates of the room.
   * @param x
   * @param y
   */
  public getTileAt(x: number, y: number): TILES {
    return this.tiles[y][x];
  }

  /**
   * Set the tile at the given local coordinates of the room.
   * @param x
   * @param y
   * @param tile
   */
  public setTileAt(x: number, y: number, tile: TILES) {
    this.tiles[y][x] = tile;
  }

  /**
   * Check if two rooms share a door between them.
   * @param otherRoom
   */
  public isConnectedTo(otherRoom: Room) {
    const doors = this.getDoorLocations();
    for (const d of doors) {
      // Find door position relative to otherRoom's local coordinate system.
      const dx = this.x + d.x - otherRoom.x;
      const dy = this.y + d.y - otherRoom.y;

      if (otherRoom.isInBounds(dx, dy) && otherRoom.getTileAt(dx, dy) === TILES.DOOR) {
        return true;
      }
    }
    return false;
  }
}
