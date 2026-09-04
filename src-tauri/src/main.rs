#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Prevent WebKitGTK/GStreamer PipeWire portal hang and UI freeze on Linux
    if std::env::var("GST_PLUGIN_FEATURE_RANK").is_err() {
        std::env::set_var("GST_PLUGIN_FEATURE_RANK", "pipewiresrc:0");
    }
    if std::env::var("WEBKIT_DISABLE_COMPOSITING_MODE").is_err() {
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    }
    osiris_lib::run();
}
