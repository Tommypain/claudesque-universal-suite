# Core Engine Architecture Specification

This document defines the authoritative architecture, FFI boundaries, and data flow patterns for the Liberty Studio native core engine. It serves as the single source of truth for connecting the TypeScript/React frontend (Tauri) with the C++20 computation engines via a Rust FFI bridge.

---

## 1. Module Boundary Definitions

The Liberty Studio codebase is split into five native modules. Below are the design contracts defining C++ vs. TS/React responsibilities and their public API boundaries.

### 1.1 Liberty Write (`liberty-write`)
- **C++ Responsibilities**: Document parser/exporter (DOCX, ODT, RTF), HTML-to-AST conversion, paragraph layout calculations, selection formatting state calculation.
- **TS/React Responsibilities**: Rendering of document pages to the DOM, handling selections, input event listeners, caret positioning, editing overlay UI.

#### Public API Surface:
* `create_write_engine`
  - **Signature**: `std::unique_ptr<WriteEngine> create_write_engine()`
  - **Parameters**: None
  - **Return Type**: `std::unique_ptr<WriteEngine>` (opaque pointer)
  - **Error/Exception**: Does not throw.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`
* `write_engine_load_file`
  - **Signature**: `std::string write_engine_load_file(WriteEngine& engine, const std::vector<uint8_t>& file_bytes, const std::string& extension)`
  - **Parameters**: `WriteEngine&`, binary file bytes, file extension (e.g. `".docx"`)
  - **Return Type**: `std::string` (HTML representation of the document AST)
  - **Error/Exception**: Throws `std::runtime_error` on parsing failure.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`
* `write_engine_apply_format`
  - **Signature**: `std::string write_engine_apply_format(WriteEngine& engine, const std::string& current_html, const std::string& command, const std::string& value, int32_t selection_start, int32_t selection_end)`
  - **Parameters**: `WriteEngine&`, current document HTML content, format command (e.g., `"bold"`), format value, start index, end index.
  - **Return Type**: `std::string` (modified HTML string)
  - **Error/Exception**: Throws `std::invalid_argument` on invalid command.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`

---

### 1.2 Liberty Sheet (`liberty-sheet`)
- **C++ Responsibilities**: Formula compilation and evaluation (AST creation), cell dependency graph management (topological sorting), cell value formatting.
- **TS/React Responsibilities**: Rendering the spreadsheet grid canvas/table, cell focus management, edit mode overlays, row/column size handlers.

#### Public API Surface:
* `create_sheet_engine`
  - **Signature**: `std::unique_ptr<SheetEngine> create_sheet_engine()`
  - **Parameters**: None
  - **Return Type**: `std::unique_ptr<SheetEngine>`
  - **Error/Exception**: Does not throw.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`
* `sheet_engine_set_cell_value`
  - **Signature**: `void sheet_engine_set_cell_value(SheetEngine& engine, const std::string& cell_id, const std::string& raw_value)`
  - **Parameters**: `SheetEngine&`, cell ID (e.g., `"A1"`), raw value/formula (e.g., `"=SUM(B1:B10)"`)
  - **Return Type**: `void`
  - **Error/Exception**: Throws `std::invalid_argument` on malformed cell ID.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`
* `sheet_engine_evaluate_all`
  - **Signature**: `std::string sheet_engine_evaluate_all(SheetEngine& engine)`
  - **Parameters**: `SheetEngine&`
  - **Return Type**: `std::string` (JSON string mapping cell IDs to their evaluated values and dirty states)
  - **Error/Exception**: Throws `std::runtime_error` on circular dependencies.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`

---

### 1.3 Liberty Impress (`liberty-impress`)
- **C++ Responsibilities**: PPTX/ODP slide serializations, transition calculations, slide master templates layout generation, vector shape paths.
- **TS/React Responsibilities**: Slide editing workspace, drag-and-drop shape handlers, animations timeline UI, presentation mode browser viewports.

