import Random from "./random";

describe("randomInteger", () => {
  test("should return a number between min and max", () => {
    const r = new Random("seed");
    Array(100)
      .map(() => r.randomInteger(3, 5))
      .forEach(r => {
        expect(r).toBeGreaterThanOrEqual(3);
        expect(r).toBeLessThanOrEqual(5);
      });
  });

  test("should return a number between min and max when min > max", () => {
    const r = new Random("seed");
    Array(100)
      .map(() => r.randomInteger(5, 3))
      .forEach(r => {
        expect(r).toBeGreaterThanOrEqual(3);
        expect(r).toBeLessThanOrEqual(5);
      });
  });

  test("should return an even number when onlyEven option is used", () => {
    const r = new Random("seed");
    Array(100)
      .map(() => r.randomInteger(2, 30, { onlyEven: true }))
      .forEach(r => {
        expect(r % 2).toBe(0);
      });
  });

  test("should return an even number when onlyEven option is used and parameters are odd", () => {
    const r = new Random("seed");
    Array(100)
      .map(() => r.randomInteger(3, 31, { onlyEven: true }))
      .forEach(r => {
        expect(r % 2).toBe(0);
      });
  });

  test("should return an odd number when onlyOdd option is used", () => {
    const r = new Random("seed");
    Array(100)
      .map(() => r.randomInteger(3, 31, { onlyOdd: true }))
      .forEach(r => {
        expect(r % 2).toBe(1);
      });
  });

  test("should return an odd number when onlyOdd option is used and parameters are even", () => {
    const r = new Random("seed");
    Array(100)
      .map(() => r.randomInteger(2, 30, { onlyOdd: true }))
      .forEach(r => {
        expect(r % 2).toBe(1);
      });
  });
});
