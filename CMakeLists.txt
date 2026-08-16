cmake_minimum_required(VERSION 3.22 FATAL_ERROR)

if(NOT DEFINED CMAKE_OSX_DEPLOYMENT_TARGET)
    set(CMAKE_OSX_DEPLOYMENT_TARGET "11.0" CACHE STRING "Minimum macOS deployment target" FORCE)
endif()

project(Petal VERSION 0.1.0)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Statically link the MSVC runtime so the shipped plugin doesn't require users to
# have the Visual C++ Redistributable installed. Without this the binary imports
# MSVCP140.dll / VCRUNTIME140.dll / VCRUNTIME140_1.dll, which are absent on a clean
# Windows install, and the DAW's plugin scan fails to load it.
# Must be set before targets are created (including JUCE's).
if(MSVC)
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

# Fetch JUCE from GitHub
include(FetchContent)
FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG 8.0.12
    GIT_PROGRESS TRUE
)
FetchContent_MakeAvailable(JUCE)

# Plugin configuration
juce_add_plugin(Petal
    COMPANY_NAME "Rainbow Circuit"
    BUNDLE_ID "com.rainbowcircuit.Petal"
    PRODUCT_NAME "Petal"
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT FALSE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    PLUGIN_MANUFACTURER_CODE Ypco
    PLUGIN_CODE Petl
    FORMATS VST3 AU Standalone
    NEEDS_WEBVIEW2 TRUE
)

juce_generate_juce_header(Petal)

# ------------------------------------------------------------------------------
# Web UI: bundle lit + three (npm) with esbuild, embed the result as binary data
# ------------------------------------------------------------------------------
find_program(NPM_EXECUTABLE npm REQUIRED)

set(PETAL_UI_DIR      "${CMAKE_SOURCE_DIR}/src/ui")
set(PETAL_UI_DIST_DIR "${PETAL_UI_DIR}/dist")
set(PETAL_UI_HTML      "${PETAL_UI_DIST_DIR}/index.html")
set(PETAL_UI_BUNDLE_JS "${PETAL_UI_DIST_DIR}/app.bundle.js")
set(PETAL_UI_NPM_STAMP "${PETAL_UI_DIR}/node_modules/.install-stamp")

file(GLOB_RECURSE PETAL_UI_SOURCES CONFIGURE_DEPENDS "${PETAL_UI_DIR}/public/*")

# Reinstall node_modules whenever package.json/package-lock.json change.
add_custom_command(
    OUTPUT "${PETAL_UI_NPM_STAMP}"
    COMMAND ${NPM_EXECUTABLE} install
    COMMAND ${CMAKE_COMMAND} -E touch "${PETAL_UI_NPM_STAMP}"
    WORKING_DIRECTORY "${PETAL_UI_DIR}"
    DEPENDS "${PETAL_UI_DIR}/package.json" "${PETAL_UI_DIR}/package-lock.json"
    COMMENT "Installing Petal UI npm dependencies (lit, three, esbuild)"
    VERBATIM
)

# Re-bundle whenever any UI source file (or the build script) changes.
add_custom_command(
    OUTPUT "${PETAL_UI_HTML}" "${PETAL_UI_BUNDLE_JS}"
    COMMAND ${NPM_EXECUTABLE} run build
    WORKING_DIRECTORY "${PETAL_UI_DIR}"
    DEPENDS "${PETAL_UI_NPM_STAMP}" "${PETAL_UI_DIR}/build.mjs" ${PETAL_UI_SOURCES}
    COMMENT "Bundling Petal UI with esbuild"
    VERBATIM
)

add_custom_target(PetalUIBundle DEPENDS "${PETAL_UI_HTML}" "${PETAL_UI_BUNDLE_JS}")

juce_add_binary_data(PetalUIData
    NAMESPACE PetalUIData
    SOURCES
        "${PETAL_UI_HTML}"
        "${PETAL_UI_BUNDLE_JS}"
)
add_dependencies(PetalUIData PetalUIBundle)

# Source files
target_sources(Petal
    PRIVATE
        src/PluginProcessor.cpp
        src/PluginProcessor.h
        src/PluginEditor.cpp
        src/PluginEditor.h
        src/params/Parameters.cpp
        src/params/Parameters.h
        src/params/PresetLoader.cpp
        src/params/PresetLoader.h
        src/plugin/PetalProcessor.cpp
        src/plugin/PetalProcessor.h
        src/dsp/reverb/Reverb.cpp
        src/dsp/reverb/Reverb.h
        src/dsp/Utility.h
)

# Preprocessor definitions
target_compile_definitions(Petal
    PUBLIC
        JUCE_WEB_BROWSER=1
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
        JUCE_USE_WIN_WEBVIEW2_WITH_STATIC_LINKING=1
)

# Link JUCE modules
target_link_libraries(Petal
    PRIVATE
        juce::juce_audio_utils
        juce::juce_dsp
        juce::juce_gui_extra
        PetalUIData
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

juce_enable_copy_plugin_step(Petal)

