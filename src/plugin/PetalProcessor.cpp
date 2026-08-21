#pragma once
#include "PetalProcessor.h"

void PetalProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    this->sampleRate = sampleRate;
    dlL.setMaximumDelayInSamples(sampleRate * 10);
    dlR.setMaximumDelayInSamples(sampleRate * 10);
    dlL.reset();
    dlR.reset();
    fbDlL.setMaximumDelayInSamples(sampleRate * 10);
    fbDlR.setMaximumDelayInSamples(sampleRate * 10);
    fbDlL.reset();
    fbDlR.reset();

    rvb.prepareToPlay(sampleRate, samplesPerBlock);
    rvbBuffer.setSize(2, samplesPerBlock, false, false, true);

    cr.prepare(sampleRate);
    cr.updateCorrelationSizes();

    for (auto &t : tp)
    {
        t.phasePrevSub0 = 0.0f;
        t.phasePrevSub1 = 0.5f;
        t.simOffsetL0 = 0.0f;
        t.simOffsetL1 = 0.0f;
        t.simOffsetR0 = 0.0f;
        t.simOffsetR1 = 0.0f;
    }

    for (int tap = 0; tap < 8; tap++) // clean this up maybe
    {
        tp[tap].gain.reset(sampleRate, 0.01f);
        tp[tap].timeL.reset(sampleRate, 0.15f);
        tp[tap].timeR.reset(sampleRate, 0.15f);
    }

    filterL.prepareToPlay(static_cast<float>(sampleRate));
    filterR.prepareToPlay(static_cast<float>(sampleRate));
    
}

