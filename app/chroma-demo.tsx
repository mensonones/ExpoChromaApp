import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAssets } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Button, Image, StyleSheet, View } from 'react-native';
import { processImage } from '../modules/expo-chroma';

export default function ChromaDemoScreen() {
  const [assets] = useAssets([require('../assets/images/chroma.png')]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [jsTime, setJsTime] = useState<number | null>(null);
  const [nativeTime, setNativeTime] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulação de processamento para comparação de performance
  // Em um cenário real, extrairíamos os pixels da imagem.
  // Aqui usamos um buffer de 8MB (equivalente a uma imagem 2K) para teste de estresse.
  const DATA_SIZE = 2000 * 1000 * 4; // ~8MB de dados RGBA
  
  const runJSProcess = () => {
    const data = new Uint8Array(DATA_SIZE);
    // Preenche com alguns valores simulando "verde"
    for (let i = 0; i < DATA_SIZE; i += 4) {
      data[i] = 50;     // R
      data[i + 1] = 200; // G (Verde alto)
      data[i + 2] = 50;  // B
      data[i + 3] = 255; // A
    }

    const start = performance.now();
    
    // Implementação JS do Chroma Key
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Se for "verde" o suficiente, remove (alpha = 0)
      if (g > 100 && g > r && g > b) {
        data[i + 3] = 0;
      }
    }
    
    const end = performance.now();
    setJsTime(end - start);
  };

  const runNativeProcess = () => {
    const data = new Uint8Array(DATA_SIZE);
    // Preenche com os mesmos valores
    for (let i = 0; i < DATA_SIZE; i += 4) {
      data[i] = 50;
      data[i + 1] = 200;
      data[i + 2] = 50;
      data[i + 3] = 255;
    }

    const start = performance.now();
    
    // Chama o módulo C++ com SIMD (NEON/SSE)
    processImage(data);
    
    const end = performance.now();
    setNativeTime(end - start);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const currentImage = imageUri || (assets ? assets[0].uri : null);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Chroma Key Benchmark</ThemedText>
      
      <ThemedText style={styles.description}>
        Comparando performance: JavaScript vs C++ (SIMD)
        {"\n"}Processando buffer de {(DATA_SIZE / 1024 / 1024).toFixed(1)}MB
      </ThemedText>

      {currentImage && (
        <Image source={{ uri: currentImage }} style={styles.image} resizeMode="contain" />
      )}

      <View style={styles.resultsContainer}>
        <View style={styles.resultBox}>
          <ThemedText type="defaultSemiBold">JavaScript</ThemedText>
          <ThemedText>{jsTime ? `${jsTime.toFixed(2)} ms` : "---"}</ThemedText>
          <Button title="Rodar JS" onPress={runJSProcess} color="#ff6347" />
        </View>

        <View style={styles.resultBox}>
          <ThemedText type="defaultSemiBold">Native (SIMD)</ThemedText>
          <ThemedText>{nativeTime ? `${nativeTime.toFixed(2)} ms` : "---"}</ThemedText>
          <Button title="Rodar Nativo" onPress={runNativeProcess} color="#4682b4" />
        </View>
      </View>

      {jsTime && nativeTime && (
        <ThemedText style={styles.gainText}>
          Ganho de Performance: {Math.round(jsTime / nativeTime)}x mais rápido!
        </ThemedText>
      )}

      <View style={styles.footer}>
        <Button title="Trocar Imagem" onPress={pickImage} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    textAlign: 'center',
    marginVertical: 15,
    opacity: 0.8,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
  },
  resultBox: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    width: '45%',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },
  gainText: {
    fontSize: 18,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 10,
  },
  footer: {
    marginTop: 30,
  }
});
