import HeroSectionContainer from "./containers/HeroSectionContainer";
import HeroPresenter from "./hero/HeroPresenter";

/**
 * ClassicHero: Formulário tradicional com 5 inputs progressivos
 *
 * ⭐ ATUALIZADO: Agora usa themeId="sales-assistant" em vez de template_id
 * Os campos são mapeados automaticamente para o tema:
 * - company → company (salesRepAt)
 * - companyWebsite → companyWebsite (campo extra)
 * - solution → solution (sellingSolutionsFor)
 * - researchTarget → target (company.name)
 * - researchWebsite → targetWebsite (company.website)
 *
 * @param {Object} props
 * @param {string} props.mode - "landing" ou "create-workspace"
 * @param {Function} props.onCreateWorkspace - Callback para criar workspace (modo create-workspace)
 * @param {string} props.styleMode - "default" ou "transparent" (estilo visual dos inputs)
 */
export default function HeroSection({
  mode = "landing",
  onCreateWorkspace,
  styleMode = "default",
}) {
  return (
    <HeroSectionContainer
      mode={mode}
      onCreateWorkspace={onCreateWorkspace}
      styleMode={styleMode}
    >
      {(props) => <HeroPresenter {...props} />}
    </HeroSectionContainer>
  );
}
