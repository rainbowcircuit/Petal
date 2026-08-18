#pragma once
#include <JuceHeader.h>
#include <vector>
#include "../plugin/PluginProcessor.h"
#include "ParameterList.h"

class PetalAudioProcessor;
class ParameterInstance;
class Parameters
{
public:
    Parameters(PetalAudioProcessor& p);

    static juce::AudioProcessorValueTreeState::ParameterLayout createParameterLayout();
    void prepare(double sampleRate, int samplesPerBlock);
    void registerInstance(ParameterInstance* instance);

private:
    PetalAudioProcessor& audioProcessor;
    std::vector<ParameterInstance*> instances;

public:
    juce::AudioProcessorValueTreeState apvts;

#define X(id, ...) std::unique_ptr<ParameterInstance> id;
    PETAL_ALL_SCALAR_PARAMS(X)
#undef X

    std::array<std::unique_ptr<ParameterInstance>, 8>
    tapState, tapShiftAmt, tapReverbAmt;

};

class ParameterInstance : public juce::AudioProcessorParameter::Listener, juce::AsyncUpdater
{
public:
    ParameterInstance(PetalAudioProcessor& p, Parameters& pm, juce::String paramID);

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

