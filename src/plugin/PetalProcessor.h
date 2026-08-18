#pragma once
#include <JuceHeader.h>
#include <cmath>
#include <limits>
#include "../dsp/Utility.h"
#include "../dsp/Delayline.h"
#include "../dsp/reverb/Reverb.h"
#include "../dsp/reverb/Filters.h"

class PetalProcessor
{
public:
    PetalProcessor() {}

    void prepareToPlay(double sampleRate, int samplesPerBlock);
    void processBlock(juce::AudioBuffer<float> &buffer) noexcept;

    void setDelayTapAttributes(int tap, bool state, int shiftAmountInSemitones, float reverbAmount);
    void setDelayTapTimes(float freeTimeLInMs, float freeTimeRInMs, int syncIndexL, int syncIndexR,
                 float positionL, float skewL, float positionR, float skewR, float round,
                 bool isSyncL, bool isSyncR, bool stereoLock);

    void setBPM(juce::AudioPlayHead *playhead);
    void setCharacterAttributes(float inputLevelInDB, float delayLevelInDB, float dryLevelInDB, float feedbackAmt, int feedbackLen, int windowSizeInMilliseconds,
                                float lfoRateInHz, float lfoAmount,
                                float filterFreqInHz, float filterShape);

        std::array<std::atomic<float>, 8> amplitudesL,
        amplitudesR, delayTimesL, delayTimesR, tapStates;
    PetalReverb rvb;
    juce::AudioBuffer<float> rvbBuffer;

private:
    void advancePhase(int tap) noexcept;
    static float warpTapPosition(float basePos, float pos, float exponent, float round) // round should be a factor
    {
        float warped;
        if (basePos <= pos)
        {
            float span = pos;
            float distFrac = span <= 0.0001f ? 0.0f : (pos - basePos) / span;
            warped = pos - std::pow(distFrac, exponent) * span;
        }
        else
        {
            float span = 1.0f - pos;
            float distFrac = span <= 0.0001f ? 0.0f : (basePos - pos) / span;
            warped = pos + std::pow(distFrac, exponent) * span;
        }
        if (round > 0.0001f)
        {
            int pow2 = 8 - (int)std::floor((round / 100.0f) * 7);
            pow2 = juce::jlimit(1, 8, pow2);
            const float step = 1.0f / (float)(1 << pow2); 
            warped = std::round(warped / step) * step;
        }

        return juce::jlimit(0.0f, 1.0f, warped);
    }

    static constexpr std::array<double, 11> syncTimeOptions = {
        0.03125, 0.04167, 0.0625, 0.0833,
        0.125, 0.25, 0.333, 0.5,
        0.666, 0.75, 1.0 };

    double sampleRate = 48000, bpm = 120.0;
    float pi = juce::MathConstants<float>::pi;
    float windowSizeInSamples = (float)(sampleRate / 2), windowSizeInMilliseconds = 200.0;
    static constexpr int numOverlaps = 2;

    float inputGain = 1.0f, delayGain = 1.0, dryGain = 1.0f;

    float feedbackAmt = 0.0f, feedbackL = 0.0f, feedbackR = 0.0f;
    int feedbackLen = 0;
    Delayline dlL, dlR, fbDlL, fbDlR;

    Correlation cr;

    float filterShape = 0.0f;
    SVF filterL, filterR;
    float modLFOPhase = 0.0f, modLFOAngle = 0.0f, modLFODepthInSamples = 0.0f;
    static constexpr float maxModLFODepthInMs = 8.0f;

    struct tapAttributes
    {
        float phase = 0.0f;
        float phaseInv = 0.0f;
        juce::SmoothedValue<float> gain;
        juce::SmoothedValue<float> timeL, timeR;
        float shiftAmount = 1.0f;
        float reverbAmount = 0.0f;

        float phasePrevSub0 = 0.0f;
        float phasePrevSub1 = 0.0f;
        float simOffsetL0 = 0.0f;
        float simOffsetL1 = 0.0f;
        float simOffsetR0 = 0.0f;
        float simOffsetR1 = 0.0f;
    };

    std::array<tapAttributes, 8> tp;
};