void PetalProcessor::processBlock(juce::AudioBuffer<float> &buffer) noexcept
{
    auto readDataL = buffer.getReadPointer(0);
    auto readDataR = buffer.getReadPointer(1);
    rvbBuffer.setSize(2, buffer.getNumSamples(), false, false, true);
    rvbBuffer.clear();

    const float gain = 2.0f / (float)numOverlaps;

    for (int sample = 0; sample < buffer.getNumSamples(); ++sample)
    {
        // input signals
        float dryL = readDataL[sample];
        float dryR = readDataR[sample];

        float inL = dryL * inputGain;
        float inR = dryR * inputGain;
        inL = filterL.processSample(inL, filterShape);
        inR = filterR.processSample(inR, filterShape);

        dlL.writeSample(inL);
        dlR.writeSample(inR);
        float feedforwardL = 0.0f;
        float feedforwardR = 0.0f;

        // replace the passed-through dry signal with the gain-staged version
        buffer.setSample(0, sample, dryL * dryGain);
        buffer.setSample(1, sample, dryR * dryGain);

        // set mod LFO
        modLFOPhase += modLFOAngle;
        if (modLFOPhase >= 1.0f) modLFOPhase -= 1.0f;
        const float modLFOValue = std::sin(2.0f * pi * modLFOPhase) * modLFODepthInSamples;

        
        for (int tap = 0; tap < 8; tap++)
        {
            advancePhase(tap);
            float pitchShiftedL = 0.0f, pitchShiftedR = 0.0f;

            // pull one interpolated value per sample, reused across both sub-iterations
            const float baseTimeL = tp[tap].timeL.getNextValue();
            const float baseTimeR = tp[tap].timeR.getNextValue();

            // sub 0 (in phase)
            {
                float phase = tp[tap].phase;
                if (phase >= 1.0f)
                    phase -= 1.0f;

                const float prevPhase = tp[tap].phasePrevSub0;
                if (std::abs(phase - prevPhase) > 0.5f)
                {
                    const float endPosL = baseTimeL + windowSizeInSamples * prevPhase + tp[tap].simOffsetL0;
                    const float endPosR = baseTimeR + windowSizeInSamples * prevPhase + tp[tap].simOffsetR0;

                    const float startL = baseTimeL + windowSizeInSamples * phase;
                    const float startR = baseTimeR + windowSizeInSamples * phase;

                    tp[tap].simOffsetL0 = cr.computeSimOffset(dlL, endPosL, startL);
                    tp[tap].simOffsetR0 = cr.computeSimOffset(dlR, endPosR, startR);
                }

                tp[tap].phasePrevSub0 = phase;
                // -----------------------------------------------------------
                float window = 0.5f * (1.0f - std::cos(2.0f * pi * phase));
                float windowPos = windowSizeInSamples * phase;
                float delayL = std::max(0.0f, baseTimeL + windowPos + tp[tap].simOffsetL0 + modLFOValue);
                float delayR = std::max(0.0f, baseTimeR + windowPos + tp[tap].simOffsetR0 + modLFOValue);

                pitchShiftedL += dlL.readSample(delayL) * window * tp[tap].gain.getNextValue();
                pitchShiftedR += dlR.readSample(delayR) * window * tp[tap].gain.getNextValue();
            }

            // sub 1 (half-period offset)
            {
                float phase = tp[tap].phase + 0.5f;
                if (phase >= 1.0f)
                    phase -= 1.0f;

                const float prevPhase = tp[tap].phasePrevSub1;
                if (std::abs(phase - prevPhase) > 0.5f)
                {
                    const float endPosL = baseTimeL + windowSizeInSamples * prevPhase + tp[tap].simOffsetL1;
                    const float endPosR = baseTimeR + windowSizeInSamples * prevPhase + tp[tap].simOffsetR1;

                    const float startL = baseTimeL + windowSizeInSamples * phase;
                    const float startR = baseTimeR + windowSizeInSamples * phase;

                    tp[tap].simOffsetL1 = cr.computeSimOffset(dlL, endPosL, startL);
                    tp[tap].simOffsetR1 = cr.computeSimOffset(dlR, endPosR, startR);
                }

                tp[tap].phasePrevSub1 = phase;
                // -----------------------------------------------------------
                float window = 0.5f * (1.0f - std::cos(2.0f * pi * phase));
                float windowPos = windowSizeInSamples * phase;
                float delayL = std::max(0.0f, baseTimeL + windowPos + tp[tap].simOffsetL1 + modLFOValue);
                float delayR = std::max(0.0f, baseTimeR + windowPos + tp[tap].simOffsetR1 + modLFOValue);

                pitchShiftedL += dlL.readSample(delayL) * window * tp[tap].gain.getNextValue();
                pitchShiftedR += dlR.readSample(delayR) * window * tp[tap].gain.getNextValue();
            }

            if (tap <= feedbackLen)
            {
                feedforwardL += pitchShiftedL * gain;
                feedforwardR += pitchShiftedR * gain;
            }

            buffer.addSample(0, sample, pitchShiftedL * gain * delayGain);
            buffer.addSample(1, sample, pitchShiftedR * gain * delayGain);
            rvbBuffer.addSample(0, sample, pitchShiftedL * gain * tp[tap].reverbAmount);
            rvbBuffer.addSample(1, sample, pitchShiftedR * gain * tp[tap].reverbAmount);
        }

        float fbL = fbDlL.readSample(tp[feedbackLen].timeL.getNextValue());
        float fbR = fbDlR.readSample(tp[feedbackLen].timeR.getNextValue());

        feedbackL = fbL * feedbackAmt;
        feedbackR = fbR * feedbackAmt;

        fbDlL.writeSample(feedforwardL + feedbackL);
        fbDlR.writeSample(feedforwardR + feedbackR);

        buffer.addSample(0, sample, feedbackL * delayGain);
        buffer.addSample(1, sample, feedbackR * delayGain);
    }

    rvb.processBlock(rvbBuffer);
    buffer.addFrom(0, 0, rvbBuffer, 0, 0, buffer.getNumSamples());
    buffer.addFrom(1, 0, rvbBuffer, 1, 0, buffer.getNumSamples());
}

void PetalProcessor::advancePhase(int tap) noexcept
{
    float rate = ((1.0f - tp[tap].shiftAmount) * 1000.0f) / windowSizeInMilliseconds;
    float phaseAngle = rate / static_cast<float>(sampleRate);

    tp[tap].phase += phaseAngle;
    if (tp[tap].phase >= 1.0f) { tp[tap].phase -= 1.0f; }
    if (tp[tap].phase <= 0.0f) { tp[tap].phase += 1.0f; }
}

