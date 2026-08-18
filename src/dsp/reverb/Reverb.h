#pragma once
#include <JuceHeader.h>
#include "Filters.h"

class PetalReverb
{
public:
    PetalReverb() {}
    void prepareToPlay(double sampleRate, int samplesPerBlock);
    void setReverbAttributes(float outputLevel, float decayTimeInMs, float LPFreqInHz, float HPFreqInHz, float sizeScaling);
    void processBlock(juce::AudioBuffer<float>& buffer) noexcept;

    std::atomic<float> reverbLevelMsr;

private: 
    double sampleRate = 48000.0;
    float level = 1.0f, size = 1.0f, feedBackAmount = 0.95f;
    float feedbackL = 0.0f, feedbackR = 0.0f;

    juce::dsp::DelayLine<float, juce::dsp::DelayLineInterpolationTypes::Linear> dlL, dlR;
    SVF lpL, lpR, hpL, hpR;
    APF difAp1, difAp2, difAp3, difAp4,
    modAp1, modAp2, modAp3, modAp4;

    double modPhase1 = 0.0,
    modAngle1 = 0.0,
    modPhase2 = 0.0,
    modAngle2 = 0.0;
};