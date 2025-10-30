import DynamicHeroSectionContainer from "./containers/DynamicHeroSectionContainer";
import DynamicHeroPresenter from "./hero/DynamicHeroPresenter";

export default function DynamicHeroSection({
  mode = "landing",
  onCreateWorkspace,
}) {
  return (
    <DynamicHeroSectionContainer
      mode={mode}
      onCreateWorkspace={onCreateWorkspace}
    >
      {(props) => <DynamicHeroPresenter {...props} />}
    </DynamicHeroSectionContainer>
  );
}
