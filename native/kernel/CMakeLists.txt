add_library(liberty_kernel STATIC
    src/kernel.cpp
)

target_include_directories(liberty_kernel PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

# Set compile flags
target_compile_features(liberty_kernel PUBLIC cxx_std_20)
if(MSVC)
    target_compile_options(liberty_kernel PRIVATE /W4 /WX)
else()
    target_compile_options(liberty_kernel PRIVATE -Wall -Wextra -Werror)
endif()