#### Public API Surface:
* `create_impress_engine`
  - **Signature**: `std::unique_ptr<ImpressEngine> create_impress_engine()`
  - **Parameters**: None
  - **Return Type**: `std::unique_ptr<ImpressEngine>`
  - **Error/Exception**: Does not throw.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`
* `impress_engine_load_presentation`
  - **Signature**: `std::string impress_engine_load_presentation(ImpressEngine& engine, const std::vector<uint8_t>& file_bytes)`
  - **Parameters**: `ImpressEngine&`, PPTX binary bytes
  - **Return Type**: `std::string` (JSON serialization of slides model tree)
  - **Error/Exception**: Throws `std::runtime_error` on parsing error.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`

---

### 1.4 Liberty PDF Edit (`liberty-pdf-edit`)
- **C++ Responsibilities**: PDF page rendering metrics, PDF annotations parsing/merging, digital signature validation, page rotation.
- **TS/React Responsibilities**: Rendering annotation markup layers, PDF canvas container scroll bounds, pen tool coordinates tracking.

#### Public API Surface:
* `create_pdf_engine`
  - **Signature**: `std::unique_ptr<PdfEngine> create_pdf_engine()`
  - **Parameters**: None
  - **Return Type**: `std::unique_ptr<PdfEngine>`
  - **Error/Exception**: Does not throw.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`
* `pdf_engine_rotate_page`
  - **Signature**: `std::vector<uint8_t> pdf_engine_rotate_page(PdfEngine& engine, const std::vector<uint8_t>& pdf_bytes, int32_t page_index, int32_t degrees)`
  - **Parameters**: `PdfEngine&`, original PDF bytes, page index, rotation degrees (e.g. `90`, `180`)
  - **Return Type**: `std::vector<uint8_t>` (modified PDF document bytes)
  - **Error/Exception**: Throws `std::out_of_range` if page index is invalid.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`

---

### 1.5 Shared Kernel (`shared-kernel`)
- **C++ Responsibilities**: Shared memory allocator, global undo/redo command stack manager, clipboard formats serializer.
- **TS/React Responsibilities**: Workspace toast notifications, local storage syncing, top titlebar filename rendering.

#### Public API Surface:
* `create_command_manager`
  - **Signature**: `std::unique_ptr<CommandManager> create_command_manager()`
  - **Parameters**: None
  - **Return Type**: `std::unique_ptr<CommandManager>`
  - **Error/Exception**: Does not throw.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`
* `command_manager_push`
  - **Signature**: `void command_manager_push(CommandManager& manager, const std::string& cmd_type, const std::string& inverse_state)`
  - **Parameters**: `CommandManager&`, command descriptor string, state string to revert to.
  - **Return Type**: `void`
  - **Error/Exception**: Does not throw.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`
* `command_manager_undo`
  - **Signature**: `std::string command_manager_undo(CommandManager& manager)`
  - **Parameters**: `CommandManager&`
  - **Return Type**: `std::string` (state descriptor to apply back to the UI)
  - **Error/Exception**: Throws `std::underflow_error` if undo stack is empty.
  - **Verification**: `[ ] BUILD_VERIFIED` / `[ ] MANUAL_VERIFIED`

---

## 2. Rust FFI Bridge Design (via `cxx` crate)

The integration relies on the `cxx` crate to build safe, low-overhead bindings between Rust and C++.

### 2.1 CXX Bridge Layout Example (`src-tauri/src/ffi/write.rs`)

```rust
#[cxx::bridge(namespace = "liberty::write")]
pub mod ffi {
    unsafe extern "C++" {
        include!("core-engine/liberty-write/include/write_engine.h");

        type WriteEngine;

        fn create_write_engine() -> UniquePtr<WriteEngine>;
        
        fn write_engine_load_file(
            engine: Pin<&mut WriteEngine>,
            file_bytes: &CxxString,
            extension: &CxxString,
        ) -> Result<String>;

        fn write_engine_apply_format(
            engine: Pin<&mut WriteEngine>,
            current_html: &CxxString,
            command: &CxxString,
            value: &CxxString,
            selection_start: i32,
            selection_end: i32,
        ) -> Result<String>;
    }
}
```

