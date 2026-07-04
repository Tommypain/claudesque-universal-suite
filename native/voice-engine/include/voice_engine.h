#pragma once

#include <string>
#include <vector>
#include <memory>
#include <mutex>
#include "rust/cxx.h"

namespace liberty::voice {

// VoiceEngine handles speech-to-text audio transcriptions using whisper.cpp interfaces
class VoiceEngine {
public:
    VoiceEngine() = default;
    ~VoiceEngine() = default;

    // Transcribe raw audio byte streams into formatted text strings
    std::string transcribe_audio(rust::Slice<const uint8_t> audio_bytes);

private:
    std::mutex mutex_;
};

// Creation factory for Rust FFI bindings
std::unique_ptr<VoiceEngine> create_voice_engine();

} // namespace liberty::voice
