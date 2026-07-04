#include "compiler_engine.h"
#include "kernel.h"
#include <iostream>
#include <sstream>
#include <vector>
#include <cctype>

namespace liberty::compiler {

struct Token {
    std::string type;
    std::string value;
};

// Simple scanner that splits code into basic token strings
static std::vector<Token> tokenize(const std::string& code) {
    std::vector<Token> tokens;
    size_t i = 0;
    while (i < code.length()) {
        char ch = code[i];
        if (std::isspace(static_cast<unsigned char>(ch))) {
            i++;
            continue;
        }
        
        // Single character symbols
        if (ch == '{' || ch == '}' || ch == '(' || ch == ')' || ch == ';' || ch == '=') {
            tokens.push_back({ "Symbol", std::string(1, ch) });
            i++;
            continue;
        }

        // Keywords or Identifiers
        if (std::isalpha(static_cast<unsigned char>(ch)) || ch == '_') {
            size_t start = i;
            while (i < code.length() && (std::isalnum(static_cast<unsigned char>(code[i])) || code[i] == '_')) {
                i++;
            }
            std::string word = code.substr(start, i - start);
            if (word == "function" || word == "return" || word == "const" || word == "let" || word == "var") {
                tokens.push_back({ "Keyword", word });
            } else {
                tokens.push_back({ "Identifier", word });
            }
            continue;
        }

        // Numeric values
        if (std::isdigit(static_cast<unsigned char>(ch))) {
            size_t start = i;
            while (i < code.length() && std::isdigit(static_cast<unsigned char>(code[i]))) {
                i++;
            }
            tokens.push_back({ "Number", code.substr(start, i - start) });
            continue;
        }

        // String literals
        if (ch == '"' || ch == '\'') {
            char quote = ch;
            size_t start = ++i;
            while (i < code.length() && code[i] != quote) {
                i++;
            }
            tokens.push_back({ "String", code.substr(start, i - start) });
            i++;
            continue;
        }

        // Unhandled punctuation or operator
        tokens.push_back({ "Operator", std::string(1, ch) });
        i++;
    }
    return tokens;
}

// AST parser and JSON compiler
std::string CompilerEngine::parse_to_ast(const std::string& code_str) {
    std::lock_guard<std::mutex> lock(mutex_);

    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "CompilerEngine: Parsing code buffer (" + std::to_string(code_str.length()) + " characters)"
    );

    auto tokens = tokenize(code_str);
    
    std::stringstream ss;
    ss << "{\n  \"type\": \"Program\",\n  \"body\": [\n";
    
    for (size_t idx = 0; idx < tokens.size(); idx++) {
        const auto& tok = tokens[idx];
        ss << "    {\n"
           << "      \"type\": \"ASTNode\",\n"
           << "      \"tokenType\": \"" << tok.type << "\",\n"
           << "      \"value\": \"" << tok.value << "\"\n"
           << "    }";
        if (idx + 1 < tokens.size()) {
            ss << ",";
        }
        ss << "\n";
    }
    
    ss << "  ]\n}";
    return ss.str();
}

// Factory Creator
std::unique_ptr<CompilerEngine> create_compiler_engine() {
    return std::make_unique<CompilerEngine>();
}

} // namespace liberty::compiler
