import Dungeon from "./dungeon";
import TILES from "./tiles";

describe("Dungeon constructor", () => {
  test("should apply default config values for optional properties not specified", () => {
    const config = {
      width: 20,
      height: 10,
      rooms: {
        width: { min: 4, max: 9 },
        height: { min: 3, max: 4 }
      }
    };
    const d = new Dungeon(config);
    const maxArea = config.rooms.width.max * config.rooms.height.max;
    const minArea = config.rooms.width.min * config.rooms.height.min;
    const maxRooms = Math.floor((config.width * config.height) / minArea);
    expect(d.getConfig()).toMatchObject({
      width: config.width,
      height: config.height,
      doorPadding: 1,
      randomSeed: undefined,
      rooms: {
        width: {
          min: config.rooms.width.min,
          max: config.rooms.width.max,
          onlyOdd: false,
          onlyEven: false
        },
        height: {
          min: config.rooms.height.min,
          max: config.rooms.height.max,
          onlyOdd: false,
          onlyEven: false
        },
        maxArea,
        maxRooms
      }
    });
  });

  test("should throw error if max room size is bigger than dungeon size", () => {
    expect(() => {
      const config = {
        width: 20,
        height: 10,
        rooms: {
          width: { min: 4, max: 20 },
          height: { min: 3, max: 20 }
        }
      };
      const d = new Dungeon(config);
    }).toThrowError(/exceed dungeon/);
  });

  test("should throw error if maxArea too small", () => {
    expect(() => {
      const config = {
        width: 20,
        height: 10,
        rooms: {
          width: { min: 3, max: 5 },
          height: { min: 3, max: 5 },
          maxArea: 2
        }
      };
      const d = new Dungeon(config);
    }).toThrowError(/exceeds the given maxArea/);
  });

  test("should not allow rooms smaller than 3 x 3", () => {
    expect(() => {
      const config = {
        width: 20,
        height: 10,
        rooms: {
          width: { min: 2, max: 3 },
          height: { min: 0, max: 3 }
        }
      };
      const d = new Dungeon(config);
    }).toThrowError(/width and height must be >= 3/);
  });

  test("should not allow room size min less than max", () => {
    expect(() => {
      const config = {
        width: 20,
        height: 10,
        rooms: {
          width: { min: 5, max: 3 },
          height: { min: 5, max: 3 }
        }
      };
      const d = new Dungeon(config);
    }).toThrowError(/width and height max must be >= min/);
  });

  test("should not allow room min/max that cannot match even parity", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    expect(() => {
      const config = {
        width: 20,
        height: 10,
        rooms: {
          width: { min: 3, max: 3, onlyEven: true },
          height: { min: 3, max: 5 }
        }
      };
      const d = new Dungeon(config);
    }).toThrowError(/width and height max must be >= min/);
    spy.mockRestore();
  });

  test("should not allow room min/max that cannot match odd parity", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    expect(() => {
      const config = {
        width: 20,
        height: 10,
        rooms: {
          width: { min: 4, max: 4, onlyOdd: true },
          height: { min: 3, max: 5 }
        }
      };
      const d = new Dungeon(config);
    }).toThrowError(/width and height max must be >= min/);
    spy.mockRestore();
  });
});

describe("A dungeon", () => {
  test("should not have doors in the corners of rooms", () => {
    const d = new Dungeon({
      width: 500,
      height: 500,
      rooms: {
        width: { min: 3, max: 11 },
        height: { min: 3, max: 11 },
        maxRooms: 1000
      }
    });
    for (const room of d.rooms) {
      expect(room.getTileAt(0, 0)).not.toBe(TILES.DOOR);
      expect(room.getTileAt(0, room.height - 1)).not.toBe(TILES.DOOR);
      expect(room.getTileAt(room.width - 1, 0)).not.toBe(TILES.DOOR);
      expect(room.getTileAt(room.width - 1, room.height - 1)).not.toBe(TILES.DOOR);
    }
  });

  test("should only have doors and walls along the edges", () => {
    const d = new Dungeon({
      width: 500,
      height: 500,
      rooms: {
        width: { min: 3, max: 11 },
        height: { min: 3, max: 11 },
        maxRooms: 1000
      }
    });
    const acceptableEdgeTiles = new RegExp(`${TILES.DOOR}|${TILES.WALL}`);
    for (const room of d.rooms) {
      for (let y = 0; y < room.height; y++) {
        expect(room.getTileAt(0, y).toString()).toMatch(acceptableEdgeTiles);
        expect(room.getTileAt(room.width - 1, y).toString()).toMatch(acceptableEdgeTiles);
      }
      for (let x = 0; x < room.width; x++) {
        expect(room.getTileAt(x, 0).toString()).toMatch(acceptableEdgeTiles);
        expect(room.getTileAt(x, room.height - 1).toString()).toMatch(acceptableEdgeTiles);
      }
    }
  });

  test("should generate rooms that match the dimensions", () => {
    const config = {
      width: 500,
      height: 500,
      rooms: {
        width: { min: 4, max: 7 },
        height: { min: 3, max: 9 },
        maxRooms: 1000
      }
    };
    const d = new Dungeon(config);
    for (const room of d.rooms) {
      expect(room.width).toBeGreaterThanOrEqual(config.rooms.width.min);
      expect(room.width).toBeLessThanOrEqual(config.rooms.width.max);
      expect(room.height).toBeGreaterThanOrEqual(config.rooms.height.min);
      expect(room.height).toBeLessThanOrEqual(config.rooms.height.max);
    }
  });

  test("should generate only odd dimension rooms when requested", () => {
    const config = {
      width: 500,
      height: 500,
      rooms: {
        width: { min: 5, max: 7, onlyOdd: true },
        height: { min: 3, max: 9, onlyOdd: true },
        maxRooms: 1000
      }
    };
    const d = new Dungeon(config);
    for (const room of d.rooms) {
      expect(room.width % 2 == 0).toBe(false);
      expect(room.height % 2 == 0).toBe(false);
    }
  });

  test("should generate only even dimension rooms when requested", () => {
    const config = {
      width: 500,
      height: 500,
      rooms: {
        width: { min: 4, max: 6, onlyEven: true },
        height: { min: 4, max: 8, onlyEven: true },
        maxRooms: 1000
      }
    };
    const d = new Dungeon(config);
    for (const room of d.rooms) {
      expect(room.width % 2 == 0).toBe(true);
      expect(room.height % 2 == 0).toBe(true);
    }
  });
});
