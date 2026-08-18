#pragma once

// Single source of truth for every scalar (non-tap) plugin parameter's id, display name,
// JUCE parameter type, range/choices, and default value. Included by both Parameters.h/.cpp
// (which owns the long-lived ParameterInstance objects read on the audio thread) and
// PluginEditor.h/.cpp (which owns the WebSliderRelay/WebSliderParameterAttachment objects
// rebuilt each time the editor opens) so both sides expand into their own compile-time named
// members from one list instead of duplicating each id by hand in both places.
//
// The 3 per-tap parameter arrays (tapState, tapShiftAmt, tapReverbAmt) are not part of this
// list - they're already built via a loop wherever they're used and don't have the
// one-member-per-parameter duplication problem this list solves.

#define PETAL_FLOAT_PARAMS(X) \
    X(inputLevel,       "Input Level",       -72.0f,   6.0f,     0.01f, 4.0f,  0.0f) \
    X(freeTimeL,        "Free Time L",         5.0f, 500.0f,     0.01f, 4.0f,  200.0f) \
    X(freeTimeR,        "Free Time R",         5.0f, 500.0f,     0.01f, 4.0f,  200.0f) \
    X(positionL,        "Position L",          0.0f, 100.0f,     0.01f, 1.0f,  0.0f) \
    X(skewL,            "Skew L",           -100.0f, 100.0f,     0.01f, 1.0f,  0.0f) \
    X(positionR,        "Position R",          0.0f, 100.0f,     0.01f, 1.0f,  0.0f) \
    X(skewR,            "Skew R",           -100.0f, 100.0f,     0.01f, 1.0f,  0.0f) \
    X(round,            "Round",               0.0f, 100.0f,     0.01f, 1.0f,  0.0f) \
    X(feedbackAmt,      "Feedback Amount",     0.0f,  98.5f,     0.01f, 1.0f,  25.0f) \
    X(delayLevel,       "Delay Level",       -72.0f,   6.0f,     0.01f, 4.0f, -6.0f) \
    X(windowSize,       "Window Size",        20.0f, 200.0f,     0.1f,  1.0f,  120.0f) \
    X(reverbDecayTime,  "Reverb Decay Time",   0.0f, 100.0f,     0.01f, 1.0f,  100.0f) \
    X(reverbSize,       "Reverb Size",         0.0f, 100.0f,     0.01f, 1.0f,  100.0f) \
    X(reverbLPF,        "Reverb LPF",          50.0f, 18000.0f,  0.01f, 0.25f, 12000.0f) \
    X(reverbHPF,        "Reverb HPF",          50.0f, 18000.0f,  0.01f, 0.25f, 440.0f) \
    X(reverbLevel,      "Reverb Level",      -72.0f,   6.0f,     0.01f, 4.0f, -6.0f) \
    X(filterCutoff,     "Filter Cutoff",       50.0f, 18000.0f,  0.01f, 0.25f, 12000.0f) \
    X(filterShape,      "Filter Shape",        0.0f, 100.0f,     0.01f, 1.0f,  0.0f) \
    X(lfoRate,          "Mod LFO Rate",        0.0f,  20.0f,     0.01f, 1.0f,  5.0f) \
    X(lfoAmount,        "Mod LFO Amount",      0.0f, 100.0f,     0.01f, 1.0f,  0.0f) \
    X(dryLevel,         "Dry Level",         -72.0f,   6.0f,     0.01f, 4.0f, -6.0f)

#define PETAL_BOOL_PARAMS(X) \
    X(isSyncL,    "Sync L",       true) \
    X(isSyncR,    "Sync R",       true) \
    X(stereoLock, "Stereo Lock",  false)

#define PETAL_INT_PARAMS(X) \
    X(feedbackLen, "Feedback Tap Length", 1, 8, 8)

// Both choice parameters share the same choice list, syncTimeChoices, which must be in scope
// wherever PETAL_CHOICE_PARAMS(X) is expanded to build the AudioParameterChoice layout entries.
#define PETAL_CHOICE_PARAMS(X) \
    X(syncTimeL, "Sync Time L", syncTimeChoices, 6) \
    X(syncTimeR, "Sync Time R", syncTimeChoices, 6)

#define PETAL_ALL_SCALAR_PARAMS(X) \
    PETAL_FLOAT_PARAMS(X) \
    PETAL_BOOL_PARAMS(X) \
    PETAL_INT_PARAMS(X) \
    PETAL_CHOICE_PARAMS(X)
