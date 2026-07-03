add_library(liberty_formula STATIC
    src/formula_engine.cpp
)

target_include_directories(liberty_formula PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/kernel/include> # Depends on kernel
)

# Set compile flags
target_compile_features(liberty_formula PUBLIC cxx_std_20)
if(MSVC)
    target_compile_options(liberty_formula PRIVATE /W4 /WX)
else()
    target_compile_options(liberty_formula PRIVATE -Wall -Wextra -Werror)
endif()
