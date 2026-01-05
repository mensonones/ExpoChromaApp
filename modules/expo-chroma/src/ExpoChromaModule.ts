import { requireNativeModule } from 'expo-modules-core';

// Define a "cara" do nosso módulo nativo para o TypeScript não reclamar
interface ExpoChromaModuleInterface {
  processImage(data: Uint8Array): boolean;
  processImageScalar(data: Uint8Array): boolean;
  processImageAsync(data: Uint8Array): Promise<boolean>;
  processImageBase64(base64String: string): Promise<string>;
  processImageBase64Scalar(base64String: string): Promise<string>;
  getPixels(base64String: string): Uint8Array;
  getBase64FromPixels(pixels: Uint8Array, width: number, height: number): string;
}

// Carrega o módulo nativo com a tipagem acima
// O string 'ExpoChroma' deve bater com o Name() definido no C++
export default requireNativeModule<ExpoChromaModuleInterface>('ExpoChroma');