export default {
  processImage(data: Uint8Array): boolean {
    // Fallback em JS Puro (Lento) para quando rodar na Web
    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Lógica simples: Se for muito verde, zera o Alpha
      if (g > 100 && g > (r + b)) {
        data[i + 3] = 0;
      }
    }
    return true;
  },
};