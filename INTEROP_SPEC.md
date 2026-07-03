# Liberty Studio FFI Interoperability Specification

This document defines the interface boundaries, type mapping rules, memory management contracts, and exception propagation models between the frontend (React/TypeScript), the bridge (Rust/Tauri), and the core engines (C++20).

---

## 1. Threading & Runtime Model

To keep the UI responsive, all computational tasks must execute off the main thread.

```
┌─────────────────┐        ┌──────────────────┐        ┌───────────────────┐
│ React/TS Thread │ ──────▶│ Tauri IPC Thread │ ──────▶│ C++ Worker Thread │
│   (DOM / UI)    │        │  (Rust Async)    │        │ (spawn_blocking)  │
└─────────────────┘        └──────────────────┘        └───────────────────┘
```

1. **React/TS**: Invokes Tauri commands asynchronously (`invoke("command_name")`) which automatically returns a JavaScript `Promise`.
2. **Rust/Tauri**: Receives the command. If the operation performs heavy calculations (layout flow, formula evaluation, serialization), it MUST be dispatched using `tauri::async_runtime::spawn_blocking`.
3. **C++ Core**: Executes the task synchronously on the thread pool worker thread and returns the result to Rust, which then resolves the JS Promise.

---

## 2. Memory Ownership & Lifetime Rules

1. **Heap Allocation**: All native engines (e.g., `WriteEngine`, `SheetEngine`) are instantiated on the C++ heap using `std::make_unique<T>()`.
2. **Bridge Holding**: The FFI boundary represents these engines as `cxx::UniquePtr<T>` inside Rust.
3. **Tauri State Hosting**: The `UniquePtr<T>` is stored inside Tauri's app state:
   ```rust
   struct EngineState {
       write_engine: Mutex<UniquePtr<ffi::WriteEngine>>,
   }
   ```
4. **Destruction & Cleanup**: Lifetimes are tied directly to the Tauri window context. When the Tauri state is dropped or the window is closed, the Rust compiler drops the `UniquePtr`, which automatically triggers the C++ destructor to free all C++ heap allocations safely. No manual memory freeing is required.

---

## 3. FFI Type Mapping Contract

The following table dictates how types translate across the three layers:

| JavaScript / TypeScript | Rust Bridge (`cxx` / standard) | C++ Core | Transfer Cost |
| :--- | :--- | :--- | :--- |
| `string` | `String` / `&str` | `std::string` | Copies string bytes (UTF-8 validation) |
| `number` | `i32` / `f64` | `int32_t` / `double` | Zero-copy (primitive pass) |
| `boolean` | `bool` | `bool` | Zero-copy |
| `Uint8Array` | `&[u8]` | `const rust::Slice<const uint8_t>&` | Zero-copy view / raw pointer pass |
| `Object` (JSON serialized) | `String` (JSON stringified) | `std::string` (JSON parsed) | Serialization cost |
| `Opaque Pointer` | `cxx::UniquePtr<T>` | `std::unique_ptr<T>` | Zero-copy (managed address pass) |

---

## 4. Error & Exception Handling Pattern

C++ exceptions thrown across FFI boundary cause undefined behavior if not intercepted. All FFI exposed functions MUST catch exceptions and bubble them up to Rust.

### C++ Layer Exception Catching
```cpp
rust::String write_engine_apply_format(WriteEngine& engine, const std::string& cmd) {
    try {
        return rust::String(engine.apply_format(cmd));
    } catch (const std::exception& e) {
        // Automatically caught by CXX crate and converted to Rust Err
        throw std::runtime_error(e.what());
    }
}
```

### Rust Command Exception Propagation
Rust receives the exception as a `Result<T, cxx::Exception>`. It maps this to a Tauri-compatible error string:

```rust
#[tauri::command]
async fn apply_format(
    state: tauri::State<'_, EngineState>,
    cmd: String,
) -> Result<String, String> {
    let mut engine = state.write_engine.lock().unwrap();
    
    // Spawn blocking task to offload the thread
    tauri::async_runtime::spawn_blocking(move || {
        ffi::write_engine_apply_format(engine.pin_mut(), &cmd)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
```

### TypeScript Consumer Error Handling
```typescript
try {
  const resultHtml = await invoke<string>("apply_format", { cmd: "bold" });
  updateEditorState(resultHtml);
} catch (error) {
  showToast(`Formatting failed: ${error}`, "error");
}
```
