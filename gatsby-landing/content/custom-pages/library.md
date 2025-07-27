---
title: "Component Library"
template: LibraryPage
image: "/images/about-us.jpg"
page_builder:
  - type: "section"
    title: "Page Builder Component Library"
    subtitle: "A demonstration of available components"
    text: "This page showcases the various components available through the Page Builder. Each section below is a different component type that can be configured and arranged to build custom pages."
    textPosition: "center"

  - type: "hero"
    hero:
      heading:
        level: 1
        text: "Hero 1: Image Background, No Form"
      subHeading:
        text: "This hero showcases a background image, headings, and a text slider with a button."
      background:
        image: "/images/about-us.jpg"
      textSlider:
        heading: "Lorem Ipsum Dolor"
        content: "Mussum Ipsum, cacilds vidis litro abertis."
        button:
          label: "Learn More"
          link: "#"

  - type: "hero"
    hero:
      heading:
        level: 2
        text: "Hero 2: Two-Column Layout with Form"
      subHeading:
        text: "This hero has text on the left and a form on the right, with a background image."
      background:
        image: "/images/about-us.jpg"
      form:
        formType: "jotform"
        formData:
          formId: "TWO_COLUMN_JOTFORM_ID"

  - type: "hero"
    hero:
      heading:
        level: 2
        text: "Hero 3: Centered Layout with Form"
      subHeading:
        text: "This hero has the heading, subheading, and form all centered and stacked vertically."
      textPosition: "center"
      background:
        image: "/images/about-us.jpg"
      form:
        formType: "jotform"
        formData:
          formId: "CENTERED_JOTFORM_ID"

  - type: "hero"
    hero:
      heading:
        level: 2
        text: "Hero 4: Simple Gradient Hero"
      subHeading:
        text: "This is the simple hero version that uses the default gradient background."

  - type: "section"
    title: "Section: Boxed Layout"
    subtitle: "STANDARD CENTERED SECTION"
    text: "Mussum Ipsum, cacilds vidis litro abertis. Admodum accumsan disputationi eu sit. Vide electram sadipscing et per. Em pé sem cair, deitado sem dormir, sentado sem cochilar e fazendo pose."
    textPosition: "center"

  - type: "section"
    title: "Section: Two-Column (Image on Right)"
    subtitle: "ALTERNATING BACKGROUND"
    text: "Mussum Ipsum, cacilds vidis litro abertis. Mé faiz elementum girarzis, nisi eros vermeio. Todo mundo vê os porris que eu tomo, mas ninguém vê os tombis que eu levo! A ordem dos tratores não altera o pão duris."
    imageUrl: "/images/about-us.jpg"
    textPosition: "left"
    sectionId: "section-demo-1"

  - type: "section"
    title: "Section: Two-Column (Image on Left)"
    subtitle: "NORMAL BACKGROUND"
    text: "Mussum Ipsum, cacilds vidis litro abertis. Praesent malesuada urna nisi, quis volutpat erat hendrerit non. Nam vulputate dapibus. Si u mundo tá muito paradis? Toma um mé que o mundo vai girarzis!"
    imageUrl: "/images/about-us.jpg"
    textPosition: "right"
    sectionId: "section-demo-2"

  - type: "section"
    title: "Section: Two-Column with BG Image (Right)"
    subtitle: "FULL WIDTH BACKGROUND IMAGE"
    text: "This is the new section type. The image on the right is a full-height background for its column. Mussum Ipsum, cacilds vidis litro abertis."
    imageUrl: "/images/about-us.jpg"
    textPosition: "left"
    settings:
      layout: "two-columns"
      imageWidth: "full"
      imageSide: "right"

  - type: "section"
    title: "Section: Two-Column with BG Image (Left)"
    subtitle: "FULL WIDTH BACKGROUND IMAGE"
    text: "This is the same new section type, but with the image on the left. A ordem dos tratores não altera o pão duris."
    imageUrl: "/images/about-us.jpg"
    textPosition: "right"
    settings:
      layout: "two-columns"
      imageWidth: "full"
      imageSide: "left"

  - type: "boxes"
    title: "Boxes Component"
    subtitle: "SHOWCASING A 3-COLUMN GRID"
    boxes:
      - title: "Box One"
        text: "Suco de cevadiss, é um leite divinis, qui tem lupuliz, matis, aguis e fermentis."
        icon: "building"
      - title: "Box Two"
        text: "Interessantiss quisso pudia ce receita de bolis, mais bolis eu num gostis."
        icon: "industrial"
      - title: "Box Three"
        text: "Manduma pindureta quium dia nois paga."
        icon: "home"

  - type: "map"
    map:
      src: "https://maps.google.com/maps?q=Toronto&t=&z=13&ie=UTF8&iwloc=&output=embed"
      title: "Map Component Demonstration"

  - type: "testimonials"
    testimonials:
      title: "Testimonials Carousel (from Page Builder)"
---

## Styled Markdown Content

This content is in the markdown body. Because the `page_builder` is populated, this area automatically gets the special "pre-pre-footer" styling, making it ideal for closing remarks or secondary information.

- List item one
- List item two

> A blockquote for good measure. Mussum Ipsum, cacilds vidis litro abertis.
