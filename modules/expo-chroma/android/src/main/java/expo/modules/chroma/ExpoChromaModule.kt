package expo.modules.chroma

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.typedarray.Uint8Array
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer

class ExpoChromaModule : Module() {
  override fun definition() = ModuleDefinition {
    // Nome que será usado no JavaScript: requireNativeModule('ExpoChroma')
    Name("ExpoChroma")

    // Função síncrona para processar buffers pequenos ou testes rápidos
    Function("processImage") { data: Uint8Array ->
      nativeProcessImage(data.toDirectBuffer(), data.byteLength)
      return@Function true
    }

    Function("processImageScalar") { data: Uint8Array ->
      nativeProcessImageScalar(data.toDirectBuffer(), data.byteLength)
      return@Function true
    }

    // Função assíncrona: Ideal para não travar a UI durante o processamento
    AsyncFunction("processImageAsync") { data: Uint8Array ->
      nativeProcessImage(data.toDirectBuffer(), data.byteLength)
      return@AsyncFunction true
    }

    /**
     * Processa uma imagem Base64.
     * Útil para demonstrações onde a imagem vem de um seletor ou URI.
     */
    AsyncFunction("processImageBase64") { base64String: String ->
      processBase64(base64String, useSimd = true)
    }

    AsyncFunction("processImageBase64Scalar") { base64String: String ->
      processBase64(base64String, useSimd = false)
    }

    // Retorna os pixels puros (RGBA) de uma imagem Base64
    Function("getPixels") { base64String: String ->
      val decodedBytes = Base64.decode(base64String, Base64.DEFAULT)
      val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
      val argbBitmap = if (bitmap.config != Bitmap.Config.ARGB_8888) {
          bitmap.copy(Bitmap.Config.ARGB_8888, false)
      } else {
          bitmap
      }
      val byteBuffer = ByteBuffer.allocate(argbBitmap.byteCount)
      argbBitmap.copyPixelsToBuffer(byteBuffer)
      return@Function byteBuffer.array()
    }

    // Converte pixels puros (RGBA) de volta para Base64
    Function("getBase64FromPixels") { pixels: Uint8Array, width: Int, height: Int ->
      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      val byteBuffer = pixels.toDirectBuffer()
      byteBuffer.rewind()
      bitmap.copyPixelsFromBuffer(byteBuffer)
      
      val outputStream = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
      return@Function Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
    }
  }

  private fun processBase64(base64String: String, useSimd: Boolean): String {
    // 1. Decodifica a string Base64 para bytes
    val decodedBytes = try {
      Base64.decode(base64String, Base64.DEFAULT)
    } catch (e: Exception) {
      throw Exception("Falha ao decodificar Base64")
    }

    // 2. Transforma bytes em um objeto Bitmap do Android
    val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size) 
      ?: throw Exception("Falha ao decodificar imagem")
    
    // 3. Garante que o Bitmap seja mutável e esteja no formato ARGB_8888 (4 bytes por pixel)
    val mutableBitmap = if (bitmap.isMutable && bitmap.config == Bitmap.Config.ARGB_8888) {
      bitmap
    } else {
      bitmap.copy(Bitmap.Config.ARGB_8888, true)
    }
    
    // 4. Aloca um DirectBuffer para que o C++ possa acessar a memória diretamente
    val byteBuffer = ByteBuffer.allocateDirect(mutableBitmap.byteCount)
    mutableBitmap.copyPixelsToBuffer(byteBuffer)
    
    // 5. Chama o kernel C++ (SIMD ou Escalar)
    if (useSimd) {
      nativeProcessImage(byteBuffer, mutableBitmap.byteCount)
    } else {
      nativeProcessImageScalar(byteBuffer, mutableBitmap.byteCount)
    }
    
    // 6. Copia os pixels processados de volta para o Bitmap
    byteBuffer.rewind()
    mutableBitmap.copyPixelsFromBuffer(byteBuffer)
    
    // 7. Comprime o resultado de volta para Base64 para exibição no React Native
    val outputStream = ByteArrayOutputStream()
    mutableBitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
    val resultBytes = outputStream.toByteArray()
    
    return Base64.encodeToString(resultBytes, Base64.NO_WRAP)
  }

  // Declaração do método nativo implementado em C++
  private external fun nativeProcessImage(buffer: ByteBuffer, length: Int)
  private external fun nativeProcessImageScalar(buffer: ByteBuffer, length: Int)

  companion object {
    init {
      // ISSO É CRUCIAL: Carrega a biblioteca C++ compilada
      // O nome "expo-chroma" é definido no CMakeLists.txt
      System.loadLibrary("expo-chroma")
    }
  }
}
