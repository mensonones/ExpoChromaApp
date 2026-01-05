#pragma once

#include <cstdint>
#include <cstddef>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Processa uma imagem RGBA in-place para remover o fundo verde (Chroma Key).
 * Utiliza otimizações SIMD quando disponível.
 * 
 * @param data Ponteiro para os dados da imagem (RGBA)
 * @param length Tamanho total em bytes (deve ser múltiplo de 4)
 */
void processChromaKey(uint8_t* data, size_t length);

/**
 * Versão escalar (sem SIMD) para comparação de performance.
 */
void processChromaKeyScalar(uint8_t* data, size_t length);

#ifdef __cplusplus
}
#endif

namespace expo {
namespace chroma {
    // Mantemos o namespace para uso interno em C++ se preferir
    inline void processChromaKeyCpp(uint8_t* data, size_t length) {
        ::processChromaKey(data, length);
    }
} // namespace chroma
} // namespace expo
