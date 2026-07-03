#include "text_engine.h"
#include "kernel.h"
#include <iostream>

namespace liberty::text {

// TextEngine Implementation
bool TextEngine::load_font_from_path(const std::string& font_name, const std::string& path) {
    std::lock_guard<std::mutex> lock(mutex_);
    font_paths_[font_name] = path;
    
    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "Font loaded from path: " + font_name + " (" + path + ")"
    );
    return true;
}

bool TextEngine::load_font_from_memory(const std::string& font_name, rust::Slice<const uint8_t> font_bytes) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // Copy the slice elements into a vector
    std::vector<uint8_t> bytes(font_bytes.data(), font_bytes.data() + font_bytes.size());
    font_cache_[font_name] = std::move(bytes);
    
    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "Font loaded from memory buffer: " + font_name + " (" + std::to_string(font_bytes.size()) + " bytes)"
    );
    return true;
}

bool TextEngine::has_font(const std::string& font_name) const {
    std::lock_guard<std::mutex> lock(mutex_);
    return font_cache_.find(font_name) != font_cache_.end() || 
           font_paths_.find(font_name) != font_paths_.end();
}

std::vector<GlyphPosition> TextEngine::shape_text(
    const std::string& text,
    const std::string& font_name,
    float font_size
) {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<GlyphPosition> glyphs;
    
    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "Shaping text: \"" + text + "\" with font: " + font_name + " at size: " + std::to_string(font_size)
    );

    // If text is empty, return empty positions
    if (text.empty()) {
        return glyphs;
    }

    // Shaping simulation (Simulates HarfBuzz shaper outputs)
    // We iterate through character runs to simulate advance and offset metrics.
    // Standard latin layout advance is roughly ~0.6 * font_size.
    // Narrow characters (i, l, t, spaces) are ~0.3 * font_size.
    // Wide characters (w, m, caps) are ~0.8 * font_size.
    for (size_t i = 0; i < text.length(); ++i) {
        char c = text[i];
        
        GlyphPosition pos;
        pos.glyph_id = static_cast<uint32_t>(c); // Simple ASCII glyph ID mapping
        pos.x_offset = 0.0f;
        pos.y_offset = 0.0f;
        pos.y_advance = 0.0f; // Horizontal text layout has 0 y_advance

        // Calculate custom width based on character type
        if (c == ' ' || c == 'i' || c == 'l' || c == 't' || c == '.' || c == ',') {
            pos.x_advance = font_size * 0.3f;
        } else if (c == 'w' || c == 'm' || (c >= 'A' && c <= 'Z')) {
            pos.x_advance = font_size * 0.8f;
        } else {
            pos.x_advance = font_size * 0.6f;
        }

        // Simulating Arabic RTL layout offset modifications
        // In Arabic, shaping shifts letters backward/forward depending on context
        if (static_cast<unsigned char>(c) >= 0x80) {
            // Simulated RTL offset mapping
            pos.x_offset = -2.0f; 
        }

        glyphs.push_back(pos);
    }

    return glyphs;
}

// Factory Creator
std::unique_ptr<TextEngine> create_text_engine() {
    return std::make_unique<TextEngine>();
}

} // namespace liberty::text
