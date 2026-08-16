#pragma once
#include <JuceHeader.h>

class APF
{
public:
    /*
        This class implements the difference equation: 
        y[n] = -g*x[n] + x[n-d] + g*y[n-d]
    */ 

    void prepareToPlay(double sampleRate, int maximumBlockSize)
    {
        this->sampleRate = sampleRate;

        juce::dsp::ProcessSpec spec;
        spec.sampleRate = sampleRate;
        spec.maximumBlockSize = maximumBlockSize;
        spec.numChannels = 1;

        dl.prepare(spec);
        dl.setMaximumDelayInSamples(sampleRate);
        dl.reset();
    }

    void setValues(float gain, float delayInMilliseconds){ 
        this->gain = gain;
        delayInSamples = static_cast<int>(std::round((delayInMilliseconds / 1000.0) * sampleRate));
    }

    float processSample(float x)
    {
        float y = -gain * x + dl.popSample(0, delayInSamples); 
        dl.pushSample(0, x + gain * y);  
        
        return y;
    }

private: 
    double sampleRate = 48000.0, phase = 0.0;
    bool isModulated = false;
    int delayInSamples = 24;
    float gain = 0.5f;
    juce::dsp::DelayLine<float, juce::dsp::DelayLineInterpolationTypes::Linear> dl;
};

class SVF {
public:
    void prepareToPlay(float sampleRate) {
        this->sampleRate = sampleRate;
        reset();
    }

    void setCoefficients(float cf, float q)
    {
        g = juce::dsp::FastMathApproximations::tan(juce::MathConstants<float>::pi * cf / static_cast<float>(sampleRate));
        k = 1.0f / std::max(q, 0.001f);
        a1 = 1.0f / (1.0f + g * (g + k));
        a2 = g * a1;
        a3 = g * a2;
    }

    void reset()
    {
        g = 0.0f , k = 0.0f, a1 = 0.0f, a2 = 0.0f, a3 = 0.0f;
        z1 = 0.0f, z2 = 0.0f;
    }

    float processSample(float x, int type) noexcept
    {
        float v3 = x - z2;
        float v1 = a1 * z1 + a2 * v3;
        float v2 = z2 + a2 * z1 + a3 * v3;

        z1 = 2.0f * v1 - z1;
        z2 = 2.0f * v2 - z2;

        float y;
        switch (type){
            case 0: // LP
                y = v2;
                break;

            case 1: // BP
                y = v1 * k;
                break;

            case 2: // HP
                y = x - k * v1 - v2;
                break;

            default: // out-of-range type would otherwise return an uninitialised
                     // sample straight into the audio path
                y = v2;
                break;
        }
        return y;
    }

    float processSample(float x, float shape) noexcept // shape crossfade
    {
        float v3 = x - z2;
        float v1 = a1 * z1 + a2 * v3;
        float v2 = z2 + a2 * z1 + a3 * v3;

        z1 = 2.0f * v1 - z1;
        z2 = 2.0f * v2 - z2;

        float lp = v2;
        float bp = v1 * k;
        float hp = x - k * v1 - v2;
        float lpToBp = std::clamp(shape * 2, 0.0f, 1.0f);
        float bpToHp = std::clamp(shape * 2 - 1.0f, 0.0f, 1.0f);

        float y = lp + (bp - lp) * lpToBp + (hp - bp) * bpToHp;
        return y;
    }

private:
    double sampleRate = 48000.0;
    float g = 0.0f, k = 0.0f, a1 = 0.0f, a2 = 0.0f, a3 = 0.0f, z1 = 0.0f, z2 = 0.0f;
};