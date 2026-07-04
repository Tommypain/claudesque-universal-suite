#pragma once

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include "rust/cxx.h"

namespace liberty::design {

// Representation of a vector primitive shape in the scene graph
struct VectorShape {
    std::string id;
    std::string type; // "rect", "circle", "line"
    float x;
    float y;
    float width;
    float height;
    std::string fill;
    std::string stroke;
};

// DesignEngine manages the vector shapes, scene graph list, and SVG parser/writer
class DesignEngine {
public:
    DesignEngine() = default;
    ~DesignEngine() = default;

    // Add a shape to the scene graph and return its generated ID
    std::string add_shape(
        const std::string& type, 
        float x, 
        float y, 
        float w, 
        float h, 
        const std::string& fill, 
        const std::string& stroke
    );

    // Export current scene graph shapes as W3C SVG string markup
    std::string export_svg() const;

    // Parse W3C SVG elements and populate the scene graph shapes list
    bool load_svg(const std::string& svg_data);

    // Clear the active scene graph
    void clear();

private:
    std::vector<VectorShape> shapes_;
    mutable std::mutex mutex_;
};

// Creation factory for Rust FFI bindings
std::unique_ptr<DesignEngine> create_design_engine();

} // namespace liberty::design
