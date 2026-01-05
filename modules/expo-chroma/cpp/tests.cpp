#include <iostream>
#include <vector>
#include <cassert>
#include "ExpoSimdChroma.h"

void test_chroma_key() {
    // Test 1: Pure Green Pixel
    std::vector<uint8_t> data = {0, 255, 0, 255};
    processChromaKey(data.data(), data.size());
    assert(data[3] == 0 && "Pure green should be transparent");

    // Test 2: Pure Red Pixel
    data = {255, 0, 0, 255};
    processChromaKey(data.data(), data.size());
    assert(data[3] == 255 && "Pure red should remain opaque");

    // Test 3: Mixed Green (Should be transparent)
    data = {50, 200, 50, 255};
    processChromaKey(data.data(), data.size());
    assert(data[3] == 0 && "Mixed green should be transparent");

    // Test 4: White Pixel
    data = {255, 255, 255, 255};
    processChromaKey(data.data(), data.size());
    assert(data[3] == 255 && "White should remain opaque");

    std::cout << "All C++ tests passed!" << std::endl;
}

int main() {
    test_chroma_key();
    return 0;
}
