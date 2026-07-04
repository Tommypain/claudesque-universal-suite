add_library(liberty_pdf STATIC
    src/pdf_engine.cpp
)

target_include_directories(liberty_pdf PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/kernel/include> # Depends on kernel
)

# Set compile flags
target_compile_features(liberty_pdf PUBLIC cxx_std_20)
if(MSVC)
    target_compile_options(liberty_pdf PRIVATE /W4 /WX)
else()
    target_compile_options(liberty_pdf PRIVATE -Wall -Wextra -Werror)
endif()
