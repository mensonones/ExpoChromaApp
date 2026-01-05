cmake_minimum_required(VERSION 3.10.2)

project(expo-chroma)

# 1. Source Files
add_library(
        ${PROJECT_NAME} 
        SHARED
        cpp/ExpoSimdChroma.cpp
        cpp/ExpoSimdChromaModule.cpp
)

# 2. Optimization Flags (O3 and NEON)
target_compile_options(${PROJECT_NAME} PRIVATE -O3 -ffast-math)

if(${ANDROID_ABI} STREQUAL "armeabi-v7a")
    target_compile_options(${PROJECT_NAME} PRIVATE -mfpu=neon)
endif()

# 3. Link Android libraries
target_link_libraries(
        ${PROJECT_NAME}
        PRIVATE
        android
        log
)
