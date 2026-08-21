#include "PluginProcessor.h"
#include "PluginEditor.h"

//==============================================================================
PetalAudioProcessor::PetalAudioProcessor()
#ifndef JucePlugin_PreferredChannelConfigurations
     : AudioProcessor (BusesProperties()
                     #if ! JucePlugin_IsMidiEffect
                      #if ! JucePlugin_IsSynth
                       .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                      #endif
                       .withOutput ("Output", juce::AudioChannelSet::stereo(), true)
                     #endif
                       )
#endif
{
    params = std::make_unique<Parameters>(*this);
    presets = std::make_unique<PresetManager>(params->apvts);
}


PetalAudioProcessor::~PetalAudioProcessor()
{
}

//==============================================================================
const juce::String PetalAudioProcessor::getName() const
{
    return JucePlugin_Name;
}

bool PetalAudioProcessor::acceptsMidi() const
{
   #if JucePlugin_WantsMidiInput
    return true;
   #else
    return false;
   #endif
}

bool PetalAudioProcessor::producesMidi() const
{
   #if JucePlugin_ProducesMidiOutput
    return true;
   #else
    return false;
   #endif
}

bool PetalAudioProcessor::isMidiEffect() const
{
   #if JucePlugin_IsMidiEffect
    return true;
   #else
    return false;
   #endif
}

double PetalAudioProcessor::getTailLengthSeconds() const
{
    return 0.0;
}

int PetalAudioProcessor::getNumPrograms()
{
    return 1;   
}

int PetalAudioProcessor::getCurrentProgram()
{
    return 0;
}

void PetalAudioProcessor::setCurrentProgram (int index)
{
}

const juce::String PetalAudioProcessor::getProgramName (int index)
{
    return {};
}

void PetalAudioProcessor::changeProgramName (int index, const juce::String& newName)
{
}

//==============================================================================
void PetalAudioProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    params->prepare(sampleRate, samplesPerBlock);
    petal.prepareToPlay(sampleRate, samplesPerBlock);
}

void PetalAudioProcessor::releaseResources()
{
}

#ifndef JucePlugin_PreferredChannelConfigurations
bool PetalAudioProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
  #if JucePlugin_IsMidiEffect
    juce::ignoreUnused (layouts);
    return true;
  #else
    if (layouts.getMainOutputChannelSet() != juce::AudioChannelSet::stereo())
        return false;

   #if ! JucePlugin_IsSynth
    if (layouts.getMainOutputChannelSet() != layouts.getMainInputChannelSet())
        return false;
   #endif

    return true;
  #endif
}
#endif

void PetalAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    auto totalNumInputChannels  = getTotalNumInputChannels();
    auto totalNumOutputChannels = getTotalNumOutputChannels();

    for (auto i = totalNumInputChannels; i < totalNumOutputChannels; ++i){
        buffer.clear(i, 0, buffer.getNumSamples());
    }

    petal.setBPM(getPlayHead());

#define S(id) params->id->getSmooth()

    petal.setDelayTapTimes(S(freeTimeL), S(freeTimeR), S(syncTimeL), S(syncTimeR),
                           S(positionL), S(skewL), S(positionR), S(skewR), S(round),  // delay time
                           S(isSyncL), S(isSyncR), S(stereoLock)); // sync

    petal.setCharacterAttributes(S(inputLevel), S(delayLevel), S(dryLevel), // level
                                 S(feedbackAmt), S(feedbackLen), S(windowSize), // feedback
                                 S(lfoRate), S(lfoAmount),     // modulation
                                 S(filterCutoff), S(filterShape)); // filter

    petal.rvb.setReverbAttributes(S(reverbLevel), S(reverbDecayTime), S(reverbLPF), S(reverbHPF), S(reverbSize));

#undef S
    for(int tap = 0; tap < 8; tap++){
        petal.setDelayTapAttributes(tap,
                                    params->tapState[tap]->getSmooth(),
                                    params->tapShiftAmt[tap]->getSmooth(),
                                    params->tapReverbAmt[tap]->getSmooth());
    }
    petal.processBlock(buffer);
}

//==============================================================================
bool PetalAudioProcessor::hasEditor() const
{
    return true; 
}

juce::AudioProcessorEditor* PetalAudioProcessor::createEditor()
{
    return new PetalAudioProcessorEditor (*this);
}

//==============================================================================
void PetalAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    copyXmlToBinary(*params->apvts.copyState().createXml(), destData);
}

void PetalAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    const auto xmlState = getXmlFromBinary(data, sizeInBytes);
    if (xmlState == nullptr)
        return;
    const auto newTree = juce::ValueTree::fromXml(*xmlState);
    params->apvts.replaceState(newTree);
}

/*
void PetalAudioProcessor::saveEditorState(bool viewState, bool controlState)
{
    params->apvts.state.setProperty("viewState", viewState, nullptr);
    params->apvts.state.setProperty("controlState", controlState, nullptr);
}
*/

//==============================================================================
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new PetalAudioProcessor();
}