void PetalProcessor::setDelayTapTimes(float freeTimeLInMs, float freeTimeRInMs, int syncIndexL, int syncIndexR,
                                      float positionL, float skewL, float positionR, float skewR, float round,
                                      bool isSyncL, bool isSyncR, bool stereoLock)
{
    const int lastIndex = (int)syncTimeOptions.size() - 1;
    float syncTimeLInMs = static_cast<float>(syncTimeOptions[(size_t)juce::jlimit(0, lastIndex, syncIndexL)] * (240000.0 / bpm));
    float syncTimeRInMs = static_cast<float>(syncTimeOptions[(size_t)juce::jlimit(0, lastIndex, syncIndexR)] * (240000.0 / bpm));

    float timeLInMs = isSyncL ? syncTimeLInMs : freeTimeLInMs;
    float timeRInMs = stereoLock ? timeLInMs : (isSyncR ? syncTimeRInMs : freeTimeRInMs);

    float timeLInSamples = (timeLInMs / 1000.0f) * static_cast<float>(sampleRate);
    float timeRInSamples = (timeRInMs / 1000.0f) * static_cast<float>(sampleRate);

    float positionRInUse = stereoLock ? positionL / 100.0f : positionR / 100.0f;
    float skewRInUse = stereoLock ? skewL / 100.0f : skewR / 100.0f;

    float exponentL = std::pow(2.0f, (skewL / 100.0f) * 5.0f);
    float exponentR = std::pow(2.0f, skewRInUse * 5.0f);

    const float maxTapTime = (float)dlL.getBufferLength() - (float)sampleRate * 0.5f;

    for (int tap = 0; tap < 8; tap++)
    {
        float basePos = (1.0f / 8.0f) * (tap + 1.0f);
        float warpedL = warpTapPosition(basePos, positionL / 100.0f, exponentL, round);
        float warpedR = warpTapPosition(basePos, positionRInUse, exponentR, round);
        delayTimesL[tap].store(warpedL);
        delayTimesR[tap].store(warpedR);

        tp[tap].timeL.setTargetValue(juce::jlimit(0.0f, maxTapTime, warpedL * timeLInSamples * 8.0f));
        tp[tap].timeR.setTargetValue(juce::jlimit(0.0f, maxTapTime, warpedR * timeRInSamples * 8.0f));
    }
}

void PetalProcessor::setBPM(juce::AudioPlayHead *playhead)
{
    if (playhead == nullptr) { return; }
    auto position = playhead->getPosition();
    if (position.hasValue() && position->getBpm().hasValue())
    {
        this->bpm = *position->getBpm();
    }
}

void PetalProcessor::setDelayTapAttributes(int tap, bool state, int shiftAmountInSemitones, float reverbAmount)
{
    float shiftAmount = std::exp(0.057762265f * shiftAmountInSemitones);
    tp[tap].gain.setTargetValue(state);
    tapStates[tap].store(state);
    
    tp[tap].shiftAmount = shiftAmount;
    tp[tap].reverbAmount = reverbAmount / 100.0f;
}

void PetalProcessor::setCharacterAttributes(float inputLevelInDB, float delayLevelInDB, float dryLevelInDB, float feedbackAmt, int feedbackLen, int windowSizeInMilliseconds,
                                            float lfoRateInHz, float lfoAmount,
                                            float filterFreqInHz, float filterShape)
{
    inputGain = juce::Decibels::decibelsToGain(inputLevelInDB, -72.0f);
    delayGain = juce::Decibels::decibelsToGain(delayLevelInDB, -72.0f);
    dryGain = juce::Decibels::decibelsToGain(dryLevelInDB, -72.0f);

    this->windowSizeInMilliseconds = windowSizeInMilliseconds;
    this->windowSizeInSamples = (static_cast<float>(sampleRate) / 1000.0f) * windowSizeInMilliseconds;

    // feedback
    this->feedbackAmt = std::clamp(feedbackAmt / 100.0f, 0.0f, 0.985f);
    this->feedbackLen = std::clamp(feedbackLen - 1, 0, 7);

    // mod LFO
    this->modLFOAngle = lfoRateInHz / static_cast<float>(sampleRate);
    this->modLFODepthInSamples = (lfoAmount / 100.0f) * (maxModLFODepthInMs / 1000.0f) * (float)sampleRate;

    // filtering
    float cutoffFreq = std::clamp(filterFreqInHz, 20.0f, (float)sampleRate * 0.485f);
    this->filterL.setCoefficients(cutoffFreq, 0.707f);
    this->filterR.setCoefficients(cutoffFreq, 0.707f);
    this->filterShape = filterShape/100.0f;
}