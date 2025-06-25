"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { StoryForm } from "../components/forms/StoryForm";

export function StoryContainer() {
  const { user, isLoaded } = useUser();
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Carrega histórias do usuário
  useEffect(() => {
    if (isLoaded && user) {
      const userStories = user.unsafeMetadata?.stories || [];
      setStories(userStories);
    }
  }, [isLoaded, user]);

  // Função para criar nova história
  const handleCreateStory = async (storyData) => {
    setLoading(true);

    try {
      // Chama API Netlify function
      const response = await fetch("/.netlify/functions/story-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyData),
      });

      const { story } = await response.json();

      // Atualiza Clerk metadata
      const updatedStories = [...stories, story];
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          stories: updatedStories,
        },
      });

      setStories(updatedStories);
      setCurrentStory(null);
      setCurrentStep(1);
    } catch (error) {
      console.error("Erro ao criar história:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar história existente
  const handleUpdateStory = async (storyId, updates) => {
    setLoading(true);

    try {
      const response = await fetch("/.netlify/functions/story-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, data: updates }),
      });

      const { story } = await response.json();

      // Atualiza localmente
      const updatedStories = stories.map((s) => (s.id === storyId ? story : s));
      setStories(updatedStories);

      // Sync com Clerk
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          stories: updatedStories,
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar história:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Suas Histórias de Amor 💕
        </h1>
        <p className="text-gray-600">
          Crie e gerencie suas histórias românticas personalizadas.
        </p>
      </div>

      <StoryForm
        story={currentStory}
        onSubmit={handleCreateStory}
        loading={loading}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      />

      {stories.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Histórias Criadas
          </h2>
          <div className="grid gap-4">
            {stories.map((story) => (
              <div key={story.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{story.title}</h3>
                <p className="text-sm text-gray-600">
                  Criada em {new Date(story.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
