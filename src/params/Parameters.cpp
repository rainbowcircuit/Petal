#include "Parameters.h"

Parameters::Parameters(PetalAudioProcessor& p) : audioProcessor(p),
apvts(audioProcessor, nullptr, "Parameters", createParameterLayout())
{
#define X(id, ...) id = std::make_unique<ParameterInstance>(audioProcessor, *this, #id);
    PETAL_ALL_SCALAR_PARAMS(X)
#undef X

    for (int tap = 0; tap < 8; tap++)
    {
        auto tapStateID = "tapState" + juce::String(tap);
        tapState[tap] = std::make_unique<ParameterInstance>(audioProcessor, *this, tapStateID);

        auto tapShiftAmtID = "tapShiftAmt" + juce::String(tap);
        tapShiftAmt[tap] = std::make_unique<ParameterInstance>(audioProcessor, *this, tapShiftAmtID);

        auto tapReverbAmtID = "tapReverbAmt" + juce::String(tap);
        tapReverbAmt[tap] = std::make_unique<ParameterInstance>(audioProcessor, *this, tapReverbAmtID);
    }
}

void Parameters::registerInstance(ParameterInstance* instance)
{
    if (instance != nullptr)
        instances.push_back(instance);
}

void Parameters::prepare(double sampleRate, int samplesPerBlock)
{
    for (auto* instance : instances)
        instance->prepare(sampleRate, samplesPerBlock);
}

juce::AudioProcessorValueTreeState::ParameterLayout
Parameters::createParameterLayout()
{
    juce::AudioProcessorValueTreeState::ParameterLayout layout;

    static const juce::StringArray syncTimeChoices {
        "1/32", "3/64", "1/16", "3/32", "1/8", "3/16",
        "1/4", "3/8", "1/2", "3/4", "1"
    };

#define X(id, displayName, minVal, maxVal, step, skew, def) \
    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{#id, 1}, \
                                                             displayName, \
                                                             juce::NormalisableRange<float>{minVal, maxVal, step, skew}, def));
    PETAL_FLOAT_PARAMS(X)
#undef X

#define X(id, displayName, def) \
    layout.add(std::make_unique<juce::AudioParameterBool>(juce::ParameterID{#id, 1}, displayName, def));
    PETAL_BOOL_PARAMS(X)
#undef X

#define X(id, displayName, minVal, maxVal, def) \
    layout.add(std::make_unique<juce::AudioParameterInt>(juce::ParameterID{#id, 1}, displayName, minVal, maxVal, def));
    PETAL_INT_PARAMS(X)
#undef X

#define X(id, displayName, choices, defaultIndex) \
    layout.add(std::make_unique<juce::AudioParameterChoice>(juce::ParameterID{#id, 1}, displayName, choices, defaultIndex));
    PETAL_CHOICE_PARAMS(X)
#undef X

    for(int tap = 0; tap < 8; tap++)
    {
        auto tapStateID = "tapState" + juce::String(tap);
        auto tapStateName = "Tap " + juce::String(tap + 1) + " State";
        layout.add(std::make_unique<juce::AudioParameterBool>(juce::ParameterID{tapStateID, 1},
                                                             tapStateName,
                                                             true));

        auto tapShiftAmtID = "tapShiftAmt" + juce::String(tap);
        auto tapShiftAmtName = "Tap " + juce::String(tap + 1) + " Shift Amount";
        layout.add(std::make_unique<juce::AudioParameterInt>(juce::ParameterID {tapShiftAmtID, 1},
                                                            tapShiftAmtName,
                                                             -12, 12, 0));

        auto tapReverbAmtID = "tapReverbAmt" + juce::String(tap);
        auto tapReverbAmtName = "Tap " + juce::String(tap + 1) + " Reverb Amount";
        layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{tapReverbAmtID, 1},
                                                               tapReverbAmtName,
                                                               juce::NormalisableRange<float>{0.0f, 100.0f, 0.01}, 0.0f));
    }

    return layout;
}

ParameterInstance::ParameterInstance(PetalAudioProcessor& p, Parameters& pm, juce::String paramID) : param(pm)
{
    this->paramID = paramID;

    auto* rawValue = param.apvts.getRawParameterValue(paramID);
    jassert(rawValue != nullptr);

    if (rawValue == nullptr)
        return;

    float initValue = rawValue->load();
    value.store(initValue);
    valueSafe = initValue;
    cachedValue.store(initValue);
    smoothed.reset(10);

    if (auto* parameter = dynamic_cast<juce::AudioProcessorParameterWithID*>(param.apvts.getParameter(paramID)))
    {
        if (auto* ranged = dynamic_cast<juce::RangedAudioParameter*>(parameter))
        {
            rangedParam = ranged;
            rangedParam->addListener(this);
        }
    }

    param.registerInstance(this);
}

void ParameterInstance::prepare(double sampleRate, int samplesPerBlock) noexcept
{
    const auto blocksPerRamp = (int) std::ceil((smoothingTimeSeconds * sampleRate)
                                               / (double) juce::jmax(1, samplesPerBlock));

    smoothed.reset(juce::jmax(1, blocksPerRamp));
    smoothed.setCurrentAndTargetValue(get());
}

void ParameterInstance::parameterValueChanged (int /*maybe unused*/, float newValue)
{
    // load atomics for thread safe reading
    cachedValue.store(newValue);
    triggerUpdate();
    triggerAsyncUpdate();
}

void ParameterInstance::handleAsyncUpdate()
{
    if (rangedParam == nullptr)
        return;

    valueSafe = rangedParam->convertFrom0to1(cachedValue.load(std::memory_order_relaxed));
}

void ParameterInstance::triggerUpdate()
{
    if (rangedParam == nullptr)
        return;

    value.store(rangedParam->convertFrom0to1(cachedValue.load(std::memory_order_relaxed)));
}

float ParameterInstance::get() const noexcept
{
    return value.load(std::memory_order_relaxed);
}

float ParameterInstance::getSafe() const noexcept
{
    return valueSafe;
}

float ParameterInstance::getSmooth() noexcept
{
    smoothed.setTargetValue(get());
    return smoothed.getNextValue();
}

juce::RangedAudioParameter *ParameterInstance::getRangedAudioParameter() const noexcept
{
    return rangedParam;
}
