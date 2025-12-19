import { useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import type { CanvasElement } from '../types/canvas';
import type { ScreenData } from '../types/project';

export function useCanvasElements(screenId: string) {
  const { currentProject, updateProject } = useProject();

  const screen = currentProject?.data.screens[screenId];
  const elements = screen?.elements || [];

  const addElement = useCallback(
    (element: CanvasElement) => {
      if (!currentProject) return;

      const updatedScreen: ScreenData = {
        ...screen,
        elements: [...elements, element],
      };

      updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          screens: {
            ...currentProject.data.screens,
            [screenId]: updatedScreen,
          },
        },
      });
    },
    [currentProject, screen, elements, screenId, updateProject]
  );

  const updateElement = useCallback(
    (element: CanvasElement) => {
      if (!currentProject) return;

      const updatedElements = elements.map((el) => (el.id === element.id ? element : el));
      const updatedScreen: ScreenData = {
        ...screen,
        elements: updatedElements,
      };

      updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          screens: {
            ...currentProject.data.screens,
            [screenId]: updatedScreen,
          },
        },
      });
    },
    [currentProject, screen, elements, screenId, updateProject]
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      if (!currentProject) return;

      const updatedElements = elements.filter((el) => el.id !== elementId);
      const updatedScreen: ScreenData = {
        ...screen,
        elements: updatedElements,
      };

      updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          screens: {
            ...currentProject.data.screens,
            [screenId]: updatedScreen,
          },
        },
      });
    },
    [currentProject, screen, elements, screenId, updateProject]
  );

  const reorderElements = useCallback(
    (elementIds: string[]) => {
      if (!currentProject) return;

      const elementMap = new Map(elements.map((el) => [el.id, el]));
      const updatedElements = elementIds.map((id, index) => {
        const element = elementMap.get(id);
        return element ? { ...element, zIndex: index } : null;
      }).filter((el): el is CanvasElement => el !== null);

      const updatedScreen: ScreenData = {
        ...screen,
        elements: updatedElements,
      };

      updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          screens: {
            ...currentProject.data.screens,
            [screenId]: updatedScreen,
          },
        },
      });
    },
    [currentProject, screen, elements, screenId, updateProject]
  );

  return {
    elements,
    addElement,
    updateElement,
    deleteElement,
    reorderElements,
  };
}
