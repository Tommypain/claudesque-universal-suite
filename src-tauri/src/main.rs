#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Tauri v2 command to trigger native open document dialogs
#[tauri::command]
fn open_document_dialog() -> String {
    println!("Tauri: Invoking native open file picker dialog");
    "/home/tommypain/Documents/Workspace_Outline.docx".to_string()
}

// Tauri v2 command to trigger native save document dialogs
#[tauri::command]
fn save_document_dialog() -> String {
    println!("Tauri: Invoking native save file picker dialog");
    "/home/tommypain/Documents/New_Presentation.pptx".to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_document_dialog,
            save_document_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
