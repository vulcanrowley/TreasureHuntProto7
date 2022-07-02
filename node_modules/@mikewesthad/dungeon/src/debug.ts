import TILES from "./tiles";
import Dungeon from "./dungeon";

type AttributesObject = { [key: string]: string };

const attributesToHtmlString = (attrObj: AttributesObject) =>
  Object.entries(attrObj)
    .map(([key, val]) => `${key}="${val}"`)
    .join(" ");

// Debug by dumping a table to the console where each element in the map is the number of rooms in
// that location
export function debugRoomGrid(dungeon: Dungeon) {
  const table = dungeon.roomGrid.map(row => row.map(elem => `${elem.length}`.padStart(2)));
  console.log(table.map(row => row.join(" ")).join("\n"));
}

// Debug by dumping the dungeon into an HTML fragment that can be inserted into HTML. The structure
// is:
//  <pre>
//    <table>
//      <tbody>
//        <tr>   <td>#</td> <td>#</td> <td>#</td> <td>#</td>   </tr>
//        <tr>   <td>#</td> <td> </td> <td> </td> <td>#</td>   </tr>
//        <tr>   <td>#</td> <td> </td> <td> </td> <td>/</td>   </tr>
//        <tr>   <td>#</td> <td> </td> <td> </td> <td>#</td>   </tr>
//        <tr>   <td>#</td> <td>#</td> <td>#</td> <td>#</td>   </tr>
//      </tbody>
//    </table>
//  </pre>

export type DebugHtmlConfig = {
  empty?: string;
  emptyAttributes?: AttributesObject;
  wall?: string;
  wallAttributes?: AttributesObject;
  floor?: string;
  floorAttributes?: AttributesObject;
  door?: string;
  doorAttributes?: AttributesObject;
  containerAttributes?: AttributesObject;
};
type DebugHtmlConfigRequired = Required<DebugHtmlConfig>;

export function debugHtmlStringMap(dungeon: Dungeon, config: DebugHtmlConfig = {}) {
  const c: DebugHtmlConfigRequired = Object.assign(
    {},
    {
      empty: " ",
      emptyAttributes: { class: "dungeon__empty" },
      wall: "#",
      wallAttributes: { class: "dungeon__wall" },
      floor: "_",
      floorAttributes: { class: "dungeon__wall" },
      door: ".",
      doorAttributes: { class: "dungeon__door" },
      containerAttributes: { class: "dungeon" }
    },
    config
  );

  const tiles = dungeon.getMappedTiles({
    empty: `<td ${attributesToHtmlString(c.emptyAttributes)}>${c.empty}</td>`,
    floor: `<td ${attributesToHtmlString(c.floorAttributes)}>${c.floor}</td>`,
    door: `<td ${attributesToHtmlString(c.doorAttributes)}>${c.door}</td>`,
    wall: `<td ${attributesToHtmlString(c.wallAttributes)}>${c.wall}</td>`
  });

  const tilesHtml = tiles.map(row => `<tr>${row.join("")}</tr>`).join("");
  const htmlString = `<pre ${attributesToHtmlString(
    c.containerAttributes
  )}><table><tbody>${tilesHtml}</tbody></table></pre>`;

  return htmlString;
}

export function debugHtmlMap(dungeon: Dungeon, config: DebugHtmlConfig = {}) {
  const htmlString = debugHtmlStringMap(dungeon, config);
  const htmlFragment = document.createRange().createContextualFragment(htmlString);
  return htmlFragment;
}

// Debug by returning a colored(!) table string where each tile in the map is represented with an
// ASCII string
export type DebugConsoleConfig = {
  empty?: string;
  emptyColor?: string;
  wall?: string;
  wallColor?: string;
  floor?: string;
  floorColor?: string;
  door?: string;
  doorColor?: string;
  fontSize?: string;
};
type DebugConsoleConfigRequired = Required<DebugConsoleConfig>;
export function debugMap(dungeon: Dungeon, config: DebugConsoleConfig = {}) {
  const c: DebugConsoleConfigRequired = Object.assign(
    {},
    {
      empty: " ",
      emptyColor: "rgb(0, 0, 0)",
      wall: "#",
      wallColor: "rgb(255, 0, 0)",
      floor: "_",
      floorColor: "rgb(210, 210, 210)",
      door: ".",
      doorColor: "rgb(0, 0, 255)",
      fontSize: "15px"
    },
    config
  );

  let string = "";
  let styles = [];

  // First line in the browser console window has console line mapping (e.g. "dungeon.js:724") which
  // throws off the table. Kill two birds by displaying a guide on the first two lines.
  string += `Dungeon: the console window should be big enough to see all of the guide on the next line:\n`;
  string += `%c|${"=".repeat(dungeon.width * 2 - 2)}|\n\n`;
  styles.push(`font-size: ${c.fontSize}`);

  for (let y = 0; y < dungeon.height; y += 1) {
    for (let x = 0; x < dungeon.width; x += 1) {
      const tile = dungeon.tiles[y][x];
      if (tile === TILES.EMPTY) {
        string += `%c${c.empty}`;
        styles.push(`color: ${c.emptyColor}; font-size: ${c.fontSize}`);
      } else if (tile === TILES.WALL) {
        string += `%c${c.wall}`;
        styles.push(`color: ${c.wallColor}; font-size: ${c.fontSize}`);
      } else if (tile === TILES.FLOOR) {
        string += `%c${c.floor}`;
        styles.push(`color: ${c.floorColor}; font-size: ${c.fontSize}`);
      } else if (tile === TILES.DOOR) {
        string += `%c${c.door}`;
        styles.push(`color: ${c.doorColor}; font-size: ${c.fontSize}`);
      }
      string += " ";
    }
    string += "\n";
  }
  console.log(string, ...styles);
}
