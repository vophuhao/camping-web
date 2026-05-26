declare module 'qrcode' {
  export function toDataURL(
    text: string,
    options?: any,
    callback?: (error: Error | null | undefined, url: string) => void
  ): Promise<string>;
  
  export function toString(
    text: string,
    options?: any,
    callback?: (error: Error | null | undefined, string: string) => void
  ): Promise<string>;

  export function toCanvas(
    canvas: any,
    text: string,
    options?: any,
    callback?: (error: Error | null | undefined) => void
  ): Promise<void>;
}