### 2.2 Type Mapping Table

| C++ Type | Rust CXX Representation | TS/React Type | Description |
|---|---|---|---|
| `std::unique_ptr<T>` | `cxx::UniquePtr<T>` | Opaque Pointer | Opaque wrapper passed back to TS as memory address |
| `std::string` | `String` / `&str` | `string` | UTF-8 encoded string (auto-copied/validated) |
| `const std::vector<uint8_t>&` | `&CxxString` / `&[u8]` | `Uint8Array` | Binary buffers passed via byte slices |
| `int32_t` | `i32` | `number` | 32-bit signed integers |
| `rust::String` (in signatures) | `String` | `string` | CXX-defined safe Rust string |

### 2.3 Memory Ownership Rules
- **Instantiation**: C++ engines are instantiated as `std::unique_ptr<T>` on the C++ heap.
- **Tauri Hosting**: The Rust layer holds the `cxx::UniquePtr<T>` inside a Tauri-managed state manager (`tauri::State`). This ties the C++ engine's lifetime to the running Tauri window instance.
- **Cleanup**: When the Tauri state is cleared or the window drops, the Rust `cxx::UniquePtr` destructor automatically runs, triggering the C++ destructor to safely free the engine allocations. No raw `free()` or `delete` is called manually in Rust.

### 2.4 Error Propagation Pattern
All FFI C++ functions returning results are wrapped in a C++ `try-catch` block that converts standard C++ exceptions into `rust::behavior` errors.

1. **C++ Layer**:
   ```cpp
   // C++ wrapper function implementation
   rust::String write_engine_apply_format(
       WriteEngine& engine,
       const std::string& current_html,
       const std::string& command,
       const std::string& value,
       int32_t start,
       int32_t end
   ) {
       try {
           return rust::String(engine.apply_format(current_html, command, value, start, end));
       } catch (const std::exception& e) {
           throw std::runtime_error(e.what());
       }
   }
   ```
2. **Rust Bridge Layer**: The `Result<T>` in `cxx` intercepts C++ exceptions thrown as `std::exception` and converts them to Rust `Result<T, cxx::Exception>`.
3. **Tauri Command Layer**:
   ```rust
   #[tauri::command]
   pub async fn tauri_apply_format(
       engine: tauri::State<'_, cxx::UniquePtr<ffi::WriteEngine>>,
       html: String,
       cmd: String,
       val: String,
       start: i32,
       end: i32,
   ) -> Result<String, String> {
       // Pin and call the engine mutable reference
       let mut engine_ref = engine.inner().clone();
       let cxx_html = cxx::let_cxx_string!(h = html);
       let cxx_cmd = cxx::let_cxx_string!(c = cmd);
       let cxx_val = cxx::let_cxx_string!(v = val);
       
       ffi::write_engine_apply_format(engine_ref.as_mut(), &cxx_html, &cxx_cmd, &cxx_val, start, end)
           .map_err(|e| e.to_string())
   }
   ```
4. **JS/React Layer**: The promise rejects with the FFI error message, which is caught in a `.catch()` block and presented to the user using the toast system.

---

## 3. Ribbon-to-Engine Call Pattern

The path of a user interaction must strictly follow the flow shown below. Visual buttons must **never** bypass this dispatch sequence.

### 3.1 Flow Diagram
```
[User Click] 
     │
     ▼
[RibbonButton onClick]
     │
     ▼
[ActionRegistry Dispatcher]
     │
     ▼
[Tauri invoke()]
     │
     ▼
[Tauri Command Handler (Rust)]
     │
     ▼
[cxx::bridge (FFI)]
     │
     ▼
[C++ Engine Computation]
     │
     ▼
[Return state/update payload]
```

### 3.2 Worked Examples

#### Example A: Liberty Write `applyBold`

