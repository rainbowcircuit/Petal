
#include <JuceHeader.h>
#include "PluginProcessor.h"
#include "PluginEditor.h"
#include "BinaryData.h"

#if JUCE_WINDOWS
 #include <WebView2.h>
#endif

//==============================================================================

namespace {
    static const char* getMimeForExtension(const juce::String& extension) {
        static const std::unordered_map<juce::String, const char*> mimeMap = {
            {{"htm"}, "text/html"},
            {{"html"}, "text/html"},
            {{"txt"}, "text/plain"},
            {{"jpg"}, "image/jpeg"},
            {{"jpeg"}, "image/jpeg"},
            {{"svg"}, "image/svg+xml"},
            {{"ico"}, "image/vnd.microsoft.icon"},
            {{"json"}, "application/json"},
            {{"png"}, "image/png"},
            {{"css"}, "text/css"},
            {{"map"}, "application/json"},
            {{"js"}, "text/javascript"},
            {{"woff2"}, "font/woff2"}};

        if (const auto it = mimeMap.find(extension.toLowerCase());
            it != mimeMap.end())
            return it->second;

        jassertfalse;
        return "";
        }
} 


//==============================================================================
std::array<std::unique_ptr<juce::WebSliderRelay>, 8> PetalAudioProcessorEditor::makeTapRelays (const juce::String& idPrefix)
{
    std::array<std::unique_ptr<juce::WebSliderRelay>, 8> relays;

    for (int tap = 0; tap < 8; ++tap)
        relays[tap] = std::make_unique<juce::WebSliderRelay>(idPrefix + juce::String(tap));

    return relays;
}

bool PetalAudioProcessorEditor::isWebView2RuntimeAvailable()
{
#if JUCE_WINDOWS
    LPWSTR versionInfo = nullptr;
    const auto hr = GetAvailableCoreWebView2BrowserVersionString(nullptr, &versionInfo);
    const bool available = SUCCEEDED(hr) && versionInfo != nullptr;

    if (versionInfo != nullptr)
        CoTaskMemFree(versionInfo);

    return available;
#else
    return true;
#endif
}

juce::WebBrowserComponent::Options PetalAudioProcessorEditor::buildWebviewOptions()
{
    auto options = juce::WebBrowserComponent::Options{}
                       .withOptionsFrom(inputLevelRelay)
                       .withOptionsFrom(freeTimeLRelay)
                       .withOptionsFrom(freeTimeRRelay)
                       .withOptionsFrom(syncTimeLRelay)
                       .withOptionsFrom(syncTimeRRelay)
                       .withOptionsFrom(isSyncLRelay)
                       .withOptionsFrom(isSyncRRelay)
                       .withOptionsFrom(stereoLockRelay)
                       .withOptionsFrom(positionLRelay)
                       .withOptionsFrom(skewLRelay)
                       .withOptionsFrom(positionRRelay)
                       .withOptionsFrom(skewRRelay)
                       .withOptionsFrom(roundRelay)
                       .withOptionsFrom(delayLevelRelay)
                       .withOptionsFrom(windowSizeRelay)

                       .withOptionsFrom(feedbackAmtRelay)
                       .withOptionsFrom(feedbackLenRelay)

                       .withOptionsFrom(filterCutoffRelay)
                       .withOptionsFrom(filterShapeRelay)
                       .withOptionsFrom(lfoRateRelay)
                       .withOptionsFrom(lfoAmountRelay)

                       .withOptionsFrom(reverbSizeRelay)
                       .withOptionsFrom(reverbDecayTimeRelay)
                       .withOptionsFrom(reverbLPFRelay)
                       .withOptionsFrom(reverbHPFRelay)
                       .withOptionsFrom(reverbLevelRelay)
                       .withOptionsFrom(dryLevelRelay);

    for (auto &relay : tapStateRelays)
        options = options.withOptionsFrom(*relay);
    for (auto& relay : tapShiftAmtRelays)
        options = options.withOptionsFrom(*relay);
    for (auto& relay : tapReverbAmtRelays)
        options = options.withOptionsFrom(*relay);

    options = options.withNativeFunction("attemptSave", [this](auto &var, auto completion)
    {
        juce::MessageManager::callAsync([this] { audioProcessor.presets->attemptSave(); });
        completion(juce::var());
    });

    options = options.withNativeFunction("getAllPreset", [this](auto &var, auto completion)
    {
        completion(audioProcessor.presets->getAllPresetAsVar());
    });

    options = options.withNativeFunction("loadPreset", [this](auto &var, auto completion)
    {
        audioProcessor.presets->loadPreset(var[0].toString());
        completion(juce::var());
    });

    options = options.withResourceProvider([this](const auto &url)
                                           { return getResource(url); });

#if JUCE_WINDOWS
    // The default Windows backend is the legacy IE control, which has no resource
    // provider support - it would try to resolve https://juce.backend over the network
    // and fail. WebView2 has to be requested explicitly.
    //
    // The user data folder must also be overridden: it otherwise defaults to a location
    // next to the host executable (e.g. the DAW's install dir under Program Files),
    // which plugins generally can't write to, and WebView2 then silently falls back to IE.
    options = options.withBackend(juce::WebBrowserComponent::Options::Backend::webview2)
                     .withWinWebView2Options(
                         juce::WebBrowserComponent::Options::WinWebView2{}
                             .withUserDataFolder(juce::File::getSpecialLocation(
                                 juce::File::SpecialLocationType::tempDirectory)));
#endif

    return options;
}

