import ExpoChromaModule from './src/ExpoChromaModule';

/**
 * Aplica o efeito Chroma Key (remove verde) usando SIMD nativo.
 * A operação é feita "in-place", modificando o array original.
 * * @param data Uint8Array contendo os bytes da imagem (RGBA)
 * @returns true se o processamento ocorreu com sucesso
 */
export function processImage(data: Uint8Array): boolean {
  // Passamos direto para o módulo nativo (C++)
  return ExpoChromaModule.processImage(data);
}

export function processImageScalar(data: Uint8Array): boolean {
  return ExpoChromaModule.processImageScalar(data);
}

/**
 * Processa uma imagem em Base64 e retorna a imagem processada também em Base64.
 */
export async function processImageBase64(base64: string): Promise<string> {
  return await ExpoChromaModule.processImageBase64(base64);
}

/**
 * Processa uma imagem em Base64 usando a versão escalar (sem SIMD).
 */
export async function processImageBase64Scalar(base64: string): Promise<string> {
  return await ExpoChromaModule.processImageBase64Scalar(base64);
}

/**
 * Versão assíncrona do processamento de buffer para não travar a thread principal.
 */
export async function processImageAsync(data: Uint8Array): Promise<boolean> {
  return await ExpoChromaModule.processImageAsync(data);
}

export function getPixels(base64: string): Uint8Array {
  return ExpoChromaModule.getPixels(base64);
}

export function getBase64FromPixels(pixels: Uint8Array, width: number, height: number): string {
  return ExpoChromaModule.getBase64FromPixels(pixels, width, height);
}
