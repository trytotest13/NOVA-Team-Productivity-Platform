import { create } from 'zustand';

interface BoardUiState {
  /** Task currently open in the detail drawer (shared by board and list views). */
  openTaskId: string | null;
  openTask: (taskId: string) => void;
  closeTask: () => void;
  /** Column showing the inline quick-add form, if any. */
  quickAddStatus: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | null;
  setQuickAddStatus: (status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | null) => void;
}

export const useBoardUi = create<BoardUiState>((set) => ({
  openTaskId: null,
  openTask: (taskId) => set({ openTaskId: taskId }),
  closeTask: () => set({ openTaskId: null }),
  quickAddStatus: null,
  setQuickAddStatus: (status) => set({ quickAddStatus: status }),
}));
