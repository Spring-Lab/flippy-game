import React, { useState } from "react";
import "./ScoreButton.css";

const ScoreButton = ({ score }) => {
  const [showScore, setShowScore] = useState(false);

  const handleClick = () => {
    setShowScore(!showScore);
  };

  return (
    <div className="score-button-container">
      <button className="score-button" onClick={handleClick}>
        Check Score
      </button>
      {showScore && <div className="score-display">Current Score: {score}</div>}
    </div>
  );
};

export default ScoreButton;
