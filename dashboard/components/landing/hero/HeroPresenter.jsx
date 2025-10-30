import { ArrowRight } from "lucide-react";
import HeroInput from "./HeroInput";
import HeroInputIcon from "./HeroInputIcon";
import AutoLoadingModal from "../AutoLoadingModal";

export default function HeroPresenter({
  inputs,
  inputStates,
  creating,
  error,
  allValid,
  styleMode,
  canEnableInput,
  handleInputChange,
  handleInputFocus,
  handleInputBlur,
  handleAction,
  handleKeyDown,
}) {
  const getPlaceholderText = (inputName) => {
    const placeholders = {
      company: "I am a sales rep at",
      companyWebsite: "My company website (e.g., www.microsoft.com)",
      solution: "I am selling solutions for",
      researchTarget: "I want to research this company",
      researchWebsite: "Company website to research (e.g., www.tesla.com)",
    };
    return placeholders[inputName] || "";
  };

  const renderInputIcon = (inputName, isLastInput) => (
    <HeroInputIcon
      state={inputStates[inputName]}
      isEnabled={canEnableInput(inputName)}
      isLastInput={isLastInput}
      allInputsValid={allValid}
      styleMode={styleMode}
      creating={creating}
      onSubmit={handleAction}
    />
  );

  return (
    <section
      className="h-full flex items-center justify-center"
      style={{ backgroundColor: "#fcfcf9" }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes bouncePulse {
            0% { transform: translateY(0); }
            5% { transform: translateY(-8px); }
            10% { transform: translateY(0); }
            15% { transform: translateY(-4px); }
            20% { transform: translateY(0); }
            100% { transform: translateY(0); }
          }
        `,
        }}
      />
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-4 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black tracking-tight mb-4 mt-30">
          Smarter Research. Faster Outreach. More Selling
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          WebApp is your personal research assistant that works even when you
          sleep
        </p>

        <div className="space-y-4 mb-8">
          <div className="max-w-2xl mx-auto relative">
            <HeroInput
              name="company"
              value={inputs.company}
              placeholder={getPlaceholderText("company")}
              state={inputStates.company}
              styleMode={styleMode}
              onValueChange={(val) => handleInputChange("company", val)}
              onFocus={() => handleInputFocus("company")}
              onBlur={() => handleInputBlur("company")}
              onKeyDown={(e) => handleKeyDown("company", e)}
              renderIcon={renderInputIcon}
            />
          </div>

          <div className="max-w-2xl mx-auto relative">
            <HeroInput
              name="companyWebsite"
              type="url"
              value={inputs.companyWebsite}
              placeholder={getPlaceholderText("companyWebsite")}
              disabled={!canEnableInput("companyWebsite")}
              state={inputStates.companyWebsite}
              styleMode={styleMode}
              onValueChange={(val) => handleInputChange("companyWebsite", val)}
              onFocus={() => handleInputFocus("companyWebsite")}
              onBlur={() => handleInputBlur("companyWebsite")}
              onKeyDown={(e) => handleKeyDown("companyWebsite", e)}
              renderIcon={renderInputIcon}
            />
          </div>

          <div className="max-w-2xl mx-auto relative">
            <HeroInput
              name="solution"
              value={inputs.solution}
              placeholder={getPlaceholderText("solution")}
              disabled={!canEnableInput("solution")}
              state={inputStates.solution}
              styleMode={styleMode}
              onValueChange={(val) => handleInputChange("solution", val)}
              onFocus={() => handleInputFocus("solution")}
              onBlur={() => handleInputBlur("solution")}
              onKeyDown={(e) => handleKeyDown("solution", e)}
              renderIcon={renderInputIcon}
            />
          </div>

          <div className="max-w-2xl mx-auto relative">
            <HeroInput
              name="researchTarget"
              value={inputs.researchTarget}
              placeholder={getPlaceholderText("researchTarget")}
              disabled={!canEnableInput("researchTarget")}
              state={inputStates.researchTarget}
              styleMode={styleMode}
              onValueChange={(val) => handleInputChange("researchTarget", val)}
              onFocus={() => handleInputFocus("researchTarget")}
              onBlur={() => handleInputBlur("researchTarget")}
              onKeyDown={(e) => handleKeyDown("researchTarget", e)}
              renderIcon={renderInputIcon}
            />
          </div>

          <div className="max-w-2xl mx-auto relative">
            <HeroInput
              name="researchWebsite"
              type="url"
              value={inputs.researchWebsite}
              placeholder={getPlaceholderText("researchWebsite")}
              disabled={!canEnableInput("researchWebsite")}
              state={inputStates.researchWebsite}
              styleMode={styleMode}
              isLastInput={true}
              onValueChange={(val) => handleInputChange("researchWebsite", val)}
              onFocus={() => handleInputFocus("researchWebsite")}
              onBlur={() => handleInputBlur("researchWebsite")}
              onKeyDown={(e) => handleKeyDown("researchWebsite", e)}
              renderIcon={renderInputIcon}
            />
          </div>
        </div>

        <p className="text-lg text-black mb-6">
          Ask WebApp research your whole territory for you
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleAction}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Connect CRM</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={handleAction}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Upload CSV</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Botão Reset para Debug */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={async () => {
              if (!confirm("Reset all data?")) return;
              try {
                await fetch("/api/guest/reset", { method: "DELETE" });
                alert("Reset successful! Refreshing page...");
                window.location.reload();
              } catch (err) {
                alert("Reset failed: " + err.message);
              }
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            🗑️ Reset Guest Session (DEBUG)
          </button>
        </div>
      </div>

      <AutoLoadingModal isOpen={creating} />
    </section>
  );
}
