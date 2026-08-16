#include "Parameters.h"

Parameters::Parameters(PetalAudioProcessor& p) : audioProcessor(p),
apvts(audioProcessor, nullptr, "Parameters", createParameterLayout())
{
    inputLevel = std::make_unique<ParameterInstance>(audioProcessor, *this, "inputLevel");

    for (int tap = 0; tap < 8; tap++)
    {
        auto tapStateID = "tapState" + juce::String(tap);
        tapState[tap] = std::make_unique<ParameterInstance>(audioProcessor, *this, tapStateID);

        auto tapShiftAmtID = "tapShiftAmt" + juce::String(tap);
        tapShiftAmt[tap] = std::make_unique<ParameterInstance>(audioProcessor, *this, tapShiftAmtID);

        auto tapReverbAmtID = "tapReverbAmt" + juce::String(tap);
        tapReverbAmt[tap] = std::make_unique<ParameterInstance>(audioProcessor, *this, tapReverbAmtID);
    }

    // time
    freeTimeL = std::make_unique<ParameterInstance>(audioProcessor, *this, "freeTimeL");
    freeTimeR = std::make_unique<ParameterInstance>(audioProcessor, *this, "freeTimeR");
    syncTimeL = std::make_unique<ParameterInstance>(audioProcessor, *this, "syncTimeL");
    syncTimeR = std::make_unique<ParameterInstance>(audioProcessor, *this, "syncTimeR");
    isSyncL = std::make_unique<ParameterInstance>(audioProcessor, *this, "isSyncL");
    isSyncR = std::make_unique<ParameterInstance>(audioProcessor, *this, "isSyncR");
    stereoLock = std::make_unique<ParameterInstance>(audioProcessor, *this, "stereoLock");

    // shaping
    positionL = std::make_unique<ParameterInstance>(audioProcessor, *this, "positionL");
    skewL = std::make_unique<ParameterInstance>(audioProcessor, *this, "skewL");
    positionR = std::make_unique<ParameterInstance>(audioProcessor, *this, "positionR");
    skewR = std::make_unique<ParameterInstance>(audioProcessor, *this, "skewR");
    round = std::make_unique<ParameterInstance>(audioProcessor, *this, "round");
    // feedback
    feedbackAmt = std::make_unique<ParameterInstance>(audioProcessor, *this, "feedbackAmt");
    feedbackLen = std::make_unique<ParameterInstance>(audioProcessor, *this, "feedbackLen");

    delayLevel = std::make_unique<ParameterInstance>(audioProcessor, *this, "delayLevel");

    // window
    windowSize = std::make_unique<ParameterInstance>(audioProcessor, *this, "windowSize");
    windowJitter = std::make_unique<ParameterInstance>(audioProcessor, *this, "windowJitter");
    lfoRate = std::make_unique<ParameterInstance>(audioProcessor, *this, "lfoRate");
    lfoAmount = std::make_unique<ParameterInstance>(audioProcessor, *this, "lfoAmount");
    filterCutoff = std::make_unique<ParameterInstance>(audioProcessor, *this, "filterCutoff");
    filterShape = std::make_unique<ParameterInstance>(audioProcessor, *this, "filterShape");

    // reverb
    reverbDecayTime = std::make_unique<ParameterInstance>(audioProcessor, *this, "reverbDecayTime");
    reverbSize = std::make_unique<ParameterInstance>(audioProcessor, *this, "reverbSize");
    reverbLPF = std::make_unique<ParameterInstance>(audioProcessor, *this, "reverbLPF");
    reverbHPF = std::make_unique<ParameterInstance>(audioProcessor, *this, "reverbHPF");
    reverbLevel = std::make_unique<ParameterInstance>(audioProcessor, *this, "reverbLevel");

    dryLevel = std::make_unique<ParameterInstance>(audioProcessor, *this, "dryLevel");
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

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"inputLevel", 1},
                                                           "Input Level",
                                                           juce::NormalisableRange<float>{-72.0f, 6.0f, 0.01, 4.0}, 0.0f));

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

    // time
    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"freeTimeL", 1},
                                                           "Free Time L",
                                                           juce::NormalisableRange<float>{5.0f, 500.0f, 0.01, 4.0}, 200.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"freeTimeR", 1},
                                                           "Free Time R",
                                                           juce::NormalisableRange<float>{5.0f, 500.0f, 0.01, 4.0}, 200.0f));

    // Labels correspond 1:1 (by index) to PetalProcessor::syncTimeOptions and
    // the JS SYNC_TIME_LABELS.
    static const juce::StringArray syncTimeChoices {
        "1/32", "3/64", "1/16", "3/32", "1/8", "3/16",
        "1/4", "3/8", "1/2", "3/4", "1"
    };

    layout.add(std::make_unique<juce::AudioParameterChoice>(juce::ParameterID{"syncTimeL", 1},
                                                             "Sync Time L",
                                                             syncTimeChoices, 6));

    layout.add(std::make_unique<juce::AudioParameterChoice>(juce::ParameterID{"syncTimeR", 1},
                                                             "Sync Time R",
                                                             syncTimeChoices, 6));

    layout.add(std::make_unique<juce::AudioParameterBool>(juce::ParameterID{"isSyncL", 1},
                                                          "Sync L",
                                                          true));

    layout.add(std::make_unique<juce::AudioParameterBool>(juce::ParameterID{"isSyncR", 1},
                                                          "Sync R",
                                                          true));

    layout.add(std::make_unique<juce::AudioParameterBool>(juce::ParameterID{"stereoLock", 1},
                                                           "Stereo Lock",
                                                           false));

    // shaping
    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID { "positionL", 1},
                                                           "Position L",
                                                           juce::NormalisableRange<float> { 0.0f, 100.0f, 0.01 }, 0.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"skewL", 1},
                                                           "Skew L",
                                                           juce::NormalisableRange<float>{ -100.0f, 100.0f, 0.01}, 0.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"positionR", 1},
                                                           "Position R",
                                                           juce::NormalisableRange<float>{ 0.0f, 100.0f, 0.01}, 0.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"skewR", 1},
                                                           "Skew R",
                                                           juce::NormalisableRange<float>{ -100.0f, 100.0f, 0.01}, 0.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"round", 1},
                                                           "Round",
                                                           juce::NormalisableRange<float>{0.0f, 100.0f, 0.01}, 0.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"feedbackAmt", 1},
                                                           "Feedback Amount",
                                                           juce::NormalisableRange<float>{0.0f, 98.5f, 0.01}, 25.0f));

    layout.add(std::make_unique<juce::AudioParameterInt>(juce::ParameterID{"feedbackLen", 1},
                                                           "Feedback Tap Length",
                                                           1, 8, 8));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"delayLevel", 1},
                                                           "Delay Level",
                                                           juce::NormalisableRange<float>{-72.0f, 6.0f, 0.01, 4.0f}, -6.0f));

    // window size
    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"windowSize", 1},
                                                           "Window Size",
                                                           juce::NormalisableRange<float>{20.0f, 200.0f, 0.1}, 120.0f));

    // reverb 
    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID { "reverbDecayTime", 1},
                                                           "Reverb Decay Time",
                                                           juce::NormalisableRange<float> { 0.0f, 100.0f, 0.01 }, 100.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"reverbSize", 1},
                                                           "Reverb Size",
                                                           juce::NormalisableRange<float>{0.0f, 100.0f, 0.01}, 100.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"reverbLPF", 1},
                                                           "Reverb LPF",
                                                           juce::NormalisableRange<float>{50.0f, 18000.0f, 0.01, 0.25}, 12000.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"reverbHPF", 1},
                                                           "Reverb HPF",
                                                           juce::NormalisableRange<float>{50.0f, 18000.0f, 0.01, 0.25}, 440.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID { "reverbLevel", 1},
                                                           "Reverb Level",
                                                           juce::NormalisableRange<float> { -72.0f, 6.0f, 0.01, 4.0f }, -6.0f));

    // filter freq
    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"filterCutoff", 1},
                                                           "Filter Cutoff",
                                                           juce::NormalisableRange<float>{50.0f, 18000.0f, 0.01, 0.25}, 12000.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"filterShape", 1},
                                                           "Filter Shape",
                                                           juce::NormalisableRange<float>{0.0f, 100.0f, 0.01}, 0.0f));

    // lfo
    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"lfoRate", 1},
                                                           "Mod LFO Rate",
                                                           juce::NormalisableRange<float>{0.0f, 20.0f, 0.01}, 5.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"lfoAmount", 1},
                                                           "Mod LFO Amount",
                                                           juce::NormalisableRange<float>{0.0f, 100.0f, 0.01}, 0.0f));

    layout.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{"dryLevel", 1},
                                                           "Dry Level",
                                                           juce::NormalisableRange<float>{-72.0f, 6.0f, 0.01, 4.0f }, -6.0f));

    return layout;
}

ParameterInstance::ParameterInstance(PetalAudioProcessor& p, Parameters& pm, juce::String paramID) : audioProcessor(p), param(pm)
{
    this->paramID = paramID;
    
    float initValue = param.apvts.getRawParameterValue(paramID)->load();
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

    // Uses the pointer cached in the constructor rather than looking the parameter up
    // by string ID: hosts may call parameterValueChanged() on the audio thread, where
    // a keyed lookup and dynamic_cast are not real-time safe. Both resolve to the same
    // object the constructor already found.
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
