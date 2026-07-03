add_library(liberty_layout STATIC
    src/layout_engine.cpp
)

target_include_directories(liberty_layout PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/kernel/include>      # Depends on kernel
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/text-engine/include>  # Depends on text-engine
)

# Set compile flags
target_compile_features(liberty_layout PUBLIC cxx_std_20)
if(MSVC)
    target_compile_options(liberty_layout PRIVATE /W4 /WX)
else()
    target_compile_options(liberty_layout PRIVATE -Wall -Wextra -Werror)
endif()
