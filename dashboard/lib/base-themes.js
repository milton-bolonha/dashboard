// Temas predefinidos do sistema
export const BASE_THEMES = {
  sales: {
    id: "sales-assistant",
    name: "Sales Assistant",
    slug: "sales",
    description: "Research companies and generate personalized outreach",
    icon: "💼",
    colors: {
      primary: "#6B7280", // Cinza
      secondary: "#3B82F6",
      background: "#ffffff",
      chatBubble: "#F3F4F6",
    },
    entities: [
      {
        id: "company",
        name: "Company",
        namePlural: "Companies",
        icon: "🏢",
        isPrimary: true,
        fields: [
          { id: "name", label: "Company Name", type: "text", required: true },
          { id: "website", label: "Website", type: "url", required: true },
          { id: "description", label: "Description", type: "textarea" },
        ],
        children: [{ entityId: "contact", relationship: "one-to-many" }],
      },
      {
        id: "contact",
        name: "Contact",
        namePlural: "Contacts",
        icon: "👤",
        isPrimary: false,
        fields: [
          { id: "name", label: "Name", type: "text", required: true },
          { id: "role", label: "Role", type: "text" },
          { id: "email", label: "Email", type: "text" },
        ],
      },
    ],
    tileTemplates: [
      {
        id: "company_description",
        title: "What They Do",
        prompt: "Succinctly describe what {company.name} does. Provide a clear, concise overview of their business, products, and services.",
        category: "basic",
        order: 1,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "revenue_model",
        title: "Revenue Generation",
        prompt: "How does {company.name} generate revenue? Explain their business model, revenue streams, and monetization strategies.",
        category: "financial",
        order: 2,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "ceo_email",
        title: "CEO Sales Email",
        prompt: "Based on what we know about {company.name}, write a sales email to their CEO pitching our solution. Needs to make reference to their business goals. Must include bullet points. Maximum 120 words.",
        category: "sales",
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
    ],
    landingTags: [
      {
        id: "company",
        label: "Company",
        icon: "Briefcase",
        placeholder: "I am a sales rep at...",
        tooltip: "Which company do you represent?",
        type: "text",
        order: 1,
        mapToEntity: "workspace",
        mapToField: "salesRepAt",
      },
      {
        id: "solution",
        label: "Solution",
        icon: "Zap",
        placeholder: "I am selling solutions for...",
        tooltip: "What are you selling?",
        type: "text",
        order: 2,
        mapToEntity: "workspace",
        mapToField: "sellingSolutionsFor",
      },
      {
        id: "target",
        label: "Research Target",
        icon: "Target",
        placeholder: "Company name to research",
        tooltip: "Which company do you want to research?",
        type: "text",
        order: 3,
        mapToEntity: "company",
        mapToField: "name",
      },
      {
        id: "targetWebsite",
        label: "Target Website",
        icon: "Globe",
        placeholder: "www.targetcompany.com",
        tooltip: "Target company's website URL",
        type: "url",
        order: 4,
        mapToEntity: "company",
        mapToField: "website",
      },
    ],
    config: {
      allowMultipleMainEntities: true,
      defaultView: "grid",
      features: ["ai-generation", "file-upload", "notes"],
    },
    isDefault: true,
    isActive: true,
  },
  
  bookCreator: {
    id: "book-creator",
    name: "Book Creator",
    slug: "book-creator",
    description: "Create books with AI-powered chapters and characters",
    icon: "📚",
    colors: {
      primary: "#8B5CF6", // Roxo
      secondary: "#EC4899",
      background: "#FEF3C7",
      chatBubble: "#F5F3FF",
    },
    entities: [
      {
        id: "book",
        name: "Book",
        namePlural: "Books",
        icon: "📖",
        isPrimary: true,
        fields: [
          { id: "title", label: "Book Title", type: "text", required: true },
          { id: "genre", label: "Genre", type: "text" },
          { id: "synopsis", label: "Synopsis", type: "textarea" },
        ],
        children: [
          { entityId: "chapter", relationship: "one-to-many" },
          { entityId: "character", relationship: "one-to-many" },
        ],
      },
      {
        id: "chapter",
        name: "Chapter",
        namePlural: "Chapters",
        icon: "📄",
        isPrimary: false,
        fields: [
          { id: "title", label: "Chapter Title", type: "text", required: true },
          { id: "summary", label: "Summary", type: "textarea" },
          { id: "content", label: "Content", type: "textarea" },
        ],
      },
      {
        id: "character",
        name: "Character",
        namePlural: "Characters",
        icon: "🎭",
        isPrimary: false,
        fields: [
          { id: "name", label: "Name", type: "text", required: true },
          { id: "role", label: "Role", type: "text" },
          { id: "backstory", label: "Backstory", type: "textarea" },
        ],
      },
    ],
    tileTemplates: [
      {
        id: "chapter_generator",
        title: "Generate Chapter",
        prompt: "Write chapter {chapter.number} for {book.title} about {chapter.summary}. Use the hero's journey structure and develop the main characters.",
        category: "content",
        order: 1,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "character_development",
        title: "Character Development",
        prompt: "Develop character {character.name} in {book.title}. Create a compelling backstory, motivations, and character arc for this {character.role}.",
        category: "character",
        order: 2,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "plot_synopsis",
        title: "Plot Synopsis",
        prompt: "Write a detailed plot synopsis for {book.title} including the main conflict, rising action, climax, and resolution.",
        category: "structure",
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
    ],
    landingTags: [
      {
        id: "bookTitle",
        label: "Book Title",
        icon: "Book",
        placeholder: "What's your book title?",
        tooltip: "Enter the title of your book",
        type: "text",
        order: 1,
        mapToEntity: "book",
        mapToField: "title",
      },
      {
        id: "genre",
        label: "Genre",
        icon: "Sparkles",
        placeholder: "Fantasy, Romance, Thriller...",
        tooltip: "What genre is your book?",
        type: "text",
        order: 2,
        mapToEntity: "book",
        mapToField: "genre",
      },
      {
        id: "couple",
        label: "Main Characters",
        icon: "Users",
        placeholder: "The main couple or protagonists",
        tooltip: "Who are the main characters?",
        type: "text",
        order: 3,
        mapToEntity: "character",
        mapToField: "name",
      },
      {
        id: "theme",
        label: "Theme/Concept",
        icon: "Lightbulb",
        placeholder: "The central theme or concept",
        tooltip: "What is the main theme of your book?",
        type: "text",
        order: 4,
        mapToEntity: "book",
        mapToField: "synopsis",
      },
    ],
    config: {
      allowMultipleMainEntities: true,
      defaultView: "list",
      features: ["ai-generation", "file-upload", "notes"],
    },
    isDefault: false,
    isActive: true,
  },
  
  construction: {
    id: "construction-manager",
    name: "Construction Manager",
    slug: "construction",
    description: "Manage construction projects, equipment and workers",
    icon: "🏗️",
    colors: {
      primary: "#F59E0B", // Laranja
      secondary: "#10B981",
      background: "#FEF3C7",
      chatBubble: "#FEF3C7",
    },
    entities: [
      {
        id: "project",
        name: "Project",
        namePlural: "Projects",
        icon: "🏗️",
        isPrimary: true,
        fields: [
          { id: "name", label: "Project Name", type: "text", required: true },
          { id: "location", label: "Location", type: "text" },
          { id: "startDate", label: "Start Date", type: "date" },
        ],
        children: [
          { entityId: "equipment", relationship: "one-to-many" },
          { entityId: "worker", relationship: "one-to-many" },
          { entityId: "worklog", relationship: "one-to-many" },
        ],
      },
      {
        id: "equipment",
        name: "Equipment",
        namePlural: "Equipment",
        icon: "🚜",
        isPrimary: false,
        fields: [
          { id: "name", label: "Equipment Name", type: "text", required: true },
          { id: "type", label: "Type", type: "text" },
          { id: "status", label: "Status", type: "text" },
        ],
      },
      {
        id: "worker",
        name: "Worker",
        namePlural: "Workers",
        icon: "👷",
        isPrimary: false,
        fields: [
          { id: "name", label: "Name", type: "text", required: true },
          { id: "role", label: "Role/Position", type: "text" },
          { id: "certification", label: "Certification", type: "text" },
        ],
      },
      {
        id: "worklog",
        name: "Work Log",
        namePlural: "Work Logs",
        icon: "📋",
        isPrimary: false,
        fields: [
          { id: "date", label: "Date", type: "date", required: true },
          { id: "equipmentUsed", label: "Equipment Used", type: "text" },
          { id: "beforePhoto", label: "Before Photo", type: "image" },
          { id: "afterPhoto", label: "After Photo", type: "image" },
          { id: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
    tileTemplates: [
      {
        id: "equipment_report",
        title: "Equipment Usage Report",
        prompt: "Generate a comprehensive report for {equipment.name} usage on {project.name}. Include status, hours of operation, maintenance needs, and any safety concerns.",
        category: "report",
        order: 1,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "before_after_analysis",
        title: "Before/After Analysis",
        prompt: "Analyze the before and after photos from {worklog.date} for {project.name}. Describe the work completed, equipment used ({worklog.equipmentUsed}), and any issues or improvements observed.",
        category: "analysis",
        order: 2,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "daily_work_summary",
        title: "Daily Work Summary",
        prompt: "Create a daily work summary for {project.name} on {worklog.date}. Include work completed, equipment and crew involved ({worklog.notes}), safety observations, and progress toward project milestones.",
        category: "report",
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
    ],
    landingTags: [
      {
        id: "projectName",
        label: "Project",
        icon: "HardHat",
        placeholder: "What project are you working on?",
        tooltip: "Enter your construction project name",
        type: "text",
        order: 1,
        mapToEntity: "project",
        mapToField: "name",
      },
      {
        id: "role",
        label: "Your Role",
        icon: "User",
        placeholder: "Your role (worker, operator, supervisor...)",
        tooltip: "What is your position in the project?",
        type: "text",
        order: 2,
        mapToEntity: "worker",
        mapToField: "role",
      },
      {
        id: "location",
        label: "Project Location",
        icon: "MapPin",
        placeholder: "Project location/address",
        tooltip: "Where is the project located?",
        type: "text",
        order: 3,
        mapToEntity: "project",
        mapToField: "location",
      },
      {
        id: "equipmentType",
        label: "Primary Equipment",
        icon: "Wrench",
        placeholder: "Main equipment you'll manage",
        tooltip: "What equipment will you be tracking?",
        type: "text",
        order: 4,
        mapToEntity: "equipment",
        mapToField: "type",
      },
    ],
    config: {
      allowMultipleMainEntities: true,
      defaultView: "list",
      features: ["ai-generation", "file-upload", "notes", "photo-tracking"],
    },
    isDefault: false,
    isActive: true,
  },
};

// Função para seed de temas no MongoDB
export async function seedBaseThemes(dbClient) {
  console.log('🌱 Seeding base themes...');
  
  for (const theme of Object.values(BASE_THEMES)) {
    try {
      await dbClient.updateOne(
        "themes",
        { id: theme.id },
        { $set: theme },
        { upsert: true }
      );
      console.log(`✅ Theme seeded: ${theme.name}`);
    } catch (error) {
      console.error(`❌ Error seeding theme ${theme.id}:`, error);
    }
  }
  
  console.log('✅ All themes seeded successfully!');
}