##### 1. TypeScript Call Site & ActionRegistry:
```typescript
// src/store/actionRegistry.ts
import { invoke } from "@tauri-apps/api/core";
import { useDocumentStore } from "./useDocumentStore";

export const ActionRegistry = {
  applyBold: async (selectionStart: number, selectionEnd: number) => {
    const { writeHtml, setWriteHtml } = useDocumentStore.getState();
    try {
      const updatedHtml = await invoke<string>("tauri_apply_format", {
        html: writeHtml,
        cmd: "bold",
        val: "",
        start: selectionStart,
        end: selectionEnd
      });
      setWriteHtml(updatedHtml);
    } catch (error) {
      console.error("Format execution failed:", error);
    }
  }
};
```
```tsx
// TSX layout button call remains unchanged
<RibbonButton 
  icon={<b>B</b>} 
  onClick={() => ActionRegistry.applyBold(12, 20)} 
  title="Bold" 
  size="small" 
/>
```

##### 2. Tauri Command Signature (Rust):
```rust
#[tauri::command]
pub async fn tauri_apply_format(
    engine: tauri::State<'_, Arc<Mutex<cxx::UniquePtr<ffi::WriteEngine>>>>,
    html: String,
    cmd: String,
    val: String,
    start: i32,
    end: i32,
) -> Result<String, String> {
    let mut engine_guard = engine.lock().unwrap();
    let mut engine_ref = engine_guard.as_mut().unwrap();
    
    // cxx conversion helpers
    let cxx_html = cxx::let_cxx_string!(h = html);
    let cxx_cmd = cxx::let_cxx_string!(c = cmd);
    let cxx_val = cxx::let_cxx_string!(v = val);
    
    ffi::write_engine_apply_format(engine_ref.as_mut(), &cxx_html, &cxx_cmd, &cxx_val, start, end)
        .map_err(|e| e.to_string())
}
```

##### 3. Rust Bridge Function:
Defined in Section 2.1 inside `ffi::write_engine_apply_format`.

##### 4. C++ Function Signature:
```cpp
// core-engine/liberty-write/include/write_engine.h
#pragma once
#include <string>

namespace liberty::write {
    class WriteEngine {
    public:
        WriteEngine() = default;
        std::string apply_format(
            const std::string& html, 
            const std::string& command, 
            const std::string& value, 
            int32_t start, 
            int32_t end
        );
    };
}
```

---

#### Example B: Liberty Sheet `calculateFormula`

##### 1. TypeScript Call Site & ActionRegistry:
```typescript
// src/store/actionRegistry.ts
export const ActionRegistry = {
  calculateFormula: async (cellId: string, formula: string) => {
    const { setSheetCell } = useDocumentStore.getState();
    try {
      await invoke("tauri_set_cell_value", { cellId, formula });
      const evaluatedData = await invoke<string>("tauri_evaluate_all");
      const cellMap = JSON.parse(evaluatedData);
      useDocumentStore.setState({ sheet: cellMap, dirty: true });
    } catch (error) {
      console.error("Formula evaluation failed:", error);
    }
  }
};
```

##### 2. Tauri Command Signature (Rust):
```rust
#[tauri::command]
pub async fn tauri_set_cell_value(
    engine: tauri::State<'_, Arc<Mutex<cxx::UniquePtr<ffi::SheetEngine>>>>,
    cell_id: String,
    formula: String,
) -> Result<(), String> {
    let mut guard = engine.lock().unwrap();
    let mut engine_ref = guard.as_mut().unwrap();
    let c_cell = cxx::let_cxx_string!(c = cell_id);
    let c_form = cxx::let_cxx_string!(f = formula);
    ffi::sheet_engine_set_cell_value(engine_ref.as_mut(), &c_cell, &c_form)
        .map_err(|e| e.to_string())
}
```

##### 3. Rust Bridge Function:
```rust
// bridge entry in ffi module
fn sheet_engine_set_cell_value(engine: Pin<&mut SheetEngine>, cell_id: &CxxString, raw_value: &CxxString) -> Result<()>;
```

