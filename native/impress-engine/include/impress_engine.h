#pragma once

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include "rust/cxx.h"

namespace liberty::impress {

// ImpressEngine handles importing and exporting presentation formats (PPTX, ODP, HTML)
class ImpressEngine {
public:
    ImpressEngine() = default;
    ~ImpressEngine() = default;

    // Load file from binary bytes and return JSON array representation of slides
    std::string load_file(rust::Slice<const uint8_t> file_bytes, const std::string& extension);

    // Export JSON slides back to formatted binary presentation bytes (e.g. PPTX mockup)
    std::vector<uint8_t> export_file(const std::string& json_slides, const std::string& extension);

private:
    std::mutex mutex_;
};

// Creation factory for Rust FFI bindings
std::unique_ptr<ImpressEngine> create_impress_engine();

} // namespace liberty::impress
