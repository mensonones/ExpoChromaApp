#include "ExpoSimdChroma.h"
#include <algorithm>

#if defined(__ARM_NEON) || defined(__ARM_NEON__)
#include <arm_neon.h>
#endif

extern "C" void processChromaKey(uint8_t* data, size_t length) {
    // Cada pixel RGBA ocupa 4 bytes.
    size_t numPixels = length / 4;
    size_t i = 0;

#if defined(__ARM_NEON) || defined(__ARM_NEON__)
    /**
     * OTIMIZAÇÃO SIMD (ARM NEON):
     * Processamos 16 pixels (64 bytes) de uma única vez.
     * 
     * vld4q_u8: Carrega os dados desintercalando os canais.
     * Isso coloca todos os Rs em um registrador, todos os Gs em outro, etc.
     * Facilitando operações matemáticas em massa sobre um canal específico.
     */
    
    // Definimos um threshold de 30 para a sensibilidade do verde fora do loop
    // para evitar re-inicialização desnecessária do registrador.
    uint8x16_t threshold = vdupq_n_u8(30);

    for (; i + 15 < numPixels; i += 16) {
        uint8_t* ptr = data + (i * 4);
        
        // rgba.val[0]=R, val[1]=G, val[2]=B, val[3]=A (cada um com 16 valores)
        uint8x16x4_t rgba = vld4q_u8(ptr);
        
        // r_plus_th = R + 30 (vqadd garante que não passe de 255)
        uint8x16_t r_plus_th = vqaddq_u8(rgba.val[0], threshold);
        uint8x16_t b_plus_th = vqaddq_u8(rgba.val[2], threshold);
        
        // Criamos máscaras: 0xFF se for verde, 0x00 caso contrário
        // Critério: Verde > (Vermelho + 30) E Verde > (Azul + 30)
        uint8x16_t mask_r = vcgtq_u8(rgba.val[1], r_plus_th);
        uint8x16_t mask_b = vcgtq_u8(rgba.val[1], b_plus_th);
        
        // is_green = mask_r AND mask_b
        uint8x16_t is_green = vandq_u8(mask_r, mask_b);
        
        // vbic (Bit Clear): Zera o Alpha onde is_green for verdadeiro (0xFF)
        // Isso torna o pixel transparente.
        rgba.val[3] = vbicq_u8(rgba.val[3], is_green);

        // Salva os 16 pixels de volta na memória, re-intercalando os canais
        vst4q_u8(ptr, rgba);
    }
#endif

    /**
     * FALLBACK ESCALAR:
     * Processa os pixels restantes (caso o total não seja múltiplo de 16).
     */
    for (; i < numPixels; ++i) {
        uint8_t* ptr = data + (i * 4);
        uint8_t r = ptr[0];
        uint8_t g = ptr[1];
        uint8_t b = ptr[2];

        if (g > (r + 30) && g > (b + 30)) {
            ptr[3] = 0;
        }
    }
}

/**
 * Versão escalar pura.
 * Para garantir que o compilador não use SIMD (Auto-vetorização),
 * usamos um pragma específico do Clang para desativar a vetorização.
 */
extern "C" void processChromaKeyScalar(uint8_t* data, size_t length) {
    size_t numPixels = length / 4;

    #pragma clang loop vectorize(disable)
    for (size_t i = 0; i < numPixels; ++i) {
        uint8_t* ptr = data + (i * 4);
        
        uint8_t r = ptr[0];
        uint8_t g = ptr[1];
        uint8_t b = ptr[2];

        if (g > (r + 30) && g > (b + 30)) {
            ptr[3] = 0; 
        }
    }
}

