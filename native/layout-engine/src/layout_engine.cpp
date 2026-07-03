#include "layout_engine.h"
#include "kernel.h"
#include <sstream>
#include <iostream>
#include <cmath>

namespace liberty::layout {

// LayoutEngine Implementation
std::vector<LayoutPage> LayoutEngine::reflow_document(
    const std::string& text,
    float page_width,
    float page_height,
    float margin,
    const std::string& font_name,
    float font_size,
    liberty::text::TextEngine& text_shaper
) {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<LayoutPage> pages;

    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "Reflowing text layout on pages: width=" + std::to_string(page_width) + 
        ", height=" + std::to_string(page_height) + ", margin=" + std::to_string(margin)
    );

    if (text.empty()) {
        // Return a single empty page
        LayoutPage page;
        page.page_number = 1;
        page.width = page_width;
        page.height = page_height;
        pages.push_back(page);
        return pages;
    }

    // Available layout dimensions inside margins
    float max_width = page_width - (2.0f * margin);
    float max_height = page_height - (2.0f * margin);
    float line_height = font_size * 1.25f; // Standard line-height spacing factor

    // Split text into words/tokens
    std::vector<std::string> words;
    std::stringstream ss(text);
    std::string word;
    while (ss >> word) {
        words.push_back(word);
    }

    // Wrap words into lines
    std::vector<std::string> lines;
    std::string current_line = "";
    float current_width = 0.0f;

    // Helper: calculate width of a string using text_shaper metrics
    auto calculate_text_width = [&](const std::string& str) -> float {
        float width = 0.0f;
        auto glyphs = text_shaper.shape_text(str, font_name, font_size);
        for (const auto& g : glyphs) {
            width += g.x_advance;
        }
        return width;
    };

    float space_width = calculate_text_width(" ");

    for (const auto& w : words) {
        float word_width = calculate_text_width(w);
        
        if (current_line.empty()) {
            current_line = w;
            current_width = word_width;
        } else {
            // Check if adding the word fits in current line width
            float new_width = current_width + space_width + word_width;
            if (new_width <= max_width) {
                current_line += " " + w;
                current_width = new_width;
            } else {
                // Wrap to a new line
                lines.push_back(current_line);
                current_line = w;
                current_width = word_width;
            }
        }
    }

    if (!current_line.empty()) {
        lines.push_back(current_line);
    }

    // Paginate lines
    uint32_t current_page_num = 1;
    LayoutPage current_page;
    current_page.page_number = current_page_num;
    current_page.width = page_width;
    current_page.height = page_height;
    
    float current_y = margin;

    for (const auto& line_text : lines) {
        // Check if the line fits vertically on the current page
        if (current_y + line_height > page_height - margin) {
            // Add current page and start a new one
            pages.push_back(current_page);
            
            current_page_num++;
            current_page = LayoutPage();
            current_page.page_number = current_page_num;
            current_page.width = page_width;
            current_page.height = page_height;
            current_y = margin;
        }

        // Add line run inside page
        LineRun run;
        run.text = line_text;
        run.x = margin; // Left margin aligned
        run.y = current_y;
        run.width = calculate_text_width(line_text);
        run.height = font_size;

        current_page.lines.push_back(run);
        current_y += line_height;
    }

    pages.push_back(current_page);

    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "Pagination complete. Total pages: " + std::to_string(pages.size())
    );

    return pages;
}

// Factory Creator
std::unique_ptr<LayoutEngine> create_layout_engine() {
    return std::make_unique<LayoutEngine>();
}

} // namespace liberty::layout
