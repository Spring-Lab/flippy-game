import { Score } from "../types/score";

const SCORES_KEY = "memory_game_scores";

export const saveScore = (score: number): void => {
  const scores = getScores();
  const newScore: Score = {
    id: Date.now().toString(),
    score,
    createdAt: new Date().toISOString(),
  };

  scores.push(newScore);
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
};

export const getScores = (): Score[] => {
  const scores = localStorage.getItem(SCORES_KEY);
  return scores ? JSON.parse(scores) : [];
};
