cmake_minimum_required(VERSION 3.20)
project(LibertyCore LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Export compile commands for language servers
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Include modules
add_subdirectory(kernel)
add_subdirectory(text-engine)
add_subdirectory(layout-engine)
add_subdirectory(formula-engine)
add_subdirectory(docs-engine)
add_subdirectory(sheets-engine)
add_subdirectory(impress-engine)
add_subdirectory(design-engine)
add_subdirectory(voice-engine)
add_subdirectory(pdf-engine)





