fn main() {
    cxx_build::bridge("src/lib.rs")
        .file("../../native/kernel/src/kernel.cpp")
        .file("../../native/text-engine/src/text_engine.cpp")
        .include("../../native/kernel/include")
        .include("../../native/text-engine/include")
        .flag_if_supported("-std=c++20")
        .flag_if_supported("/std:c++20")
        .compile("liberty-bridge");

    println!("cargo:rerun-if-changed=src/lib.rs");
    println!("cargo:rerun-if-changed=../../native/kernel/src/kernel.cpp");
    println!("cargo:rerun-if-changed=../../native/kernel/include/kernel.h");
    println!("cargo:rerun-if-changed=../../native/text-engine/src/text_engine.cpp");
    println!("cargo:rerun-if-changed=../../native/text-engine/include/text_engine.h");
}