##### 4. C++ Function Signature:
```cpp
// core-engine/liberty-sheet/include/sheet_engine.h
#pragma once
#include <string>

namespace liberty::sheet {
    class SheetEngine {
    public:
        void set_cell_value(const std::string& cell_id, const std::string& raw_value);
        std::string evaluate_all();
    };
}
```

---

#### Example C: Liberty Impress `renderSlideTransition`

##### 1. TypeScript Call Site & ActionRegistry:
```typescript
// src/store/actionRegistry.ts
export const ActionRegistry = {
  renderSlideTransition: async (slideId: string, transitionType: string) => {
    try {
      const renderResult = await invoke<string>("tauri_render_transition", { slideId, transitionType });
      // Update UI presentation state with rendered target frame sequence
      console.log("Rendered transition frames payload received:", renderResult);
    } catch (error) {
      console.error("Transition rendering failed:", error);
    }
  }
};
```

##### 2. Tauri Command Signature (Rust):
```rust
#[tauri::command]
pub async fn tauri_render_transition(
    engine: tauri::State<'_, Arc<Mutex<cxx::UniquePtr<ffi::ImpressEngine>>>>,
    slide_id: String,
    transition_type: String,
) -> Result<String, String> {
    let mut guard = engine.lock().unwrap();
    let mut engine_ref = guard.as_mut().unwrap();
    let c_slide = cxx::let_cxx_string!(s = slide_id);
    let c_trans = cxx::let_cxx_string!(t = transition_type);
    ffi::impress_engine_render_transition(engine_ref.as_mut(), &c_slide, &c_trans)
        .map_err(|e| e.to_string())
}
```

##### 3. Rust Bridge Function:
```rust
fn impress_engine_render_transition(engine: Pin<&mut ImpressEngine>, slide_id: &CxxString, transition_type: &CxxString) -> Result<String>;
```

##### 4. C++ Function Signature:
```cpp
// core-engine/liberty-impress/include/impress_engine.h
#pragma once
#include <string>

namespace liberty::impress {
    class ImpressEngine {
    public:
        std::string render_transition(const std::string& slide_id, const std::string& transition_type);
    };
}
```

---

#### Example D: Liberty PDF Edit `rotatePage`

##### 1. TypeScript Call Site & ActionRegistry:
```typescript
// src/store/actionRegistry.ts
export const ActionRegistry = {
  rotatePage: async (pageIndex: number, degrees: number) => {
    const { pdfBuffer, setPdf, pdfName } = useDocumentStore.getState();
    if (!pdfBuffer) return;
    try {
      const rotatedBuffer = await invoke<number[]>("tauri_rotate_page", {
        pdfBytes: Array.from(new Uint8Array(pdfBuffer)),
        pageIndex,
        degrees
      });
      setPdf(new Uint8Array(rotatedBuffer).buffer, pdfName);
    } catch (error) {
      console.error("PDF rotation failed:", error);
    }
  }
};
```

##### 2. Tauri Command Signature (Rust):
```rust
#[tauri::command]
pub async fn tauri_rotate_page(
    engine: tauri::State<'_, Arc<Mutex<cxx::UniquePtr<ffi::PdfEngine>>>>,
    pdf_bytes: Vec<u8>,
    page_index: i32,
    degrees: i32,
) -> Result<Vec<u8>, String> {
    let mut guard = engine.lock().unwrap();
    let mut engine_ref = guard.as_mut().unwrap();
    ffi::pdf_engine_rotate_page(engine_ref.as_mut(), &pdf_bytes, page_index, degrees)
        .map_err(|e| e.to_string())
}
```

##### 3. Rust Bridge Function:
```rust
fn pdf_engine_rotate_page(engine: Pin<&mut PdfEngine>, pdf_bytes: &[u8], page_index: i32, degrees: i32) -> Result<Vec<u8>>;
```

