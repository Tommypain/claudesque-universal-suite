#include "formula_engine.h"
#include "kernel.h"
#include <sstream>
#include <iostream>
#include <queue>
#include <algorithm>
#include <cctype>
#include <stdexcept>

namespace liberty::formula {

// Set cell value and update dependency bindings
void FormulaEngine::set_cell_value(const std::string& cell_id, const std::string& raw_value) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // 1. Get or create cell
    Cell& cell = cells_[cell_id];
    cell.cell_id = cell_id;
    cell.raw_value = raw_value;
    
    // 2. Clear old reverse links from old dependencies
    for (const auto& dep : cell.dependencies) {
        if (cells_.find(dep) != cells_.end()) {
            cells_[dep].dependents.erase(cell_id);
        }
    }
    
    // 3. Parse and register new dependencies
    cell.dependencies = parse_dependencies(raw_value);
    for (const auto& dep : cell.dependencies) {
        cells_[dep].cell_id = dep; // Ensure dependency cell exists in registry
        cells_[dep].dependents.insert(cell_id);
    }

    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "Cell value set: " + cell_id + " = " + raw_value + " (" + 
        std::to_string(cell.dependencies.size()) + " dependencies registered)"
    );
}

// Simple cell dependency scanner
std::set<std::string> FormulaEngine::parse_dependencies(const std::string& raw_value) {
    std::set<std::string> deps;
    if (raw_value.empty() || raw_value[0] != '=') {
        return deps; // Non-formulas have 0 dependencies
    }

    // Scans for cell coordinates (e.g. uppercase letter + digits like A1, B22, Z100)
    std::string current_token = "";
    for (size_t i = 1; i < raw_value.length(); ++i) {
        char c = raw_value[i];
        if (std::isalnum(c)) {
            current_token += c;
        } else {
            // Check if current token represents a cell coordinate
            if (!current_token.empty() && std::isalpha(current_token[0])) {
                // Confirm there are letters followed by digits
                size_t letter_count = 0;
                while (letter_count < current_token.length() && std::isalpha(current_token[letter_count])) {
                    letter_count++;
                }
                if (letter_count > 0 && letter_count < current_token.length()) {
                    deps.insert(current_token);
                }
            }
            current_token = "";
        }
    }

    // Capture trailing token
    if (!current_token.empty() && std::isalpha(current_token[0])) {
        size_t letter_count = 0;
        while (letter_count < current_token.length() && std::isalpha(current_token[letter_count])) {
            letter_count++;
        }
        if (letter_count > 0 && letter_count < current_token.length()) {
            deps.insert(current_token);
        }
    }

    return deps;
}

// Helper: Evaluator for cell expressions
std::string FormulaEngine::evaluate_cell(const std::string& cell_id) {
    Cell& cell = cells_[cell_id];
    if (cell.raw_value.empty()) {
        return "0";
    }
    
    // Constant values
    if (cell.raw_value[0] != '=') {
        return cell.raw_value;
    }

    // Parse simple formula: e.g. "=SUM(A1:A5)" or "=A1+A2"
    std::string formula = cell.raw_value.substr(1);
    
    // Case 1: SUM range aggregator (e.g., SUM(A1:A2))
    if (formula.rfind("SUM(", 0) == 0 && formula.back() == ')') {
        // Simple range evaluator stub
        double sum = 0.0;
        for (const auto& dep : cell.dependencies) {
            std::string dep_val = cells_[dep].evaluated_value;
            try {
                if (!dep_val.empty()) {
                    sum += std::stod(dep_val);
                }
            } catch (...) {}
        }
        return std::to_string(sum);
    }
    
    // Case 2: AVERAGE range aggregator
    if (formula.rfind("AVERAGE(", 0) == 0 && formula.back() == ')') {
        double sum = 0.0;
        size_t count = 0;
        for (const auto& dep : cell.dependencies) {
            std::string dep_val = cells_[dep].evaluated_value;
            try {
                if (!dep_val.empty()) {
                    sum += std::stod(dep_val);
                    count++;
                }
            } catch (...) {}
        }
        double avg = (count > 0) ? (sum / count) : 0.0;
        return std::to_string(avg);
    }

    // Case 3: Simple addition/concatenation FFI stub
    double sum = 0.0;
    bool is_numeric = false;
    for (const auto& dep : cell.dependencies) {
        std::string dep_val = cells_[dep].evaluated_value;
        try {
            if (!dep_val.empty()) {
                sum += std::stod(dep_val);
                is_numeric = true;
            }
        } catch (...) {}
    }
    if (is_numeric) {
        return std::to_string(sum);
    }

    return "0";
}

// Evaluate spreadsheet via Topological Sort (Kahn's Algorithm)
std::string FormulaEngine::evaluate_all() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // 1. Calculate in-degrees for all cells
    std::map<std::string, size_t> in_degree;
    std::queue<std::string> zero_in_degree;

    for (const auto& [id, cell] : cells_) {
        in_degree[id] = cell.dependencies.size();
        if (cell.dependencies.empty()) {
            zero_in_degree.push(id);
        }
    }

    std::vector<std::string> eval_order;
    
    // 2. Process topological sort
    while (!zero_in_degree.empty()) {
        std::string curr = zero_in_degree.front();
        zero_in_degree.pop();
        eval_order.push_back(curr);

        for (const auto& dep_id : cells_[curr].dependents) {
            in_degree[dep_id]--;
            if (in_degree[dep_id] == 0) {
                zero_in_degree.push(dep_id);
            }
        }
    }

    // 3. Check for circular loops
    if (eval_order.size() < cells_.size()) {
        liberty::kernel::Logger::instance().log(
            liberty::kernel::LogLevel::Error,
            "Circular dependencies detected in sheet evaluation!"
        );
        throw std::runtime_error("Circular dependency detected");
    }

    // 4. Evaluate cells in topological order
    for (const auto& id : eval_order) {
        cells_[id].evaluated_value = evaluate_cell(id);
    }

    // 5. Build JSON-serialized string to return to Rust/React
    std::stringstream json;
    json << "{";
    bool first = true;
    for (const auto& [id, cell] : cells_) {
        if (!first) json << ",";
        json << "\"" << id << "\":\"" << cell.evaluated_value << "\"";
        first = false;
    }
    json << "}";

    liberty::kernel::Logger::instance().log(
        liberty::kernel::LogLevel::Info,
        "Sheet evaluated. Evaluated cell JSON length: " + std::to_string(json.str().length())
    );

    return json.str();
}

bool FormulaEngine::has_circular_dependencies() const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::map<std::string, size_t> in_degree;
    std::queue<std::string> zero_in_degree;

    for (const auto& [id, cell] : cells_) {
        in_degree[id] = cell.dependencies.size();
        if (cell.dependencies.empty()) {
            zero_in_degree.push(id);
        }
    }

    size_t count = 0;
    while (!zero_in_degree.empty()) {
        std::string curr = zero_in_degree.front();
        zero_in_degree.pop();
        count++;

        for (const auto& dep_id : cells_.at(curr).dependents) {
            in_degree[dep_id]--;
            if (in_degree[dep_id] == 0) {
                zero_in_degree.push(dep_id);
            }
        }
    }

    return count < cells_.size();
}

void FormulaEngine::clear() {
    std::lock_guard<std::mutex> lock(mutex_);
    cells_.clear();
}

// Factory Creator
std::unique_ptr<FormulaEngine> create_formula_engine() {
    return std::make_unique<FormulaEngine>();
}

} // namespace liberty::formula
