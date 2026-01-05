# Expo Chroma SIMD 

Este projeto demonstra como utilizar **C++** e instruções **SIMD (ARM NEON)** dentro do ecossistema **Expo** para processamento de imagem de alta performance, alcançando velocidades até 160x superiores ao JavaScript puro.

> **Artigo detalhado no Dev.to:** [React Native em Alta Performance: Expo Modules, C++ e SIMD (ARM NEON)](https://dev.to/mensonones/react-native-em-alta-performance-expo-modules-c-e-simd-arm-neon-4bhg)

## Como rodar o projeto

Como este projeto utiliza código nativo customizado (C++), você **não pode** usar o Expo Go. É necessário gerar um **Development Build**.

### Pré-requisitos
- Android SDK configurado (para Android)
- Xcode (para iOS - opcional)
- Node.js e Yarn/NPM

### Passo a passo

1. **Instale as dependências:**
   ```bash
   yarn install
   ```

2. **Rode no Android (Recomendado para ver o SIMD):**
   ```bash
   yarn android
   ```
   *Este comando irá compilar o código C++ via CMake e instalar o app no seu dispositivo/emulador.*

3. **Rode no iOS:**
   ```bash
   yarn ios
   ```

## Estrutura do Projeto

- `modules/expo-chroma`: O coração do projeto. Contém o código C++ (SIMD), as pontes em Kotlin/Swift e a configuração do Expo Module.
- `app/(tabs)/index.tsx`: Tela principal com os benchmarks de performance.
- `cpp/`: Implementação dos kernels de processamento de imagem.

## 📊 Benchmarks
O app inclui uma ferramenta de stress test que processa um buffer de 8MB para comparar:
- **JS (Hermes)**
- **C++ (Escalar)**
- **C++ (SIMD/NEON)**

---
Criado por [mensonones](https://github.com/mensonones).

**Leia o artigo completo:** [React Native em Alta Performance: Expo Modules, C++ e SIMD (ARM NEON)](https://dev.to/mensonones/react-native-em-alta-performance-expo-modules-c-e-simd-arm-neon-4bhg)