##### 4. C++ Function Signature:
```cpp
// core-engine/liberty-pdf-edit/include/pdf_engine.h
#pragma once
#include <vector>
#include <cstdint>

namespace liberty::pdf {
    class PdfEngine {
    public:
        std::vector<uint8_t> rotate_page(const std::vector<uint8_t>& pdf_bytes, int32_t page_index, int32_t degrees);
    };
}
```

---

## 4. Async & Long-Running Operations

Computationally heavy operations (e.g. rendering large documents, layout calculations, formula evaluations across large sheets) must not block the main OS thread.

### 4.1 Async Thread Pooling

All long-running tasks must run on the thread pool inside C++ or wrapped in Rust's asynchronous runtime (Tokio blocking thread pool).

```rust
// Rust Thread Pool Task Wrapper
#[tauri::command]
pub async fn tauri_async_load_large_document(
    engine: tauri::State<'_, Arc<Mutex<cxx::UniquePtr<ffi::WriteEngine>>>>,
    bytes: Vec<u8>
) -> Result<String, String> {
    // Spawn task onto Tokio threadpool
    tokio::task::spawn_blocking(move || {
        let mut guard = engine.lock().unwrap();
        let mut engine_ref = guard.as_mut().unwrap();
        let cxx_bytes = cxx::let_cxx_string!(b = bytes);
        let cxx_ext = cxx::let_cxx_string!(e = ".docx");
        
        ffi::write_engine_load_file(engine_ref.as_mut(), &cxx_bytes, &cxx_ext)
            .map_err(|e| e.to_string())
    }).await.map_err(|e| e.to_string())?
}
```

### 4.2 Progress Reporting

Tauri's event system acts as the stream channel. During long operations, C++ issues callbacks that Rust listens for and fires down to the JS runtime:

```cpp
// C++ Page Processing Callback Definition
typedef void (*ProgressCallback)(int32_t current, int32_t total);

void process_large_pdf(const std::vector<uint8_t>& bytes, ProgressCallback callback);
```

In the Rust bridge, we map this callback to fire a Tauri event:

```rust
// Rust event dispatcher
#[tauri::command]
pub async fn tauri_process_pdf_with_progress(
    window: tauri::Window,
    bytes: Vec<u8>
) -> Result<(), String> {
    let window_clone = window.clone();
    
    // FFI wrapper closure mapping C++ progress callback
    let native_callback = move |current: i32, total: i32| {
        let _ = window_clone.emit("pdf_progress", ProgressPayload { current, total });
    };
    
    // Execute block on native thread
    tokio::task::spawn_blocking(move || {
        unsafe {
            ffi::pdf_engine_process_with_callback(&bytes, native_callback);
        }
    }).await.map_err(|e| e.to_string())
}
```

### 4.3 Cancellation Pattern

Cancellation uses a shared atomic cancellation flag passed down to C++ tasks. The flag is monitored periodically inside long-running loops.

```cpp
// C++ Loop cancellation check
class CancellableTask {
    std::atomic<bool> cancelled_{false};
public:
    void cancel() { cancelled_.store(true); }
    void run() {
        for(size_t i = 0; i < iterations; ++i) {
            if (cancelled_.load()) {
                throw std::runtime_error("Task cancelled by host application");
            }
            // perform work unit
        }
    }
};
```

In Rust, Tauri tracks the active cancellation keys inside a concurrent hashmap:

```rust
// Rust state management for cancellation
pub struct CancellationStore(Mutex<HashMap<String, Arc<AtomicBool>>>);

#[tauri::command]
pub fn cancel_task(store: tauri::State<'_, CancellationStore>, task_id: String) {
    let map = store.0.lock().unwrap();
    if let Some(flag) = map.get(&task_id) {
        flag.store(true, Ordering::SeqCst);
    }
}
```

---

## 5. Shared State & Undo/Redo

To prevent redundancy across the four application modules, all generic state operations are abstracted into `shared-kernel`.

### 5.1 Shared Kernel Design

