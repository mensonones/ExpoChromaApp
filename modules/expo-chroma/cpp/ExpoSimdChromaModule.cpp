#include <jni.h>
#include "ExpoSimdChroma.h"

extern "C" JNIEXPORT void JNICALL
Java_expo_modules_chroma_ExpoChromaModule_nativeProcessImage(
    JNIEnv* env,
    jobject thiz,
    jobject byteBuffer,
    jint length
) {
    uint8_t* data = (uint8_t*)env->GetDirectBufferAddress(byteBuffer);
    if (data != nullptr) {
        processChromaKey(data, (size_t)length);
    }
}

extern "C" JNIEXPORT void JNICALL
Java_expo_modules_chroma_ExpoChromaModule_nativeProcessImageScalar(
    JNIEnv* env,
    jobject thiz,
    jobject byteBuffer,
    jint length
) {
    uint8_t* data = (uint8_t*)env->GetDirectBufferAddress(byteBuffer);
    if (data != nullptr) {
        processChromaKeyScalar(data, (size_t)length);
    }
}
