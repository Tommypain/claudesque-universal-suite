cmake_minimum_required(VERSION 3.20)
project(LibertyCore LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Export compile commands for language servers
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Include the kernel module
add_subdirectory(kernel)
