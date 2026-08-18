#pragma once
#include <JuceHeader.h>

class Delayline
{
public:
    void setMaximumDelayInSamples(int maxLengthInSamples)
    {
        jassert(maxLengthInSamples > 0);

        int paddedLength = maxLengthInSamples + 2;
        if (bufferLength < paddedLength) {
            bufferLength = paddedLength;
            buffer.resize(bufferLength, 0.0f);
        }    
    }

    void reset() noexcept
    {
        writeIndex = bufferLength - 1;
        std::fill(buffer.begin(), buffer.end(), 0.0f);
    }    

    void writeSample(float input) noexcept {
        jassert(bufferLength > 0);

        writeIndex += 1;
        if (writeIndex >= bufferLength) {
            writeIndex = 0;
        }
        buffer[size_t(writeIndex)] = input;    
    }

    float readSample(float delayInSamples) const noexcept 
    {
        jassert(delayInSamples >= 0.0f);
        jassert(delayInSamples <= bufferLength - 1.0f);

        int integerDelay = int(delayInSamples);

        int readIndexA = (writeIndex - integerDelay) % bufferLength;
        if (readIndexA < 0) { readIndexA += bufferLength; }
        int readIndexB = readIndexA - 1;
        if (readIndexB < 0) { readIndexB += bufferLength; }

        float sampleA = buffer[size_t(readIndexA)];
        float sampleB = buffer[size_t(readIndexB)];
        float fraction = delayInSamples - float(integerDelay);
        
        return sampleA + fraction * (sampleB - sampleA);
    }

    int getBufferLength() const noexcept
    {
        return bufferLength;
    }

private:
    std::vector<float> buffer;
    int writeIndex = 0, bufferLength = 0;
};

