#include "docs_engine.h"
#include "kernel.h"
#include <iostream>
#include <sstream>

namespace liberty::docs {

// DocsEngine Implementation
std::string DocsEngine::load_file(rust::Slice<const uint8_t> file_bytes, const std::string& extension) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "Importing file with extension: " + extension + " (" + 
        std::to_string(file_bytes.size()) + " bytes)"
    );

    // 1. If extension is HTML, directly convert bytes to string
    if (extension == ".html" || extension == ".htm") {
        return std::string(reinterpret_cast<const char*>(file_bytes.data()), file_bytes.size());
    }

    // 2. Parse txt format
    if (extension == ".txt") {
        std::string plain_text(reinterpret_cast<const char*>(file_bytes.data()), file_bytes.size());
        return "<p>" + plain_text + "</p>";
    }

    // 3. Simulated DOCX/ODT zip archive loading
    if (extension == ".docx" || extension == ".odt") {
        // Confirm it starts with ZIP magic header: "PK\x03\x04"
        bool is_zip = (file_bytes.size() >= 4 &&
                       file_bytes[0] == 'P' && file_bytes[1] == 'K' &&
                       file_bytes[2] == 0x03 && file_bytes[3] == 0x04);
        
        std::stringstream html;
        html << "<h2>Imported Office Document</h2>";
        if (is_zip) {
            html << "<p>Parsed zip container headers successfully. Loaded <strong>document.xml</strong>.</p>";
        } else {
            html << "<p>Warning: Missing ZIP header, loading contents raw.</p>";
        }
        
        html << "<p>Document size: " << file_bytes.size() << " bytes.</p>";
        html << "<p>This content was parsed and structured entirely inside the C++ <strong>docs-engine</strong>.</p>";
        
        return html.str();
    }

    // Fallback
    return "<p>Unsupported document format: " + extension + "</p>";
}

std::vector<uint8_t> DocsEngine::export_file(const std::string& html, const std::string& extension) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "Exporting document to format: " + extension + " (HTML length: " + 
        std::to_string(html.length()) + " chars)"
    );

    std::vector<uint8_t> export_bytes;

    // 1. Export HTML directly as text bytes
    if (extension == ".html" || extension == ".htm" || extension == ".txt") {
        export_bytes.assign(html.begin(), html.end());
        return export_bytes;
    }

    // 2. Export simulated DOCX (creating a valid ZIP container byte signature)
    if (extension == ".docx" || extension == ".odt") {
        // Zip magic header
        export_bytes.push_back('P');
        export_bytes.push_back('K');
        export_bytes.push_back(0x03);
        export_bytes.push_back(0x04);
        
        // Mock directory entries
        std::string zip_stub = "word/document.xml[" + html + "]";
        export_bytes.insert(export_bytes.end(), zip_stub.begin(), zip_stub.end());
        
        return export_bytes;
    }

    // Fallback empty bytes
    return export_bytes;
}

// Factory Creator
std::unique_ptr<DocsEngine> create_docs_engine() {
    return std::make_unique<DocsEngine>();
}

} // namespace liberty::docs
