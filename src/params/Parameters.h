#pragma once
#include <JuceHeader.h>
#include <vector>
#include "../PluginProcessor.h"

class PetalAudioProcessor;
class ParameterInstance;
class Parameters
{
public:
    Parameters(PetalAudioProcessor& p);

    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();

    /** Re-derives every parameter's smoothing ramp from the current sample rate and
        block size. Call from prepareToPlay. */
    void prepare(double sampleRate, int samplesPerBlock);

    /** ParameterInstances add themselves here on construction, so prepare() can reach
        all of them without a hand-maintained list that could drift out of sync. */
    void registerInstance(ParameterInstance* instance);

private:
    PetalAudioProcessor& audioProcessor;
    std::vector<ParameterInstance*> instances;

public:
    juce::AudioProcessorValueTreeState apvts;

    std::unique_ptr<ParameterInstance>
        inputLevel,

        freeTimeL,
        freeTimeR,
        syncTimeL,
        syncTimeR,
        isSyncL,
        isSyncR,
        stereoLock,

        feedbackAmt,
        feedbackLen,

        delayLevel,

        positionL,
        skewL,
        positionR,
        skewR,
        round,

        windowSize,

        lfoRate,
        lfoAmount,

        filterCutoff,
        filterShape,

        reverbDecayTime,
        reverbSize,
        reverbLPF,
        reverbHPF,
        reverbLevel,

        dryLevel;

    std::array<std::unique_ptr<ParameterInstance>, 8> 
    tapState, tapShiftAmt, tapReverbAmt; 
    
};

class ParameterInstance : public juce::AudioProcessorParameter::Listener, juce::AsyncUpdater
{
public:
    ParameterInstance(PetalAudioProcessor& p, Parameters& pm, juce::String paramID);

    /** Sets the smoothing ramp length. getSmooth() advances the ramp once per
        processBlock() call, so the length is measured in blocks - deriving it from the
        sample rate and block size keeps the smoothing time fixed rather than letting it
        scale with the host's buffer size. */
    void prepare(double sampleRate, int samplesPerBlock) noexcept;

    //==============================================================================
    void parameterValueChanged (int /*maybe unused*/, float newValue) override;
    void parameterGestureChanged (int parameterIndex, bool gestureIsStarting) override {}
    void handleAsyncUpdate() override;
    void triggerUpdate();
    
    //==============================================================================
    float get() const noexcept;
    float getSafe() const noexcept;
    float getSmooth() noexcept;

    juce::RangedAudioParameter *getRangedAudioParameter() const noexcept;

private:
    /** How long a parameter takes to reach a new value, in seconds. */
    static constexpr double smoothingTimeSeconds = 0.05;

    float valueSafe;
    std::atomic<float> value;
    std::atomic<float> cachedValue;
    juce::SmoothedValue<float> smoothed;

    juce::String paramID;
    juce::RangedAudioParameter* rangedParam = nullptr;
    
    PetalAudioProcessor& audioProcessor;
    Parameters& param;
};

