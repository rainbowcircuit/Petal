

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "PluginProcessor.h"
#include "../params/ParameterList.h"
#include <juce_gui_extra/juce_gui_extra.h>
#include <array>
//==============================================================================

class PetalAudioProcessorEditor  : public juce::AudioProcessorEditor, public juce::Timer
{
public:
    PetalAudioProcessorEditor (PetalAudioProcessor&);
    ~PetalAudioProcessorEditor() override;

    void paint (juce::Graphics&) override;
    void resized() override;
    
private:
    PetalAudioProcessor& audioProcessor;

#define X(id, ...) juce::WebSliderRelay id##Relay{#id};
    PETAL_ALL_SCALAR_PARAMS(X)
#undef X

    static std::array<std::unique_ptr<juce::WebSliderRelay>, 8> makeTapRelays (const juce::String& idPrefix);
    std::array<std::unique_ptr<juce::WebSliderRelay>, 8> tapStateRelays = makeTapRelays("tapState");
    std::array<std::unique_ptr<juce::WebSliderRelay>, 8> tapShiftAmtRelays  = makeTapRelays ("tapShiftAmt");
    std::array<std::unique_ptr<juce::WebSliderRelay>, 8> tapReverbAmtRelays = makeTapRelays ("tapReverbAmt");

    static bool isWebView2RuntimeAvailable();
    juce::WebBrowserComponent::Options buildWebviewOptions();

    std::unique_ptr<juce::WebBrowserComponent> webview;
    juce::Label webViewUnavailableLabel;
    juce::HyperlinkButton webViewDownloadLink{
        "Download WebView2 Runtime",
        juce::URL("https://go.microsoft.com/fwlink/p/?LinkId=2124703")};

#define X(id, ...) WebSliderParameterAttachment id##Attachment { *audioProcessor.params->id->getRangedAudioParameter(), id##Relay, nullptr };
    PETAL_ALL_SCALAR_PARAMS(X)
#undef X

    std::array<std::unique_ptr<WebSliderParameterAttachment>, 8> tapStateAttachments, tapShiftAmtAttachments, tapReverbAmtAttachments;

    auto getResource(const juce::String& url) -> std::optional<juce::WebBrowserComponent::Resource>;
    void timerCallback() override;
    std::unique_ptr<juce::ResizableBorderComponent> resizer;
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PetalAudioProcessorEditor)
};
