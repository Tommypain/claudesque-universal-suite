#pragma once

#include <string>
#include <vector>
#include <memory>
#include <functional>
#include <mutex>

namespace liberty::kernel {

// Command Struct representing a single undo/redo transaction
struct Command {
    std::string cmd_type;
    std::string inverse_state; // State descriptor to revert back to
};

// CommandManager handles the undo and redo command stack queues
class CommandManager {
public:
    CommandManager() = default;
    ~CommandManager() = default;

    // Push a new transaction to the undo stack. Clears the redo stack.
    void push(const std::string& cmd_type, const std::string& inverse_state);

    // Revert the last action. Returns the inverse state to apply back to the UI.
    std::string undo();

    // Replay the last undone action. Returns the forward state.
    std::string redo();

    // Stats
    size_t undo_size() const;
    size_t redo_size() const;
    void clear();

private:
    std::vector<Command> undo_stack_;
    std::vector<Command> redo_stack_;
    mutable std::mutex mutex_;
};

// Logging level designations
enum class LogLevel {
    Info,
    Warning,
    Error
};

// Logging System Callbacks Types
using LogCallback = std::function<void(LogLevel level, const std::string& message)>;

class Logger {
public:
    static Logger& instance();

    // Set callback function to dispatch logs
    void set_callback(LogCallback callback);

    // Emit logs
    void log(LogLevel level, const std::string& message);

private:
    Logger() = default;
    ~Logger() = default;

    LogCallback callback_ = nullptr;
    std::mutex mutex_;
};

// Global helper creation routines
std::unique_ptr<CommandManager> create_command_manager();

} // namespace liberty::kernel
