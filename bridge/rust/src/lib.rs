#[cxx::bridge(namespace = "liberty")]
pub mod ffi {
    // Shared struct layout between Rust and C++
    struct GlyphPosition {
        glyph_id: u32,
        x_advance: f32,
        y_advance: f32,
        x_offset: f32,
        y_offset: f32,
    }

    unsafe extern "C++" {
        include!("kernel.h");
        include!("text_engine.h");

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
    }
}
