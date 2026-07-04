#pragma once

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include "rust/cxx.h"

namespace liberty::sheets {

// SheetsEngine handles importing and exporting spreadsheet formats (XLSX, CSV, TSV)
class SheetsEngine {
public:
    SheetsEngine() = default;
    ~SheetsEngine() = default;

    // Load file from binary bytes and return JSON representation of cells
    std::string load_file(rust::Slice<const uint8_t> file_bytes, const std::string& extension);

    // Export JSON back to formatted binary file bytes (XLSX, CSV)
    std::vector<uint8_t> export_file(const std::string& json_data, const std::string& extension);

private:
    std::mutex mutex_;
};

// Creation factory for Rust FFI bindings
std::unique_ptr<SheetsEngine> create_sheets_engine();

} // namespace liberty::sheets