PetalAudioProcessorEditor::PetalAudioProcessorEditor(PetalAudioProcessor &p)
    : AudioProcessorEditor(&p), audioProcessor(p)
{
    if (isWebView2RuntimeAvailable())
    {
        webview = std::make_unique<juce::WebBrowserComponent>(buildWebviewOptions());
        addAndMakeVisible(*webview);

    #if JUCE_DEBUG
        webview->goToURL("http://localhost:4000");
    #else
        webview->goToURL(juce::WebBrowserComponent::getResourceProviderRoot());
    #endif
    }
    else
    {
        webViewUnavailableLabel.setText(
            "Petal's interface requires the Microsoft Edge WebView2 Runtime, "
            "which isn't installed on this computer.",
            juce::dontSendNotification);
        webViewUnavailableLabel.setJustificationType(juce::Justification::centred);
        webViewUnavailableLabel.setColour(juce::Label::textColourId, juce::Colours::white);
        addAndMakeVisible(webViewUnavailableLabel);
        addAndMakeVisible(webViewDownloadLink);
    }

    const int width = 950;
    setResizable(true, false);
    setResizeLimits((int)width * 0.75f, (int)width * 0.75f / 2, (int)width, (int)width / 2);
    getConstrainer()->setFixedAspectRatio(2);

    resizer = std::make_unique<juce::ResizableBorderComponent>(this, getConstrainer()); // resizer created AFTER
    addAndMakeVisible(resizer.get());

    setSize((int)width * 0.875f, (int)width * 0.875f / 2);
    startTimerHz(30);

    inputLevelAttachment.sendInitialUpdate();

    freeTimeLAttachment.sendInitialUpdate();
    freeTimeRAttachment.sendInitialUpdate();
    syncTimeLAttachment.sendInitialUpdate();
    syncTimeRAttachment.sendInitialUpdate();
    isSyncLAttachment.sendInitialUpdate();
    isSyncRAttachment.sendInitialUpdate();
    stereoLockAttachment.sendInitialUpdate();
    positionLAttachment.sendInitialUpdate();
    skewLAttachment.sendInitialUpdate();
    positionRAttachment.sendInitialUpdate();
    skewRAttachment.sendInitialUpdate();
    roundAttachment.sendInitialUpdate();

    feedbackAmtAttachment.sendInitialUpdate();
    feedbackLenAttachment.sendInitialUpdate();

    windowSizeAttachment.sendInitialUpdate();
    delayLevelAttachment.sendInitialUpdate();

    reverbSizeAttachment.sendInitialUpdate();
    reverbDecayTimeAttachment.sendInitialUpdate();
    reverbLPFAttachment.sendInitialUpdate();
    reverbHPFAttachment.sendInitialUpdate();
    reverbLevelAttachment.sendInitialUpdate();

    dryLevelAttachment.sendInitialUpdate();

    for (int tap = 0; tap < 8; ++tap)
    {
        tapStateAttachments[tap] = std::make_unique<WebSliderParameterAttachment>(
            *audioProcessor.params->tapState[tap]->getRangedAudioParameter(),
            *tapStateRelays[tap], nullptr);
        tapStateAttachments[tap]->sendInitialUpdate();

        tapShiftAmtAttachments[tap] = std::make_unique<WebSliderParameterAttachment>(
            *audioProcessor.params->tapShiftAmt[tap]->getRangedAudioParameter(),
            *tapShiftAmtRelays[tap], nullptr);
        tapShiftAmtAttachments[tap]->sendInitialUpdate();

        tapReverbAmtAttachments[tap] = std::make_unique<WebSliderParameterAttachment>(
            *audioProcessor.params->tapReverbAmt[tap]->getRangedAudioParameter(),
            *tapReverbAmtRelays[tap], nullptr);
        tapReverbAmtAttachments[tap]->sendInitialUpdate();
    }

}

