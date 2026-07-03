#pragma once

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include "rust/cxx.h"

namespace liberty::docs {

// DocsEngine handles importing and exporting doc formats (DOCX, ODT, HTML)
class DocsEngine {
public:
    DocsEngine() = default;
    ~DocsEngine() = default;

    // Load file from binary bytes and return HTML representation
    std::string load_file(rust::Slice<const uint8_t> file_bytes, const std::string& extension);

    // Export HTML back to formatted binary file bytes (e.g. DOCX format)
    std::vector<uint8_t> export_file(const std::string& html, const std::string& extension);

private:
    std::mutex mutex_;
};

// Creation factory for Rust FFI bindings
std::unique_ptr<DocsEngine> create_docs_engine();

} // namespace liberty::docs
