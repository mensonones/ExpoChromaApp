import { Ionicons } from '@expo/vector-icons';
import { useAssets } from 'expo-asset';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { getBase64FromPixels, getPixels, processImage, processImageScalar, processImageBase64, processImageBase64Scalar } from '../../modules/expo-chroma';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [assets] = useAssets([require('@/assets/images/chroma.png')]);
  const [jsTime, setJsTime] = useState<number | null>(null);
  const [nativeTime, setNativeTime] = useState<number | null>(null);
  const [scalarTime, setScalarTime] = useState<number | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const speedGain = useMemo(() => {
    if (!jsTime || !nativeTime) return null;
    return (jsTime / nativeTime).toFixed(1);
  }, [jsTime, nativeTime]);

  const simdVsScalar = useMemo(() => {
    if (!scalarTime || !nativeTime) return null;
    return (scalarTime / nativeTime).toFixed(1);
  }, [scalarTime, nativeTime]);

  // Buffer de 8MB para teste de estresse (equivalente a uma imagem 2K RGBA)
  const DATA_SIZE = 2000 * 1000 * 4; 
  
  const runJSProcess = async () => {
    if (!assets) return;
    setProcessedImage(null); // Reset visual
    setIsProcessing(true);
    
    try {
      // Pequeno delay para o usuário ver o reset
      await new Promise(resolve => setTimeout(resolve, 100));

      // 1. Benchmark de Stress
      const data = new Uint8Array(DATA_SIZE);
      for (let i = 0; i < DATA_SIZE; i += 4) {
        data[i] = 50; data[i+1] = 200; data[i+2] = 50; data[i+3] = 255;
      }

      const start = performance.now();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i+1] > (data[i] + 30) && data[i+1] > (data[i+2] + 30)) {
          data[i+3] = 0;
        }
      }
      const end = performance.now();
      setJsTime(end - start);

      // 2. Processamento Visual no JS
      const asset = assets[0];
      const uri = asset.localUri || asset.uri;
      if (!uri) return;

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      
      // Pegamos os pixels brutos via Native (já que JS não decodifica PNG/JPG nativamente no RN)
      const pixels = getPixels(base64);
      
      // Processamos no JS (Lento)
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i+1];
        const b = pixels[i+2];
        // Algoritmo idêntico ao C++
        if (g > (r + 30) && g > (b + 30)) {
          pixels[i+3] = 0; // Alpha = 0
        }
      }

      // Convertemos de volta para Base64 via Native (para exibir na Image)
      const resultBase64 = getBase64FromPixels(pixels, asset.width || 1024, asset.height || 1024);
      setProcessedImage(`data:image/png;base64,${resultBase64}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const runNativeProcess = async () => {
    if (!assets) return;
    setProcessedImage(null); // Reset visual
    setIsProcessing(true);

    try {
      // Pequeno delay para o usuário ver o reset
      await new Promise(resolve => setTimeout(resolve, 100));

      // 1. Benchmark de Stress (Buffer Puro)
      const data = new Uint8Array(DATA_SIZE);
      for (let i = 0; i < DATA_SIZE; i += 4) {
        data[i] = 50; data[i+1] = 200; data[i+2] = 50; data[i+3] = 255;
      }
      const start = performance.now();
      processImage(data);
      const end = performance.now();
      setNativeTime(end - start);

      // 2. Processamento Visual (Imagem Real)
      const asset = assets[0];
      const uri = asset.localUri || asset.uri;
      
      if (!uri) {
        console.error("URI da imagem não encontrada");
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      const resultBase64 = await processImageBase64(base64);
      setProcessedImage(`data:image/png;base64,${resultBase64}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const runScalarProcess = async () => {
    if (!assets) return;
    setProcessedImage(null);
    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      // 1. Benchmark de Stress (Buffer Puro)
      const data = new Uint8Array(DATA_SIZE);
      for (let i = 0; i < DATA_SIZE; i += 4) {
        data[i] = 50; data[i+1] = 200; data[i+2] = 50; data[i+3] = 255;
      }
      const start = performance.now();
      processImageScalar(data);
      const end = performance.now();
      setScalarTime(end - start);

      // 2. Processamento Visual (Imagem Real)
      const asset = assets[0];
      const uri = asset.localUri || asset.uri;
      if (!uri) return;

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const resultBase64 = await processImageBase64Scalar(base64);
      setProcessedImage(`data:image/png;base64,${resultBase64}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerTitle}>Expo Chroma <ThemedText style={styles.simdBadge}>SIMD</ThemedText></ThemedText>
            <ThemedText style={styles.headerSubtitle}>High-Performance Image Processing</ThemedText>
          </View>
        </View>

        {/* Main Canvas */}
        <View style={styles.mainCard}>
          <View style={styles.canvasHeader}>
            <Ionicons name="image-outline" size={20} color="#94a3b8" />
            <ThemedText style={styles.canvasHeaderText}>PREVIEW DO RESULTADO</ThemedText>
          </View>

          <View style={styles.imageWrapper}>
            <View style={styles.checkerboard}>
              {Array.from({ length: 100 }).map((_, i) => (
                <View key={i} style={[styles.checkerSquare, (Math.floor(i/10) + i) % 2 === 0 ? styles.checkerDark : null]} />
              ))}
            </View>

            <Image
              source={processedImage && !showOriginal ? { uri: processedImage } : require('@/assets/images/chroma.png')}
              style={styles.mainImage}
              contentFit="contain"
              transition={300}
            />

            {isProcessing && (
              <BlurView intensity={20} style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FCFCFC" />
                <ThemedText style={styles.loadingText}>PROCESSANDO...</ThemedText>
              </BlurView>
            )}
          </View>

          <View style={styles.canvasFooter}>
            <TouchableOpacity 
              style={[styles.footerBtn, !processedImage && styles.btnDisabled]} 
              onPressIn={() => setShowOriginal(true)}
              onPressOut={() => setShowOriginal(false)}
              disabled={!processedImage}
            >
              <Ionicons name="eye-outline" size={18} color="#fff" />
              <ThemedText style={styles.footerBtnText}>Ver Original</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.footerBtnReset} 
              onPress={() => {
                setProcessedImage(null);
                setJsTime(null);
                setNativeTime(null);
                setScalarTime(null);
              }}
            >
              <Ionicons name="refresh-outline" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Comparison Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Benchmarks de Performance</ThemedText>
          <ThemedText style={styles.sectionDesc}>Comparação de processamento de imagem real (Base64 -> Native -> Base64)</ThemedText>
        </View>

        <View style={styles.benchGrid}>
          {/* JS Card */}
          <TouchableOpacity 
            style={[styles.benchCard, { borderTopColor: '#f43f5e' }]} 
            onPress={runJSProcess}
            disabled={isProcessing}
          >
            <View style={styles.benchCardHeader}>
              <ThemedText style={styles.benchLabel}>JS (Hermes)</ThemedText>
              <Ionicons name="logo-javascript" size={16} color="#f43f5e" />
            </View>
            <ThemedText style={styles.benchTime}>{jsTime ? `${jsTime.toFixed(0)}ms` : '--'}</ThemedText>
            <View style={styles.techStack}>
              <ThemedText style={styles.techTag}>Hermes</ThemedText>
            </View>
          </TouchableOpacity>

          {/* C++ Scalar Card */}
          <TouchableOpacity 
            style={[styles.benchCard, { borderTopColor: '#fbbf24' }]} 
            onPress={runScalarProcess}
            disabled={isProcessing}
          >
            <View style={styles.benchCardHeader}>
              <ThemedText style={styles.benchLabel}>C++ (Escalar)</ThemedText>
              <Ionicons name="code-outline" size={16} color="#fbbf24" />
            </View>
            <ThemedText style={styles.benchTime}>{scalarTime ? `${scalarTime.toFixed(0)}ms` : '--'}</ThemedText>
            <View style={styles.techStack}>
              <ThemedText style={styles.techTag}>Native</ThemedText>
            </View>
          </TouchableOpacity>

          {/* C++ SIMD Card */}
          <TouchableOpacity 
            style={[styles.benchCard, { borderTopColor: '#38bdf8' }]} 
            onPress={runNativeProcess}
            disabled={isProcessing}
          >
            <View style={styles.benchCardHeader}>
              <ThemedText style={styles.benchLabel}>C++ (SIMD)</ThemedText>
              <Ionicons name="flash" size={16} color="#38bdf8" />
            </View>
            <ThemedText style={styles.benchTime}>{nativeTime ? `${nativeTime.toFixed(0)}ms` : '--'}</ThemedText>
            <View style={styles.techStack}>
              <ThemedText style={[styles.techTag, { 
                backgroundColor: 'rgba(56, 189, 248, 0.15)', 
                color: '#38bdf8',
                borderColor: 'rgba(56, 189, 248, 0.3)' 
              }]}>NEON</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {simdVsScalar && (
          <LinearGradient
            colors={['rgba(56, 189, 248, 0.2)', 'rgba(56, 189, 248, 0.05)']}
            style={styles.gainBanner}
          >
            <Ionicons name="rocket" size={24} color="#38bdf8" />
            <ThemedText style={styles.gainText}>
              Otimização SIMD é <ThemedText style={styles.gainHighlight}>{simdVsScalar}x</ThemedText> mais rápida que o C++ comum!
            </ThemedText>
          </LinearGradient>
        )}

        {/* Info Section */}
        <View style={styles.infoCard}>
          <ThemedText style={styles.infoTitle}>Por que a diferença?</ThemedText>
          
          <View style={styles.infoRow}>
            <View style={[styles.dot, { backgroundColor: '#f43f5e' }]} />
            <ThemedText style={styles.infoText}>
              <ThemedText style={{ fontWeight: 'bold', color: '#f43f5e' }}>JS (Hermes):</ThemedText> O JavaScript processa a lógica pixel a pixel. Mesmo com o motor Hermes, o loop no JS é sequencial e limitado pela velocidade de execução da linguagem para grandes volumes de dados.
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.dot, { backgroundColor: '#38bdf8' }]} />
            <ThemedText style={styles.infoText}>
              <ThemedText style={{ fontWeight: 'bold', color: '#38bdf8' }}>JS + Kotlin + C++ (SIMD):</ThemedText> Utilizamos a nova arquitetura do Expo Modules (JSI) para chamar o C++ diretamente. O processador ARM executa instruções <ThemedText style={{ fontWeight: 'bold' }}>NEON</ThemedText> para processar <ThemedText style={{ fontWeight: 'bold' }}>16 pixels</ThemedText> simultaneamente.
            </ThemedText>
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  simdBadge: {
    fontSize: 12,
    color: '#FCFCFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontWeight: 'bold',
    verticalAlign: 'middle',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  mainCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  canvasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  canvasHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  imageWrapper: {
    height: 280,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  mainImage: {
    flex: 1,
    width: '100%',
  },
  checkerboard: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkerSquare: {
    width: '10%',
    height: '10%',
    backgroundColor: '#1e293b',
  },
  checkerDark: {
    backgroundColor: '#0f172a',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FCFCFC',
    letterSpacing: 2,
  },
  canvasFooter: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    backgroundColor: '#38bdf8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  footerBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerBtnReset: {
    width: 48,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  benchGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  benchCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 20,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  benchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  benchLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    maxWidth: '70%',
  },
  benchTime: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
  },
  techStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  techTag: {
    fontSize: 10,
    color: '#94a3b8',
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '700',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gainBanner: {
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  gainText: {
    flex: 1,
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
  },
  gainHighlight: {
    color: '#38bdf8',
    fontWeight: '900',
    fontSize: 18,
  },
  infoCard: {
    marginTop: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    borderRadius: 24,
    gap: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  }
});
