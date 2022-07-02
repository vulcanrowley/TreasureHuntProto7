import { isEven, isOdd } from "./math";

describe("Math parity methods", () => {
  test("isEven should return true for even integers", () => {
    expect(isEven(0)).toBe(true);
    expect(isEven(2)).toBe(true);
    expect(isEven(-2)).toBe(true);
  });

  test("isEven should return false for odd integers", () => {
    expect(isEven(1)).toBe(false);
    expect(isEven(-1)).toBe(false);
  });

  test("isEven should return false for floating point numbers", () => {
    expect(isEven(0.5)).toBe(false);
    expect(isEven(-0.5)).toBe(false);
  });

  test("isOdd should return true for odd integers", () => {
    expect(isOdd(1)).toBe(true);
    expect(isOdd(-1)).toBe(true);
  });

  test("isOdd should return false for even integers", () => {
    expect(isOdd(0)).toBe(false);
    expect(isOdd(2)).toBe(false);
    expect(isOdd(-2)).toBe(false);
  });

  test("isOdd should return false for floating point numbers", () => {
    expect(isOdd(0.5)).toBe(false);
    expect(isOdd(-0.5)).toBe(false);
  });
});
