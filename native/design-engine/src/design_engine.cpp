#include "design_engine.h"
#include "kernel.h"
#include <iostream>
#include <sstream>
#include <algorithm>
#include <cstdlib>

namespace liberty::design {

// Helper: extracts attribute value from tag string (e.g. fill="#ff0000")
static std::string extract_attribute(const std::string& tag, const std::string& attr) {
    size_t pos = tag.find(attr + "=");
    if (pos == std::string::npos) return "";
    
    // Check next character for quote
    if (pos + attr.length() + 1 >= tag.length()) return "";
    char quote = tag[pos + attr.length() + 1];
    if (quote != '"' && quote != '\'') return "";
    
    size_t start = pos + attr.length() + 2;
    size_t end = tag.find(quote, start);
    if (end == std::string::npos) return "";
    
    return tag.substr(start, end - start);
}

// Add shape implementation
std::string DesignEngine::add_shape(
    const std::string& type, 
    float x, 
    float y, 
    float w, 
    float h, 
    const std::string& fill, 
    const std::string& stroke
) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::string id = "shape-" + std::to_string(rand() % 1000000);
    VectorShape shape{id, type, x, y, w, h, fill, stroke};
    shapes_.push_back(shape);
    
    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "DesignEngine: Added shape: " + type + " (ID: " + id + ")"
    );
    
    return id;
}

// Export SVG implementation
std::string DesignEngine::export_svg() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::stringstream ss;
    ss << "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 800 600\" width=\"800\" height=\"600\">\n";
    
    for (const auto& shape : shapes_) {
        if (shape.type == "rect") {
            ss << "  <rect id=\"" << shape.id << "\" x=\"" << shape.x << "\" y=\"" << shape.y
               << "\" width=\"" << shape.width << "\" height=\"" << shape.height
               << "\" fill=\"" << shape.fill << "\" stroke=\"" << shape.stroke << "\" />\n";
        } else if (shape.type == "circle") {
            ss << "  <circle id=\"" << shape.id << "\" cx=\"" << shape.x << "\" cy=\"" << shape.y
               << "\" r=\"" << shape.width / 2.0f << "\" fill=\"" << shape.fill
               << "\" stroke=\"" << shape.stroke << "\" />\n";
        } else if (shape.type == "line") {
            ss << "  <line id=\"" << shape.id << "\" x1=\"" << shape.x << "\" y1=\"" << shape.y
               << "\" x2=\"" << shape.x + shape.width << "\" y2=\"" << shape.y + shape.height
               << "\" fill=\"" << shape.fill << "\" stroke=\"" << shape.stroke << "\" />\n";
        }
    }
    
    ss << "</svg>";
    return ss.str();
}

// Load SVG implementation
bool DesignEngine::load_svg(const std::string& svg_data) {
    std::lock_guard<std::mutex> lock(mutex_);
    shapes_.clear();
    
    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "DesignEngine: Parsing SVG data (" + std::to_string(svg_data.length()) + " chars)"
    );
    
    size_t pos = 0;
    while (true) {
        size_t tag_start = svg_data.find('<', pos);
        if (tag_start == std::string::npos) break;
        size_t tag_end = svg_data.find('>', tag_start);
        if (tag_end == std::string::npos) break;
        
        std::string tag = svg_data.substr(tag_start, tag_end - tag_start + 1);
        pos = tag_end + 1;
        
        // Check tag name
        if (tag.rfind("<rect", 0) == 0) {
            std::string id = extract_attribute(tag, "id");
            if (id.empty()) id = "shape-" + std::to_string(rand() % 1000000);
            
            float x = 0.0f, y = 0.0f, w = 100.0f, h = 100.0f;
            std::string xs = extract_attribute(tag, "x");
            std::string ys = extract_attribute(tag, "y");
            std::string ws = extract_attribute(tag, "width");
            std::string hs = extract_attribute(tag, "height");
            
            if (!xs.empty()) x = std::stof(xs);
            if (!ys.empty()) y = std::stof(ys);
            if (!ws.empty()) w = std::stof(ws);
            if (!hs.empty()) h = std::stof(hs);
            
            std::string fill = extract_attribute(tag, "fill");
            std::string stroke = extract_attribute(tag, "stroke");
            if (fill.empty()) fill = "#cccccc";
            if (stroke.empty()) stroke = "none";
            
            shapes_.push_back({id, "rect", x, y, w, h, fill, stroke});
        } 
        else if (tag.rfind("<circle", 0) == 0) {
            std::string id = extract_attribute(tag, "id");
            if (id.empty()) id = "shape-" + std::to_string(rand() % 1000000);
            
            float cx = 0.0f, cy = 0.0f, r = 50.0f;
            std::string cxs = extract_attribute(tag, "cx");
            std::string cys = extract_attribute(tag, "cy");
            std::string rs = extract_attribute(tag, "r");
            
            if (!cxs.empty()) cx = std::stof(cxs);
            if (!cys.empty()) cy = std::stof(cys);
            if (!rs.empty()) r = std::stof(rs);
            
            std::string fill = extract_attribute(tag, "fill");
            std::string stroke = extract_attribute(tag, "stroke");
            if (fill.empty()) fill = "#cccccc";
            if (stroke.empty()) stroke = "none";
            
            // Map circle cx/cy/r to x/y/width/height model
            shapes_.push_back({id, "circle", cx, cy, r * 2.0f, r * 2.0f, fill, stroke});
        }
        else if (tag.rfind("<line", 0) == 0) {
            std::string id = extract_attribute(tag, "id");
            if (id.empty()) id = "shape-" + std::to_string(rand() % 1000000);
            
            float x1 = 0.0f, y1 = 0.0f, x2 = 100.0f, y2 = 100.0f;
            std::string x1s = extract_attribute(tag, "x1");
            std::string y1s = extract_attribute(tag, "y1");
            std::string x2s = extract_attribute(tag, "x2");
            std::string y2s = extract_attribute(tag, "y2");
            
            if (!x1s.empty()) x1 = std::stof(x1s);
            if (!y1s.empty()) y1 = std::stof(y1s);
            if (!x2s.empty()) x2 = std::stof(x2s);
            if (!y2s.empty()) y2 = std::stof(y2s);
            
            std::string fill = extract_attribute(tag, "fill");
            std::string stroke = extract_attribute(tag, "stroke");
            if (fill.empty()) fill = "none";
            if (stroke.empty()) stroke = "#000000";
            
            // Map line x1/y1/x2/y2 to x/y/width/height model
            shapes_.push_back({id, "line", x1, y1, x2 - x1, y2 - y1, fill, stroke});
        }
    }
    
    return true;
}

// Clear shapes
void DesignEngine::clear() {
    std::lock_guard<std::mutex> lock(mutex_);
    shapes_.clear();
}

// Factory Creator
std::unique_ptr<DesignEngine> create_design_engine() {
    return std::make_unique<DesignEngine>();
}

} // namespace liberty::design
