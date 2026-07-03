#[cxx::bridge(namespace = "liberty::kernel")]
pub mod ffi {
    unsafe extern "C++" {
        include!("kernel.h");

        type CommandManager;

        fn create_command_manager() -> UniquePtr<CommandManager>;

        // CommandManager operations
        fn push(
            self: Pin<&mut CommandManager>,
            cmd_type: &CxxString,
            inverse_state: &CxxString,
        );

        fn undo(self: Pin<&mut CommandManager>) -> Result<String>;
        fn redo(self: Pin<&mut CommandManager>) -> Result<String>;

        fn undo_size(self: &CommandManager) -> usize;
        fn redo_size(self: &CommandManager) -> usize;
        fn clear(self: Pin<&mut CommandManager>);
    }
}
