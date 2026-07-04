#pragma once

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include "rust/cxx.h"

namespace liberty::pdf {

// PdfEngine handles PDF reading, annotation tracking, and digital signing using PDFium interfaces
class PdfEngine {
public:
    PdfEngine() = default;
    ~PdfEngine() = default;

    // Load PDF from binary bytes and return metadata JSON (pages count, title)
    std::string load_pdf(rust::Slice<const uint8_t> pdf_bytes);

    // Save annotations JSON and merge back to compiled PDF binary byte stream
    std::vector<uint8_t> save_pdf(rust::Slice<const uint8_t> pdf_bytes, const std::string& annotations_json);

private:
    std::mutex mutex_;
};

// Creation factory for Rust FFI bindings
std::unique_ptr<PdfEngine> create_pdf_engine();

} // namespace liberty::pdf
