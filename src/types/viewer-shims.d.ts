declare module 'dxf-parser' {
  export default class DXFParser {
    parseSync(input: string | ArrayBuffer): any;
  }
}