PetalAudioProcessorEditor::~PetalAudioProcessorEditor()
{
    // Stop the timer before any members are torn down. The base juce::Timer destructor
    // only runs after this class's members are already gone, and destroying the
    // WebView2-backed browser component pumps the message loop - which can dispatch a
    // queued timerCallback() against a half-destroyed webview. The nullptr check in
    // timerCallback() doesn't help: the unique_ptr still holds a non-null pointer while
    // ~WebBrowserComponent is running.
    stopTimer();
    webview.reset();
}

//==============================================================================
void PetalAudioProcessorEditor::paint (juce::Graphics& g)
{
    g.fillAll(juce::Colour(0xff1d1d1d));
}

void PetalAudioProcessorEditor::resized()
{
    const auto webviewBounds = getLocalBounds();

    if (webview != nullptr)
    {
        webview->setBounds(webviewBounds);

        auto *windowSize = new juce::DynamicObject();
        windowSize->setProperty("width", webviewBounds.getWidth());
        windowSize->setProperty("height", webviewBounds.getHeight());
        webview->emitEventIfBrowserIsVisible("windowSize", juce::JSON::toString(juce::var(windowSize)));
    }
    else
    {
        auto bounds = webviewBounds.reduced(20);
        webViewUnavailableLabel.setBounds(bounds.removeFromTop(bounds.getHeight() / 2));
        webViewDownloadLink.setBounds(bounds.removeFromTop(24));
    }

    if (resizer != nullptr)
        resizer->setBounds(getLocalBounds());
}

auto PetalAudioProcessorEditor::getResource(const juce::String& url) -> std::optional<juce::WebBrowserComponent::Resource>
{
    const auto resourceToRetrieve = url == "/" ? juce::String("index.html") : url.fromFirstOccurrenceOf("/", false, false);

    for (int i = 0; i < PetalUIData::namedResourceListSize; ++i)
    {
        const auto* symbolName = PetalUIData::namedResourceList[i];
        const auto* originalFilename = PetalUIData::getNamedResourceOriginalFilename(symbolName);

        if (originalFilename == nullptr || resourceToRetrieve != originalFilename)
            continue;

        int dataSizeInBytes = 0;
        const auto* data = PetalUIData::getNamedResource(symbolName, dataSizeInBytes);

        if (data == nullptr)
            return std::nullopt;

        const auto* bytes = reinterpret_cast<const std::byte*>(data);
        const auto extension = resourceToRetrieve.fromLastOccurrenceOf(".", false, false);
        return juce::WebBrowserComponent::Resource{
            std::vector<std::byte>(bytes, bytes + dataSizeInBytes),
            getMimeForExtension(extension)};
    }

    return std::nullopt;
}

void PetalAudioProcessorEditor::timerCallback()
{
    if (webview == nullptr)
        return;

    juce::var delayTimesL{juce::Array<juce::var>()};
    juce::var delayTimesR{juce::Array<juce::var>()};
    juce::var amplitudesL{juce::Array<juce::var>()};
    juce::var amplitudesR{juce::Array<juce::var>()};
    juce::var tapStates{juce::Array<juce::var>()};
    juce::var reverbLevelMsr;

    for (int tap = 0; tap < 8; tap++){
        delayTimesL.append(audioProcessor.petal.delayTimesL[tap].load());
        delayTimesR.append(audioProcessor.petal.delayTimesR[tap].load());
        amplitudesL.append(audioProcessor.petal.amplitudesL[tap].load());
        amplitudesR.append(audioProcessor.petal.amplitudesR[tap].load());
        tapStates.append(audioProcessor.petal.tapStates[tap].load());
    }
    reverbLevelMsr = audioProcessor.petal.rvb.reverbLevelMsr.load();

    webview->emitEventIfBrowserIsVisible("delayTimesL", juce::JSON::toString(delayTimesL));
    webview->emitEventIfBrowserIsVisible("delayTimesR", juce::JSON::toString(delayTimesR));
    webview->emitEventIfBrowserIsVisible("amplitudesL", juce::JSON::toString(amplitudesL));
    webview->emitEventIfBrowserIsVisible("amplitudesR", juce::JSON::toString(amplitudesR));
    webview->emitEventIfBrowserIsVisible("reverbLevelMsr", juce::JSON::toString(reverbLevelMsr));
    webview->emitEventIfBrowserIsVisible("tapStates", juce::JSON::toString(tapStates));
}