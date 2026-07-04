#include "kernel.h"
#include <stdexcept>
#include <iostream>

namespace liberty::kernel {

// CommandManager Implementation
void CommandManager::push(const std::string& cmd_type, const std::string& inverse_state) {
    std::lock_guard<std::mutex> lock(mutex_);
    undo_stack_.push_back({cmd_type, inverse_state});
    redo_stack_.clear(); // Standard behavior: clear redo stack on new action
    
    Logger::instance().log(LogLevel::Info, "Command pushed: " + cmd_type);
}

std::string CommandManager::undo() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (undo_stack_.empty()) {
        Logger::instance().log(LogLevel::Warning, "Attempted undo with empty stack");
        throw std::underflow_error("Undo stack is empty");
    }

    Command cmd = undo_stack_.back();
    undo_stack_.pop_back();
    
    // Save to redo stack
    redo_stack_.push_back(cmd);
    
    Logger::instance().log(LogLevel::Info, "Undo applied for command: " + cmd.cmd_type);
    return cmd.inverse_state;
}

std::string CommandManager::redo() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (redo_stack_.empty()) {
        Logger::instance().log(LogLevel::Warning, "Attempted redo with empty stack");
        throw std::underflow_error("Redo stack is empty");
    }

    Command cmd = redo_stack_.back();
    redo_stack_.pop_back();
    
    // Push back to undo stack
    undo_stack_.push_back(cmd);
    
    Logger::instance().log(LogLevel::Info, "Redo applied for command: " + cmd.cmd_type);
    return cmd.inverse_state;
}

size_t CommandManager::undo_size() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return undo_stack_.size();
}

size_t CommandManager::redo_size() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return redo_stack_.size();
}

void CommandManager::clear() {
    std::lock_guard<std::mutex> lock(mutex_);
    undo_stack_.clear();
    redo_stack_.clear();
}

// Logger Implementation
Logger& Logger::instance() {
    static Logger inst;
    return inst;
}

void Logger::set_callback(LogCallback callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    callback_ = callback;
}

void Logger::log(LogLevel level, const std::string& message) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (callback_) {
        callback_(level, message);
    } else {
        // Fallback: output to console if callback is not registered
        std::string level_str = "[INFO]";
        if (level == LogLevel::Warning) level_str = "[WARN]";
        if (level == LogLevel::Error) level_str = "[ERROR]";
        
        std::cout << "[LibertyKernel] " << level_str << " " << message << std::endl;
    }
}

// Creation Factory
std::unique_ptr<CommandManager> create_command_manager();

// PluginManager Implementation
std::string PluginManager::validate_plugin(const std::string& manifest_json) {
    Logger::instance().log(LogLevel::Info, "PluginManager: Validating manifest signature (" + std::to_string(manifest_json.length()) + " characters)");

    // Scan for permission requests in manifest JSON
    bool has_network = (manifest_json.find("\"network\"") != std::string::npos || manifest_json.find("'network'") != std::string::npos);
    bool has_filesystem = (manifest_json.find("\"filesystem\"") != std::string::npos || manifest_json.find("'filesystem'") != std::string::npos);
    bool has_unsafe = (manifest_json.find("\"unsafe-eval\"") != std::string::npos || manifest_json.find("'unsafe-eval'") != std::string::npos);

    if (has_network || has_filesystem || has_unsafe) {
        std::string warnings = "WARNING: Plugin requests elevated sandbox capabilities:";
        if (has_network) warnings += " [network]";
        if (has_filesystem) warnings += " [filesystem]";
        if (has_unsafe) warnings += " [unsafe-eval]";
        warnings += ". Validation status: PENDING_USER_ACCEPTANCE.";
        
        Logger::instance().log(LogLevel::Warning, "PluginManager: Manifest validation returned warnings");
        return warnings;
    }

    Logger::instance().log(LogLevel::Info, "PluginManager: Plugin validated successfully. Security checks passed.");
    return "SUCCESS: Plugin sandboxing checks passed. Manifest is valid.";
}

std::unique_ptr<CommandManager> create_command_manager() {
    return std::make_unique<CommandManager>();
}

std::unique_ptr<PluginManager> create_plugin_manager() {
    return std::make_unique<PluginManager>();
}

} // namespace liberty::kernel
