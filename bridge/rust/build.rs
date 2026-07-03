fn main() {
    cxx_build::bridge("src/lib.rs")
        .file("../../native/kernel/src/kernel.cpp")
        .include("../../native/kernel/include")
        .flag_if_supported("-std=c++20")
        .flag_if_supported("/std:c++20")
        .compile("liberty-bridge");

    println!("cargo:rerun-if-changed=src/lib.rs");
    println!("cargo:rerun-if-changed=../../native/kernel/src/kernel.cpp");
    println!("cargo:rerun-if-changed=../../native/kernel/include/kernel.h");
}
