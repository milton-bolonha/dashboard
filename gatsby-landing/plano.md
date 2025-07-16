# Plano de Desenvolvimento - Gatsby Landing Page

## Arquitetura Geral

### Padrão Container/Component

- **Containers**: Contêm toda a lógica, estado e dados
- **Dumb Components**: Apenas visual, recebem props e renderizam
- **Estrutura**: `<Container atributoProps="" />`
- **Dados**: Props agrupadas em `{ data: {...}, position: {...}, order: number }`

---

## 1. TOPBAR

### Container: `TopBarContainer`

```jsx
<TopBarContainer
  marquee={{
    data: { active: boolean, speed: number },
    order: number,
  }}
  content={{
    data: { texto: unsafeHTML },
    order: number,
  }}
/>
```

### Component: `TopBar`

- **Props**: `marquee, content`
- **Fallbacks**: Não quebra se props estiverem vazias

---

## 2. HEADER

### Container: `HeaderContainer`

```jsx
<HeaderContainer
  columns={["1/2", "2/1", "1/5/1"]}
  logo={{
    data: { src: string, alt: string, badges: array },
    position: {
      horizontal: "left|center|right",
      vertical: "top|bottom|center|same",
    },
    order: number,
  }}
  menu={{
    data: { items: array },
    position: {
      horizontal: "left|center|right",
      vertical: "top|bottom|center|same",
    },
    order: number,
  }}
  contact={{
    data: [{ icon: string, text: string }],
    position: {
      horizontal: "left|center|right",
      vertical: "top|bottom|center|same",
    },
    order: number,
  }}
/>
```

### Component: `Header`

- **Props**: `columns, logo, menu, contact`
- **Lógica do Container**:
  - Ordenamento baseado na prop `order`
  - `vertical: "same"` = mesma linha, `center` = centro vertical
  - Fallbacks para props não populadas

---

## 3. HERO

### Container: `HeroContainer`

```jsx
<HeroContainer
  background={{
    data: { image: string, overlay: boolean },
    order: number,
  }}
  heading={{
    data: { text: string, level: number },
    order: number,
  }}
  subHeading={{
    data: { text: string },
    order: number,
  }}
  textSlider={{
    data: {
      heading: string,
      content: unsafeHTML,
      button: { label: string, link: string },
    },
    order: number,
  }}
  form={{
    data: {
      heading: string,
      subheading: string,
      postFormContent: string | image,
      formType: "jotform|iframe|unsafeHTML",
      formData: object,
    },
    order: number,
  }}
/>
```

### Component: `Hero`

- **Props**: `background, heading, subHeading, textSlider, form`
- **Ordenamento**: Baseado em `order`

---

## 4. MAIN SECTIONS

### Container: `MainSectionsContainer`

```jsx
<MainSectionsContainer
  columns={["1/2", "2/1", "1/5/1"]}
  sections={[
    {
      data: {
        preHeading: { text: string },
        heading: { text: string },
        subHeading: { text: string },
        paragraph: { text: string },
        button: { label: string, link: string },
        ctaButton: { label: string, link: string },
        image: { src: string, alt: string },
        backgroundImage: { src: string },
      },
      position: {
        horizontal: "left|center|right",
        vertical: "top|bottom|center|same",
      },
      order: number,
    },
  ]}
/>
```

### Component: `MainSections`

- **Props**: `columns, sections`
- **Ordenamento**: Cada seção tem sua ordem interna e externa

---

## Estrutura de Pastas Atualizada

```
/
├── content/
│   ├── topbar.json
│   ├── header.json
│   ├── hero.json
│   └── sections.json
├── src/
│   ├── components/
│   │   ├── TopBar.js
│   │   ├── Header.js
│   │   ├── Hero.js
│   │   └── MainSections.js
│   ├── containers/
│   │   ├── TopBarContainer.js
│   │   ├── HeaderContainer.js
│   │   ├── HeroContainer.js
│   │   └── MainSectionsContainer.js
│   ├── pages/
│   │   └── index.js
│   └── styles/
│       └── global.css
```

---

## Implementação na Index Atualizada

```jsx
// src/pages/index.js
import TopBarContainer from "../containers/TopBarContainer";
import HeaderContainer from "../containers/HeaderContainer";
import HeroContainer from "../containers/HeroContainer";
import MainSectionsContainer from "../containers/MainSectionsContainer";

// Dados virão dos JSONs
import topbarData from "../../content/topbar.json";
import headerData from "../../content/header.json";
import heroData from "../../content/hero.json";
import sectionsData from "../../content/sections.json";

const IndexPage = () => {
  return (
    <main>
      <TopBarContainer {...topbarData} />
      <HeaderContainer {...headerData} />
      <HeroContainer {...heroData} />
      <MainSectionsContainer {...sectionsData} />
    </main>
  );
};
```

---

## Próximos Passos

1. **Criar pasta /content com JSONs**
2. **Implementar estrutura de pastas**
3. **Criar containers com lógica de ordenamento**
4. **Implementar dumb components**
5. **Configurar fallbacks para props vazias**
6. **Implementar estilos com Tailwind**

---

## Características Importantes

- **Props agrupadas**: `{ data, position, order }`
- **Ordenamento automático**: Baseado na prop `order`
- **Posicionamento inteligente**: `vertical: "same"` para mesma linha
- **Componentes robustos**: Não quebram sem props
- **Dados externalizados**: JSONs na pasta `/content`
