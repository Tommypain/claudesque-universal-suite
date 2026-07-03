#pragma once

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include "text_engine.h" // Depends on liberty::text::TextEngine

namespace liberty::layout {

// Positioned line of wrapped text on a page
struct LineRun {
    std::string text;
    float x;
    float y;
    float width;
    float height;
};

// Represents a paginated sheet containing positioned text lines
struct LayoutPage {
    uint32_t page_number;
    float width;
    float height;
    std::vector<LineRun> lines;
};

// LayoutEngine wraps text paragraphs into multiple lines/pages
class LayoutEngine {
public:
    LayoutEngine() = default;
    ~Group() = default;

    // Reflow a document text into paginated line runs using margins and shaping metric lookups
    std::vector<LayoutPage> reflow_document(
        const std::string& text,
        float page_width,
        float page_height,
        float margin,
        const std::string& font_name,
        float font_size,
        liberty::text::TextEngine& text_shaper
    );

private:
    std::mutex mutex_;
};

// Creation factory for Rust FFI bindings
std::unique_ptr<LayoutEngine> create_layout_engine();

} // namespace liberty::layout
