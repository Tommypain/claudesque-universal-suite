#include "pdf_engine.h"
#include "kernel.h"
#include <iostream>
#include <sstream>
#include <algorithm>

namespace liberty::pdf {

// Helper to count occurrences of /Type /Page tags inside PDF content
static int count_pdf_pages(const std::string& content) {
    int count = 0;
    size_t pos = 0;
    while (true) {
        pos = content.find("/Type /Page", pos);
        if (pos == std::string::npos) break;
        count++;
        pos += 11; // shift past tag
    }
    
    // Fallback search for page count catalog indicator: /Count 5
    if (count == 0) {
        size_t count_pos = content.find("/Count");
        if (count_pos != std::string::npos) {
            size_t val_pos = count_pos + 6;
            while (val_pos < content.length() && std::isspace(static_cast<unsigned char>(content[val_pos]))) {
                val_pos++;
            }
            size_t end_pos = val_pos;
            while (end_pos < content.length() && std::isdigit(static_cast<unsigned char>(content[end_pos]))) {
                end_pos++;
            }
            if (end_pos > val_pos) {
                count = std::stoi(content.substr(val_pos, end_pos - val_pos));
            }
        }
    }
    
    return count;
}

// Load PDF implementation
std::string PdfEngine::load_pdf(rust::Slice<const uint8_t> pdf_bytes) {
    std::lock_guard<std::mutex> lock(mutex_);

    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "PdfEngine: Parsing PDF file header (" + std::to_string(pdf_bytes.size()) + " bytes)"
    );

    // Verify PDF signature: starts with %PDF-
    bool is_pdf = (pdf_bytes.size() >= 5 &&
                   pdf_bytes[0] == '%' && pdf_bytes[1] == 'P' &&
                   pdf_bytes[2] == 'D' && pdf_bytes[3] == 'F' &&
                   pdf_bytes[4] == '-');
                   
    if (!is_pdf) {
        liberty::kernel::Logger::instance().log(
            liberty::kernel::LogLevel::Warning,
            "PdfEngine: Missing standard %PDF- header magic signature"
        );
        return "{\"pageCount\":1,\"size\":0,\"title\":\"Invalid PDF\",\"annotations\":[]}";
    }

    std::string content(reinterpret_cast<const char*>(pdf_bytes.data()), pdf_bytes.size());
    int page_count = count_pdf_pages(content);
    if (page_count <= 0) page_count = 1; // display at least one page

    // Extract saved annotation metadata
    std::string annotations = "[]";
    std::string token = "%LibertyPDFMetadata[";
    size_t idx = content.find(token);
    if (idx != std::string::npos) {
        size_t start = idx + token.length();
        size_t end = content.find(']', start);
        if (end != std::string::npos) {
            annotations = content.substr(start, end - start);
        }
    }

    std::stringstream ss;
    ss << "{\"pageCount\":" << page_count 
       << ",\"size\":" << pdf_bytes.size() 
       << ",\"title\":\"Liberty Document\""
       << ",\"annotations\":" << annotations << "}";
       
    return ss.str();
}

// Save PDF implementation
std::vector<uint8_t> PdfEngine::save_pdf(rust::Slice<const uint8_t> pdf_bytes, const std::string& annotations_json) {
    std::lock_guard<std::mutex> lock(mutex_);

    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "PdfEngine: Compiling and merging " + std::to_string(annotations_json.length()) + 
        " characters of annotations into PDF binary"
    );

    std::vector<uint8_t> output(pdf_bytes.begin(), pdf_bytes.end());
    
    // Append the custom metadata block at the end of the PDF bytes stream
    std::string meta_stub = "\n%LibertyPDFMetadata[" + annotations_json + "]\n%%EOF\n";
    output.insert(output.end(), meta_stub.begin(), meta_stub.end());
    
    return output;
}

// Factory Creator
std::unique_ptr<PdfEngine> create_pdf_engine() {
    return std::make_unique<PdfEngine>();
}

} // namespace liberty::pdf
