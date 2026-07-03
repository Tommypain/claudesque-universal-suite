#pragma once

#include <string>
#include <vector>
#include <map>
#include <set>
#include <memory>
#include <mutex>

namespace liberty::formula {

// Represents a single grid cell in the spreadsheet engine
struct Cell {
    std::string cell_id;
    std::string raw_value;
    std::string evaluated_value;
    std::set<std::string> dependencies; // Cells this cell depends on (e.g. A1, A2)
    std::set<std::string> dependents;   // Cells depending on this cell
};

// FormulaEngine manages cell evaluations, math parser runs, and topological sorts
class FormulaEngine {
public:
    FormulaEngine() = default;
    ~FormulaEngine() = default;

    // Set cell raw expression value. Builds and updates dependency graph links.
    void set_cell_value(const std::string& cell_id, const std::string& raw_value);

    // Evaluate cell dependency graphs. Returns a JSON-serialized string of cell values.
    std::string evaluate_all();

    // Check for circular dependency loops
    bool has_circular_dependencies() const;

    // Clear sheet cells
    void clear();

private:
    std::map<std::string, Cell> cells_;
    mutable std::mutex mutex_;

    // Helper: Parse dependencies from raw formula expression
    std::set<std::string> parse_dependencies(const std::string& raw_value);

    // Helper: Evaluate a single cell's math expression
    std::string evaluate_cell(const std::string& cell_id);
};

// Creation factory for Rust FFI bindings
std::unique_ptr<FormulaEngine> create_formula_engine();

} // namespace liberty::formula
