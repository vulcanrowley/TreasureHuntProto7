function isEven(value: number) {
  return Number.isInteger(value) && value % 2 === 0;
}

function isOdd(value: number) {
  return Number.isInteger(value) && value % 2 !== 0;
}

export { isEven, isOdd };
