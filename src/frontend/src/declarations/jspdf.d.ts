// Minimal ambient declaration for jspdf loaded via CDN
declare module "jspdf" {
  export class jsPDF {
    constructor(options?: {
      orientation?: "portrait" | "landscape";
      unit?: "mm" | "pt" | "px" | "cm" | "in";
      format?: string | [number, number];
    });
    addPage(): jsPDF;
    save(filename: string): jsPDF;
    setFontSize(size: number): jsPDF;
    setFont(fontName: string, fontStyle?: string): jsPDF;
    setTextColor(r: number, g?: number, b?: number): jsPDF;
    setFillColor(r: number, g?: number, b?: number): jsPDF;
    setDrawColor(r: number, g?: number, b?: number): jsPDF;
    setLineWidth(width: number): jsPDF;
    text(
      text: string | string[],
      x: number,
      y: number,
      options?: { align?: string; maxWidth?: number },
    ): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: string): jsPDF;
    roundedRect(
      x: number,
      y: number,
      w: number,
      h: number,
      rx: number,
      ry: number,
      style?: string,
    ): jsPDF;
    circle(x: number, y: number, r: number, style?: string): jsPDF;
    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      w: number,
      h: number,
      alias?: string,
      compression?: string,
    ): jsPDF;
    splitTextToSize(text: string, maxWidth: number): string[];
    internal: {
      pageSize: { width: number; height: number };
    };
  }
}

declare interface Window {
  jspdf: {
    jsPDF: import("jspdf").jsPDF & (new (options?: any) => import("jspdf").jsPDF);
  };
}
