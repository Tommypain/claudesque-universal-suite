#pragma once

#include <string>
#include <vector>
#include <memory>
#include <map>
#include <mutex>
#include "rust/cxx.h"

namespace liberty::text {

// Shaped glyph positioning metrics
struct GlyphPosition;

// TextEngine shapes Unicode text strings into glyph offsets/coordinates
class TextEngine {
public:
    TextEngine() = default;
    ~TextEngine() = default;

    // Load font from path
    bool load_font_from_path(const std::string& font_name, const std::string& path);

    // Load font from memory bytes
    bool load_font_from_memory(const std::string& font_name, rust::Slice<const uint8_t> font_bytes);

    // Shape a text string. Returns shaped glyph positioning metrics.
    std::vector<GlyphPosition> shape_text(
        const std::string& text,
        const std::string& font_name,
        float font_size
    );

    // Check if a font is loaded
    bool has_font(const std::string& font_name) const;

private:
    std::map<std::string, std::vector<uint8_t>> font_cache_;
    std::map<std::string, std::string> font_paths_;
    mutable std::mutex mutex_;
};

// Creation factory for Rust FFI bindings
std::unique_ptr<TextEngine> create_text_engine();

} // namespace liberty::text
