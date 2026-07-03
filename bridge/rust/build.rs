fn main() {
    cxx_build::bridge("src/lib.rs")
        .file("../../native/kernel/src/kernel.cpp")
        .file("../../native/text-engine/src/text_engine.cpp")
        .file("../../native/layout-engine/src/layout_engine.cpp")
        .file("../../native/formula-engine/src/formula_engine.cpp")
        .file("../../native/docs-engine/src/docs_engine.cpp")
        .include("../../native/kernel/include")
        .include("../../native/text-engine/include")
        .include("../../native/layout-engine/include")
        .include("../../native/formula-engine/include")
        .include("../../native/docs-engine/include")
        .flag_if_supported("-std=c++20")
        .flag_if_supported("/std:c++20")
        .compile("liberty-bridge");

    println!("cargo:rerun-if-changed=src/lib.rs");
    println!("cargo:rerun-if-changed=../../native/kernel/src/kernel.cpp");
    println!("cargo:rerun-if-changed=../../native/kernel/include/kernel.h");
    println!("cargo:rerun-if-changed=../../native/text-engine/src/text_engine.cpp");
    println!("cargo:rerun-if-changed=../../native/text-engine/include/text_engine.h");
    println!("cargo:rerun-if-changed=../../native/layout-engine/src/layout_engine.cpp");
    println!("cargo:rerun-if-changed=../../native/layout-engine/include/layout_engine.h");
    println!("cargo:rerun-if-changed=../../native/formula-engine/src/formula_engine.cpp");
    println!("cargo:rerun-if-changed=../../native/formula-engine/include/formula_engine.h");
    println!("cargo:rerun-if-changed=../../native/docs-engine/src/docs_engine.cpp");
    println!("cargo:rerun-if-changed=../../native/docs-engine/include/docs_engine.h");
}
