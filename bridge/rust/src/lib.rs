#[cxx::bridge(namespace = "liberty")]
pub mod ffi {
    // Shared struct layout between Rust and C++ for Text Engine
    struct GlyphPosition {
        glyph_id: u32,
        x_advance: f32,
        y_advance: f32,
        x_offset: f32,
        y_offset: f32,
    }

    // Shared struct layout between Rust and C++ for Layout Engine
    struct LineRun {
        text: String,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
    }

    struct LayoutPage {
        page_number: u32,
        width: f32,
        height: f32,
        lines: Vec<LineRun>,
    }

    unsafe extern "C++" {
        include!("kernel.h");
        include!("text_engine.h");
        include!("layout_engine.h");
        include!("formula_engine.h");
        include!("docs_engine.h");

        // liberty::kernel::CommandManager
        #[namespace = "liberty::kernel"]
        type CommandManager;

        #[namespace = "liberty::kernel"]
        fn create_command_manager() -> UniquePtr<CommandManager>;

        #[namespace = "liberty::kernel"]
        fn push(
            self: Pin<&mut CommandManager>,
            cmd_type: &CxxString,
            inverse_state: &CxxString,
        );

        #[namespace = "liberty::kernel"]
        fn undo(self: Pin<&mut CommandManager>) -> Result<String>;
        #[namespace = "liberty::kernel"]
        fn redo(self: Pin<&mut CommandManager>) -> Result<String>;

        #[namespace = "liberty::kernel"]
        fn undo_size(self: &CommandManager) -> usize;
        #[namespace = "liberty::kernel"]
        fn redo_size(self: &CommandManager) -> usize;
        #[namespace = "liberty::kernel"]
        fn clear(self: Pin<&mut CommandManager>);

        // liberty::text::TextEngine
        #[namespace = "liberty::text"]
        type TextEngine;

        #[namespace = "liberty::text"]
        fn create_text_engine() -> UniquePtr<TextEngine>;

        #[namespace = "liberty::text"]
        fn load_font_from_path(
            self: Pin<&mut TextEngine>,
            font_name: &CxxString,
            path: &CxxString,
        ) -> bool;

        #[namespace = "liberty::text"]
        fn load_font_from_memory(
            self: Pin<&mut TextEngine>,
            font_name: &CxxString,
            font_bytes: &[u8],
        ) -> bool;

        #[namespace = "liberty::text"]
        fn shape_text(
            self: Pin<&mut TextEngine>,
            text: &CxxString,
            font_name: &CxxString,
            font_size: f32,
        ) -> Vec<GlyphPosition>;

        #[namespace = "liberty::text"]
        fn has_font(self: &TextEngine, font_name: &CxxString) -> bool;

        // liberty::layout::LayoutEngine
        #[namespace = "liberty::layout"]
        type LayoutEngine;

        #[namespace = "liberty::layout"]
        fn create_layout_engine() -> UniquePtr<LayoutEngine>;

        #[namespace = "liberty::layout"]
        fn reflow_document(
            self: Pin<&mut LayoutEngine>,
            text: &CxxString,
            page_width: f32,
            page_height: f32,
            margin: f32,
            font_name: &CxxString,
            font_size: f32,
            text_shaper: Pin<&mut TextEngine>,
        ) -> Vec<LayoutPage>;

        // liberty::formula::FormulaEngine
        #[namespace = "liberty::formula"]
        type FormulaEngine;

        #[namespace = "liberty::formula"]
        fn create_formula_engine() -> UniquePtr<FormulaEngine>;

        #[namespace = "liberty::formula"]
        fn set_cell_value(
            self: Pin<&mut FormulaEngine>,
            cell_id: &CxxString,
            raw_value: &CxxString,
        );

        #[namespace = "liberty::formula"]
        fn evaluate_all(self: Pin<&mut FormulaEngine>) -> Result<String>;

        #[namespace = "liberty::formula"]
        fn has_circular_dependencies(self: &FormulaEngine) -> bool;

        #[namespace = "liberty::formula"]
        fn clear(self: Pin<&mut FormulaEngine>);

        // liberty::docs::DocsEngine
        #[namespace = "liberty::docs"]
        type DocsEngine;

        #[namespace = "liberty::docs"]
        fn create_docs_engine() -> UniquePtr<DocsEngine>;

        #[namespace = "liberty::docs"]
        fn load_file(
            self: Pin<&mut DocsEngine>,
            file_bytes: &[u8],
            extension: &CxxString,
        ) -> Result<String>;

        #[namespace = "liberty::docs"]
        fn export_file(
            self: Pin<&mut DocsEngine>,
            html: &CxxString,
            extension: &CxxString,
        ) -> Result<Vec<u8>>;
    }
}
