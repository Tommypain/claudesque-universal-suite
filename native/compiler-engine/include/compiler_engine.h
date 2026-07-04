#pragma once

#include <string>
#include <memory>
#include <mutex>
#include "rust/cxx.h"

namespace liberty::compiler {

// CompilerEngine parses source code input and generates Universal AST JSON tokens
class CompilerEngine {
public:
    CompilerEngine() = default;
    ~CompilerEngine() = default;

    // Parse source code strings and return AST syntax structure JSON
    std::string parse_to_ast(const std::string& code_str);

private:
    std::mutex mutex_;
};

// Creation factory for Rust FFI bindings
std::unique_ptr<CompilerEngine> create_compiler_engine();

} // namespace liberty::compiler
