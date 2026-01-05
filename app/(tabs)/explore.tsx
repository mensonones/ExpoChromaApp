import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0f172a', dark: '#0f172a' }}
      headerImage={
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <StatusBar barStyle="light-content" />
          <LinearGradient
            colors={['#38bdf8', '#1e293b']}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="hardware-chip-outline" size={200} color="rgba(255,255,255,0.1)" style={styles.headerIcon} />
          <View style={styles.headerTextContainer}>
            <ThemedText style={styles.headerTitle}>Deep Dive</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Arquitetura & Performance</ThemedText>
          </View>
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Por que SIMD?</ThemedText>
      </ThemedView>
      
      <ThemedText style={styles.introText}>
        O processamento de imagens em tempo real no mobile exige eficiência extrema. O Expo Chroma utiliza instruções nativas do processador para alcançar velocidades impossíveis no JavaScript tradicional.
      </ThemedText>

      <Collapsible title="🚀 O que é SIMD?">
        <ThemedText>
          <ThemedText type="defaultSemiBold">SIMD</ThemedText> (Single Instruction, Multiple Data) permite que o processador execute a mesma operação em múltiplos dados simultaneamente.
        </ThemedText>
        <ThemedText style={styles.detailText}>
          Enquanto um loop comum processa um pixel por vez, nossas instruções <ThemedText type="defaultSemiBold">ARM NEON</ThemedText> processam <ThemedText type="defaultSemiBold">64 bytes (16 pixels)</ThemedText> em um único ciclo de CPU. Isso reduz drasticamente o consumo de bateria e o tempo de execução.
        </ThemedText>
      </Collapsible>

      <Collapsible title="🛠️ Arquitetura Híbrida">
        <ThemedText>
          Este projeto demonstra o fluxo moderno de dados entre as camadas do sistema usando <ThemedText type="defaultSemiBold">JSI (JavaScript Interface)</ThemedText>:
        </ThemedText>
        <View style={styles.listContainer}>
          <ThemedText style={styles.listItem}>• <ThemedText type="defaultSemiBold">JavaScript (React Native):</ThemedText> Orquestra a interface e chama funções nativas de forma síncrona e eficiente.</ThemedText>
          <ThemedText style={styles.listItem}>• <ThemedText type="defaultSemiBold">Kotlin / Swift (Expo Modules):</ThemedText> Utiliza o <ThemedText type="defaultSemiBold">JSI</ThemedText> para expor funções diretamente ao motor JS, eliminando a serialização JSON da antiga Bridge.</ThemedText>
          <ThemedText style={styles.listItem}>• <ThemedText type="defaultSemiBold">C++ (SIMD Kernels):</ThemedText> Onde o processamento pesado ocorre, utilizando instruções <ThemedText type="defaultSemiBold">ARM NEON</ThemedText> para manipular pixels em paralelo.</ThemedText>
        </View>
      </Collapsible>

      <Collapsible title="📊 JS vs Native: A Diferença">
        <ThemedText>
          No JavaScript (Hermes), cada acesso a um array de pixels envolve verificações de limites e conversões de tipos.
        </ThemedText>
        <ThemedText style={styles.detailText}>
          Ao mover para C++, o compilador pode tentar a <ThemedText type="defaultSemiBold">Auto-Vetorização</ThemedText> (usar SIMD automaticamente). No nosso benchmark, desativamos isso na versão escalar para mostrar a diferença real: o C++ manual com <ThemedText type="defaultSemiBold">NEON</ThemedText> chega a ser <ThemedText type="defaultSemiBold">10x mais rápido</ThemedText> que o C++ comum e <ThemedText type="defaultSemiBold">50x</ThemedText> mais rápido que o JS.
        </ThemedText>
      </Collapsible>

      <Collapsible title="💡 Motivação">
        <ThemedText>
          A motivação principal é provar que o React Native, através do <ThemedText type="defaultSemiBold">Expo Modules SDK</ThemedText>, não está limitado a interfaces de usuário. Ele é uma plataforma capaz de lidar com computação pesada, como edição de vídeo, filtros de imagem complexos e visão computacional, sem comprometer a experiência do usuário.
        </ThemedText>
      </Collapsible>

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>Desenvolvido com foco em performance extrema.</ThemedText>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  titleContainer: {
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    color: '#94a3b8',
  },
  detailText: {
    marginTop: 8,
    color: '#64748b',
  },
  listContainer: {
    marginTop: 12,
    gap: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#94a3b8',
  },
  footer: {
    marginTop: 40,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  },
});
