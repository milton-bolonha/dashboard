export interface ArchitectureNode {
  id: string;
  name: string;
  type: string;
  file?: string;
  component?: string;
  props?: Record<string, unknown>;
  children?: ArchitectureNode[];
}

export interface ArchitectureData {
  name: string;
  path: string;
  component: string;
  file: string;
  children: ArchitectureNode[];
}

export const SYSTEM_ARCHITECTURE: Record<string, ArchitectureData> = {
  home: {
    name: "Home",
    path: "/",
    component: "HomeContainer",
    file: "src/containers/home/HomeContainer.tsx",
    children: [
      {
        id: "header",
        name: "LandingHeader",
        type: "component",
        file: "src/components/landing/LandingHeader.tsx",
        children: [
          {
            id: "logo",
            name: "logo",
            type: "element",
            component: "Image",
            props: {},
          },
          {
            id: "btn-login",
            name: "btn-login",
            type: "element",
            component: "SignInButton",
            props: {},
          },
          {
            id: "btn-signup",
            name: "btn-signup",
            type: "element",
            component: "SignUpButton",
            props: {},
          },
        ],
      },
      {
        id: "form",
        name: "ClassicHeroForm",
        type: "component",
        file: "src/components/landing/ClassicHeroForm.tsx",
        children: [
          {
            id: "input-company-name",
            name: "input-company-name",
            type: "input",
            props: { placeholder: "Company name" },
          },
          {
            id: "input-website",
            name: "input-website",
            type: "input",
            props: { placeholder: "Website URL" },
          },
          {
            id: "select-template",
            name: "select-template",
            type: "select",
            props: { options: ["template_1", "template_2"] },
          },
          {
            id: "btn-generate",
            name: "btn-generate",
            type: "button",
            props: { onClick: "handleSubmit" },
          },
        ],
      },
      {
        id: "footer",
        name: "LandingFooter",
        type: "component",
        file: "src/components/landing/LandingFooter.tsx",
        children: [],
      },
    ],
  },
  admin: {
    name: "Admin",
    path: "/admin",
    component: "AdminContainer",
    file: "src/containers/admin/AdminContainer.tsx",
    children: [
      {
        id: "shell",
        name: "AdminShellAde",
        type: "layout",
        file: "src/components/admin/ade/AdminShellAde.tsx",
        children: [
          {
            id: "sidebar",
            name: "AdminSidebarAde",
            type: "component",
            file: "src/components/admin/ade/AdminSidebarAde.tsx",
            children: [
              { id: "menu-header", name: "menu-header", type: "section" },
              {
                id: "credit-links",
                name: "credit-links",
                type: "section",
                children: [
                  {
                    id: "coins-display",
                    name: "coins-display",
                    type: "element",
                  },
                ],
              },
              {
                id: "companies-list",
                name: "companies-list",
                type: "section",
                children: [
                  {
                    id: "company-item",
                    name: "company-item",
                    type: "component",
                    props: { badge: "dashboard-count" },
                  },
                ],
              },
              {
                id: "contacts-section",
                name: "contacts-section",
                type: "section",
                children: [
                  {
                    id: "btn-add-contact",
                    name: "btn-add-contact",
                    type: "button",
                  },
                ],
              },
              { id: "bottom-links", name: "bottom-links", type: "section" },
            ],
          },
          {
            id: "header",
            name: "AdminHeaderAde",
            type: "component",
            file: "src/components/admin/ade/AdminHeaderAde.tsx",
            children: [
              { id: "workspace-name", name: "workspace-name", type: "text" },
              {
                id: "dashboard-selector",
                name: "dashboard-selector",
                type: "dropdown",
              },
              {
                id: "btn-create-blank-dashboard",
                name: "btn-create-blank-dashboard",
                type: "button",
              },
              { id: "btn-templates", name: "btn-templates", type: "button" },
              {
                id: "btn-customize-background",
                name: "btn-customize-background",
                type: "button",
              },
              {
                id: "btn-save-template",
                name: "btn-save-template",
                type: "button",
              },
              { id: "btn-login", name: "btn-login", type: "button" },
              { id: "btn-signup", name: "btn-signup", type: "button" },
            ],
          },
          {
            id: "main",
            name: "main",
            type: "section",
            children: [
              {
                id: "tiles-grid",
                name: "TileGridAde",
                type: "component",
                file: "src/containers/admin/ade/TileGridAde.tsx",
                children: [
                  {
                    id: "btn-add-prompt",
                    name: "btn-add-prompt",
                    type: "button",
                  },
                  {
                    id: "tile-card",
                    name: "tile-card",
                    type: "component",
                    props: { repeat: true },
                    children: [
                      { id: "tile-title", name: "title", type: "text" },
                      { id: "tile-content", name: "content", type: "text" },
                      { id: "btn-drag", name: "btn-drag", type: "button" },
                      {
                        id: "btn-regenerate",
                        name: "btn-regenerate",
                        type: "button",
                      },
                      { id: "btn-delete", name: "btn-delete", type: "button" },
                    ],
                  },
                ],
              },
              {
                id: "contacts-panel",
                name: "ContactsPanelAde",
                type: "component",
                file: "src/containers/admin/ade/ContactsPanelAde.tsx",
                children: [
                  {
                    id: "btn-add-contact",
                    name: "btn-add-contact",
                    type: "button",
                  },
                  {
                    id: "contact-card",
                    name: "contact-card",
                    type: "component",
                    props: { repeat: true },
                    children: [
                      { id: "contact-name", name: "name", type: "text" },
                      { id: "contact-role", name: "role", type: "text" },
                      {
                        id: "btn-regenerate-outreach",
                        name: "btn-regenerate-outreach",
                        type: "button",
                      },
                      { id: "btn-delete", name: "btn-delete", type: "button" },
                    ],
                  },
                ],
              },
              {
                id: "notes-panel",
                name: "NotesPanelAde",
                type: "component",
                file: "src/containers/admin/ade/NotesPanelAde.tsx",
                children: [
                  { id: "btn-add-note", name: "btn-add-note", type: "button" },
                  {
                    id: "form-note",
                    name: "form-note",
                    type: "form",
                    props: { inline: true },
                  },
                  {
                    id: "note-card",
                    name: "note-card",
                    type: "component",
                    props: { repeat: true },
                    children: [
                      {
                        id: "note-header",
                        name: "header",
                        type: "section",
                        props: { color: "orange" },
                      },
                      { id: "note-title", name: "title", type: "text" },
                      {
                        id: "note-content",
                        name: "content",
                        type: "text",
                        props: { bg: "white" },
                      },
                      { id: "btn-edit", name: "btn-edit", type: "button" },
                      { id: "btn-delete", name: "btn-delete", type: "button" },
                    ],
                  },
                ],
              },
              {
                id: "files-placeholder",
                name: "FilesPlaceholderAde",
                type: "component",
                file: "src/containers/admin/ade/FilesPlaceholderAde.tsx",
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "modals",
        name: "modals",
        type: "section",
        children: [
          { id: "AddPromptModal", name: "AddPromptModal", type: "modal" },
          { id: "AddContactModal", name: "AddContactModal", type: "modal" },
          { id: "AddCompanyModal", name: "AddCompanyModal", type: "modal" },
          {
            id: "ContactDetailModal",
            name: "ContactDetailModal",
            type: "modal",
          },
          { id: "TileDetailModal", name: "TileDetailModal", type: "modal" },
          {
            id: "CreateBlankDashboardModal",
            name: "CreateBlankDashboardModal",
            type: "modal",
          },
          {
            id: "DashboardConfigModal",
            name: "DashboardConfigModal",
            type: "modal",
          },
          {
            id: "TemplateEditorModal",
            name: "TemplateEditorModal",
            type: "modal",
          },
        ],
      },
    ],
  },
};