```
                     +---------------------------+
                     |       shared-kernel       |
                     +-------------+-------------+
                                   |
           +-----------------------+-----------------------+
           |                       |                       |
+----------v----------+ +----------v----------+ +----------v----------+
|  CommandManager     | |  MemoryAllocator   | |  ClipboardRegistry  |
|  (Undo/Redo Stack)  | |  (Arena Allocator) | |  (Custom formats)   |
+---------------------+ +---------------------+ +---------------------+
```

### 5.2 Undo/Redo Ownership (Why it lives in C++)

1. **Why C++?** The document AST, formula cell graphs, and slide trees reside entirely inside the C++ engine memory space. Moving full document states back and forth across FFI boundaries on every action to serialize inside React or Rust is slow and causes performance bottlenecks.
2. **How it works**: The C++ engines push command delta objects (e.g. `TextDelta`, `CellDelta`) onto a centralized `CommandManager` stack inside C++.
3. **Rust Role**: Rust merely exposes Tauri commands (`tauri_undo` and `tauri_redo`) to act as triggers.
4. **JS Role**: The JS layer sends the trigger and receives the final evaluated HTML state to display, ensuring zero serialization overhead.

---

## 6. Build & Dev Workflow Impact

### 6.1 Dev Execution Integration

During development, `cmake` builds the native libraries which are then linked by `cargo`. Tauri's build pipeline integrates these tasks before spawning the frontend dev server.

```
       [npm run dev]
             │
             ▼
      [tauri dev command]
             │
             ▼
     [CMake builds static libs]
             │
             ▼
  [Cargo compiles Rust bridge]
             │
             ▼
[Tauri app runs with native FFI]
```

### 6.2 Config updates

#### `tsconfig.json`:
Enable path alias resolution for Tauri's JS APIs:
```json
{
  "compilerOptions": {
    "paths": {
      "@tauri-apps/api/*": ["node_modules/@tauri-apps/api/*"]
    }
  }
}
```

#### `vite.config.ts`:
Vite must exclude the Tauri native modules from standard web bundle optimization:
```typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ["@tauri-apps/api"]
  }
});
```

### 6.3 Step-by-Step Developer Checklist

When a developer wants to add a new native capability (e.g. `applyStrikethrough`):

- [ ] **Step 1**: Write the C++ implementation inside `core-engine/liberty-write/src/write_engine.cpp` and declare it in the header.
- [ ] **Step 2**: Add the corresponding declaration in the Rust FFI module `src-tauri/src/ffi/write.rs`.
- [ ] **Step 3**: Create the Tauri Rust command `tauri_apply_strikethrough` in `src-tauri/src/commands/write.rs`.
- [ ] **Step 4**: Run `npm run build` to verify C++ and Rust compilation is successful.
- [ ] **Step 5**: Register the command inside the frontend ActionRegistry dispatcher in `src/store/actionRegistry.ts`.
- [ ] **Step 6**: Connect the `RibbonButton` click handler to dispatch the new registry item.

---

## 7. Migration Plan for Existing Stubs

The following table defines the migration roadmap for all currently-stubbed controls in the workspace:

| App | Stub/Control | Action / Strategy | target phase |
|---|---|---|---|
| `liberty-sheet` | Sheets Chart | C++ calculations, charts parsed and calculated via SheetsEngine. Rendering of chart paths delegated to TS/SVG rendering engine (preserves layout). | Phase 9 |
| `liberty-sheet` | Sheets Screenshot | Pure TS implementation using browser canvas screenshots. No native engine required (no native gain). | Permanent TS |
| `liberty-write` | Preset Styles | Migrated to C++ layout compilation. Raw styling is applied to AST nodes, outputting formatted HTML. | Phase 8 |
| `liberty-impress` | Full Presentation Play | Native PPTX slide loading via ImpressEngine, but animation execution and slide transitioning run entirely in pure TS CSS/WebAnimations API. | Phase 10 |
| `liberty-pdf-edit` | Digital Signature Stamp | Digital signature cryptography computed inside native C++ engine via OpenSSL wrappers. Stamp verification states returned to TS. | Phase 13 |
