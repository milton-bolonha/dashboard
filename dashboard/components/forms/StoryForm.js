import { useState } from "react";
import { Input } from "../ui/Input";
import Button from "../ui/Button";
import { Card } from "../ui/Card";

export function StoryForm({
  story = {},
  onSubmit,
  loading = false,
  currentStep = 1,
  onStepChange,
}) {
  const [formData, setFormData] = useState({
    title: story.title || "",
    partner1: {
      name: story.partner1?.name || "",
      age: story.partner1?.age || "",
      bio: story.partner1?.bio || "",
    },
    partner2: {
      name: story.partner2?.name || "",
      age: story.partner2?.age || "",
      bio: story.partner2?.bio || "",
    },
    howWeMet: story.howWeMet || "",
    firstDate: story.firstDate || "",
    ...story,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePartner = (partner, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [partner]: { ...prev[partner], [field]: value },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {currentStep === 1 && (
        <Card title="Detalhes da História" variant="romantic">
          <div className="space-y-4">
            <Input
              label="Título da História"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Nossa História de Amor"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Primeiro(a) Parceiro(a)
                </h4>
                <Input
                  label="Nome"
                  value={formData.partner1.name}
                  onChange={(e) =>
                    updatePartner("partner1", "name", e.target.value)
                  }
                  required
                />
                <Input
                  label="Idade"
                  type="number"
                  value={formData.partner1.age}
                  onChange={(e) =>
                    updatePartner("partner1", "age", e.target.value)
                  }
                />
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Segundo(a) Parceiro(a)
                </h4>
                <Input
                  label="Nome"
                  value={formData.partner2.name}
                  onChange={(e) =>
                    updatePartner("partner2", "name", e.target.value)
                  }
                  required
                />
                <Input
                  label="Idade"
                  type="number"
                  value={formData.partner2.age}
                  onChange={(e) =>
                    updatePartner("partner2", "age", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card title="História do Relacionamento" variant="romantic">
          <div className="space-y-4">
            <Input
              label="Como vocês se conheceram?"
              value={formData.howWeMet}
              onChange={(e) => updateField("howWeMet", e.target.value)}
              placeholder="Nos conhecemos em..."
            />

            <Input
              label="Data do primeiro encontro"
              type="date"
              value={formData.firstDate}
              onChange={(e) => updateField("firstDate", e.target.value)}
            />
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => onStepChange(currentStep - 1)}
          >
            Voltar
          </Button>
        )}

        {currentStep < 2 ? (
          <Button
            type="button"
            onClick={() => onStepChange(currentStep + 1)}
            className="ml-auto"
          >
            Próximo
          </Button>
        ) : (
          <Button type="submit" loading={loading} className="ml-auto">
            Salvar História
          </Button>
        )}
      </div>
    </form>
  );
}
