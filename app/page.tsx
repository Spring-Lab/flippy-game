"use client";

import { useState, useEffect } from "react";
import { Settings, Shuffle, Timer, Trophy, Award, RefreshCw, Moon, Sun, Volume2, VolumeX, Clock, Medal, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
// @ts-expect-error
import confetti from "canvas-confetti";
import Head from "next/head";

type Card = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

type Difficulty = "easy" | "medium" | "hard";
type Category = "animals" | "fruits" | "vehicles";

const DIFFICULTIES = {
  easy: { pairs: 6, time: 90 },
  medium: { pairs: 8, time: 120 },
  hard: { pairs: 12, time: 180 },
};

const CATEGORIES = {
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮"],
  fruits: ["🍎", "🍌", "🍇", "🍓", "🥭", "🍍", "🍒", "🍑", "🍉", "🍋", "🍊", "🍐"],
  vehicles: ["🚗", "🚕", "🚌", "🚑", "🚲", "🏍", "🚀", "✈️", "🛳", "🚚", "🚜", "🛴"],
};

type Score = {
  playerName: string;
  difficulty: Difficulty;
  moves: number;
  time: number;
  date: number;
  category: Category;
};

type GameHistory = {
  playerName: string;
  difficulty: Difficulty;
  moves: number;
  time: number;
  date: number;
  result: "won" | "lost";
  category: Category;
};

const STORAGE_KEYS = {
  scores: "flippy-scores",
  bestScores: "flippy-best-scores",
  history: "flippy-game-history",
  playerName: "flippy-player-name",
  category: "flippy-category",
  dailyChallenge: "flippy-daily-challenge",
};

interface GameStatsProps {
  time: number;
  moves: number;
  matches: number;
  difficulty: Difficulty;
  comboMultiplier: number;
}

const GameStats = ({ time, moves, matches, difficulty, comboMultiplier }: GameStatsProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg flex items-center gap-2 text-sm">
      <Timer size={16} className="text-blue-500" />
      <span>{time}s</span>
    </div>
    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg flex items-center gap-2 text-sm">
      <Shuffle size={16} className="text-green-500" />
      <span>{moves}</span>
    </div>
    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg flex items-center gap-2 text-sm">
      <Trophy size={16} className="text-yellow-500" />
      <span>
        {matches}/{DIFFICULTIES[difficulty].pairs}
      </span>
    </div>
    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg flex items-center gap-2 text-sm">
      <Award size={16} className="text-purple-500" />
      <span>Combo: x{comboMultiplier.toFixed(1)}</span>
    </div>
  </div>
);

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [isMuted, setIsMuted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [time, setTime] = useState<number>(60);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [category, setCategory] = useState<Category>("animals");
  const [bestScores, setBestScores] = useState<Record<Difficulty, number>>({
    easy: Infinity,
    medium: Infinity,
    hard: Infinity,
  });
  const [showScores, setShowScores] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<Score[]>([]);
  const [playerName, setPlayerName] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<{ completed: boolean; date: string }>();

  // New Features
  const [timePenalty] = useState<number>(5); // 5 seconds penalty for wrong matches
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);

  useEffect(() => {
    initializeGame();
  }, [difficulty, category]);

  useEffect(() => {
    loadStoredData();
    checkDailyChallenge();
  }, []);

  const checkDailyChallenge = () => {
    const today = new Date().toDateString();
    const savedChallenge = localStorage.getItem(STORAGE_KEYS.dailyChallenge);
    if (savedChallenge) {
      const challenge = JSON.parse(savedChallenge);
      if (challenge.date === today) {
        setDailyChallenge({ completed: challenge.completed, date: today });
      }
    }
  };

  const loadStoredData = () => {
    const savedPlayerName = localStorage.getItem(STORAGE_KEYS.playerName);
    const savedScores = localStorage.getItem(STORAGE_KEYS.scores);
    const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
    const savedBestScores = localStorage.getItem(STORAGE_KEYS.bestScores);
    const savedCategory = localStorage.getItem(STORAGE_KEYS.category);

    if (savedPlayerName) setPlayerName(savedPlayerName);
    if (savedScores) setScoreHistory(JSON.parse(savedScores));
    if (savedHistory) setGameHistory(JSON.parse(savedHistory));
    if (savedBestScores) setBestScores(JSON.parse(savedBestScores));
    if (savedCategory) setCategory(savedCategory as Category);
  };

  const saveToStorage = () => {
    localStorage.setItem(STORAGE_KEYS.scores, JSON.stringify(scoreHistory));
    localStorage.setItem(STORAGE_KEYS.bestScores, JSON.stringify(bestScores));
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(gameHistory));
    localStorage.setItem(STORAGE_KEYS.category, category);
    if (playerName) localStorage.setItem(STORAGE_KEYS.playerName, playerName);
  };

  const initializeGame = () => {
    const { pairs } = DIFFICULTIES[difficulty];
    const gameEmojis = CATEGORIES[category].slice(0, pairs);
    const shuffledCards = [...gameEmojis, ...gameEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatches(0);
    setMoves(0);
    setTime(DIFFICULTIES[difficulty].time);
    setGameOver(false);
    setIsPlaying(false);
    setComboMultiplier(1);
  };

  const handleCardClick = (id: number) => {
    if (!isPlaying) setIsPlaying(true);

    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched || gameOver) return;

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);
    playSound("flip");

    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstId, secondId] = newFlippedCards;

      if (cards[firstId].emoji === cards[secondId].emoji) {
        // Correct match
        setComboMultiplier((prev) => prev + 0.2);
        newCards[firstId].isMatched = true;
        newCards[secondId].isMatched = true;
        setMatches((prev) => {
          const newMatches = prev + 1;
          if (newMatches === DIFFICULTIES[difficulty].pairs) {
            handleGameWin();
          }
          return newMatches;
        });
        playSound("match");
      } else {
        // Wrong match - add rotate-y-0 class for flipping back animation
        setComboMultiplier(1);
        setTime((prev) => Math.max(0, prev - timePenalty));
        setTimeout(() => {
          const updatedCards = [...newCards];
          updatedCards[firstId].isFlipped = false;
          updatedCards[secondId].isFlipped = false;
          setCards(updatedCards);
        }, 1000);
      }
      setFlippedCards([]);
    }
  };

  const handleGameWin = () => {
    const timeSpent = DIFFICULTIES[difficulty].time - time;
    const score = Math.round((1000 * comboMultiplier) / (moves + 1 + timeSpent / 10));

    if (score > bestScores[difficulty]) {
      setBestScores((prev) => ({ ...prev, [difficulty]: score }));
    }

    saveScore(timeSpent);
    saveGameToHistory(true);
    setGameOver(true);
    setIsPlaying(false);
    playSound("success");
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (dailyChallenge && !dailyChallenge.completed) {
      localStorage.setItem(
        STORAGE_KEYS.dailyChallenge,
        JSON.stringify({
          date: new Date().toDateString(),
          completed: true,
        })
      );
    }
  };

  const saveScore = (timeSpent: number) => {
    if (!playerName.trim()) return;

    const newScore: Score = {
      playerName: playerName.trim(),
      difficulty,
      moves,
      time: timeSpent,
      date: Date.now(),
      category,
    };

    const updatedScores = [...scoreHistory, newScore].sort((a, b) => b.date - a.date).slice(0, 30);

    setScoreHistory(updatedScores);
    saveToStorage();
  };
  useEffect(() => {
    const checkDailyChallenge = () => {
      const today = new Date().toDateString();
      const savedChallenge = localStorage.getItem(STORAGE_KEYS.dailyChallenge);
      if (savedChallenge) {
        const challenge = JSON.parse(savedChallenge);
        if (challenge.date === today) {
          setDailyChallenge({ completed: challenge.completed, date: today });
          return;
        }
      }
      setDailyChallenge({ completed: false, date: today });
    };
    checkDailyChallenge();
  }, []);

  // Enhanced Save Functions
  const saveGameToHistory = (won: boolean) => {
    if (!playerName.trim()) return;

    const newGame: GameHistory = {
      playerName: playerName.trim(),
      difficulty,
      moves,
      time: DIFFICULTIES[difficulty].time - time,
      date: Date.now(),
      result: won ? "won" : "lost",
      category,
    };

    const updatedHistory = [newGame, ...gameHistory].slice(0, 50);
    setGameHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(updatedHistory));
  };

  // Tutorial Functions
  const handleTutorial = () => {
    setShowTutorial(true);
    if (!isMuted) new Audio("/sounds/pop.mp3").play();
  };

  const playSound = (type: "flip" | "match" | "success") => {
    if (isMuted) return;

    const sounds = {
      flip: "/sounds/flip.mp3",
      match: "/sounds/match.mp3",
      success: "/sounds/success.mp3",
    };

    new Audio(sounds[type]).play().catch((err) => console.log("Audio error:", err));
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: "Flippy Memory Game",
    description: "A fun memory card matching game with multiple difficulty levels and categories",
    genre: "Memory Game",
    numberOfPlayers: "1",
    gameItem: [
      {
        "@type": "Thing",
        name: "Memory Cards",
      },
    ],
  };

  return (
    <>
      <Head>
        <title>Flippy Memory Game - Fun Card Matching Puzzle</title>
        <meta
          name="description"
          content="Challenge your memory with Flippy Memory Game! Match pairs of cards in different categories and difficulty levels. Play daily challenges and beat high scores."
        />
        <meta name="keywords" content="memory game, card matching, puzzle game, brain training, memory challenge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={handleTutorial} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                  <Info size={18} />
                </button>
                <h1 className="text-xl sm:text-2xl font-bold">Flippy Memory</h1>
                <div className="hidden sm:flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg ml-2">
                  <Medal size={16} className="text-yellow-500" />
                  <span className="whitespace-nowrap">{dailyChallenge?.completed ? "Daily Done 🎉" : "Daily Challenge!"}</span>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                <div className="flex sm:hidden items-center gap-2 text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg w-full">
                  <Medal size={16} className="text-yellow-500" />
                  <span>{dailyChallenge?.completed ? "Daily Done 🎉" : "Daily Challenge!"}</span>
                </div>

                <input
                  type="text"
                  placeholder="Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm min-w-[120px] flex-1 sm:flex-none"
                  disabled={isPlaying}
                />

                <div className="flex items-center gap-2">
                  <button onClick={() => setShowScores(true)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                    <Trophy size={18} />
                  </button>

                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                  </button>

                  <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <select
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                disabled={isPlaying}
              >
                <option value="easy">Easy ({DIFFICULTIES.easy.pairs} pairs)</option>
                <option value="medium">Medium ({DIFFICULTIES.medium.pairs} pairs)</option>
                <option value="hard">Hard ({DIFFICULTIES.hard.pairs} pairs)</option>
              </select>

              <select
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                disabled={isPlaying}
              >
                <option value="animals">Animals</option>
                <option value="fruits">Fruits</option>
                <option value="vehicles">Vehicles</option>
              </select>

              <button onClick={initializeGame} className="px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
                <RefreshCw size={16} />
                <span>New Game</span>
              </button>
            </div>

            <GameStats time={time} moves={moves} matches={matches} difficulty={difficulty} comboMultiplier={comboMultiplier} />

            {/* Game Grid */}
            <div className={cn("grid gap-2 mb-6", difficulty === "easy" ? "grid-cols-4" : difficulty === "medium" ? "grid-cols-4 sm:grid-cols-4" : "grid-cols-4 sm:grid-cols-6")}>
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={cn(
                    "aspect-square rounded-lg text-3xl sm:text-4xl flex items-center justify-center transition-all duration-300 perspective-1000",
                    card.isFlipped || card.isMatched ? "rotate-y-180" : "rotate-y-0",
                    card.isFlipped || card.isMatched ? "bg-white dark:bg-gray-700 scale-100" : "bg-blue-500 scale-95 cursor-pointer hover:bg-blue-600 hover:scale-100"
                  )}
                  disabled={card.isMatched || (flippedCards.length === 2 && !card.isFlipped)}
                >
                  <span className={cn("transition-all duration-300", card.isFlipped || card.isMatched ? "opacity-100 scale-100" : "opacity-0 scale-50")}>{card.emoji}</span>
                </button>
              ))}
            </div>

            {/* Tutorial Modal */}
            {showTutorial && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowTutorial(false)}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Info size={24} /> How to Play
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                        <Timer size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Time Management</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Match cards quickly! Wrong matches deduct {timePenalty} seconds.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                        <Medal size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Daily Challenges</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Complete daily challenges for special rewards (resets every 24h).</p>
                      </div>
                    </div>
                    {/* Add more tutorial items */}
                  </div>
                  <button onClick={() => setShowTutorial(false)} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                    Let's Play!
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Scoreboard Modal */}
            {showScores && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowScores(false)}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-4 mb-4">
                    <button className="flex-1 py-2 rounded-lg bg-blue-500 text-white" onClick={() => setShowHistory(false)}>
                      High Scores
                    </button>
                    <button className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-700" onClick={() => setShowHistory(true)}>
                      Game History
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {(showHistory ? gameHistory : scoreHistory).map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border-b">
                        <div className="flex items-center gap-3">
                          {"result" in entry && (
                            <span className={`text-sm ${entry.result === "won" ? "text-green-500" : "text-red-500"}`}>{entry.result === "won" ? "🏆" : "❌"}</span>
                          )}
                          <div>
                            <h3 className="font-semibold">{entry.playerName}</h3>
                            <p className="text-sm text-gray-500">
                              {entry.difficulty} • {entry.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono">{entry.moves} moves</p>
                          <p className="text-sm text-gray-500">{entry.time}s</p>
                          <p className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Game Over Screen */}
            {gameOver && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setGameOver(false)}>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-3xl font-bold mb-4">{matches === DIFFICULTIES[difficulty].pairs ? "🎉 Victory!" : "😢 Game Over"}</h2>
                  <div className="space-y-2 mb-6">
                    <p>Moves: {moves}</p>
                    <p>Time Remaining: {time}s</p>
                    <p>Combo Multiplier: x{comboMultiplier.toFixed(1)}</p>
                    {dailyChallenge && !dailyChallenge.completed && <p className="text-green-500">+ Daily Challenge Completed!</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={initializeGame} className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      Play Again
                    </button>
                    <button onClick={() => setShowScores(true)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300">
                      View Scores
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
