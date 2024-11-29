import React, { useState, useEffect } from "react";
import "./App.css";

function QuizApplication() {
  const [quizData, setQuizData] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState({
    text: "",
    options: [
      { id: 0, text: "", isCorrect: false },
      { id: 1, text: "", isCorrect: false },
      { id: 2, text: "", isCorrect: false },
      { id: 3, text: "", isCorrect: false },
    ],
  });
  const [currentTab, setCurrentTab] = useState("play");
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [editMode, setEditMode] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/questions")
      .then((response) => response.json())
      .then((data) => setQuizData(data))
      .catch((error) => console.error("Error fetching questions:", error));
  }, []);

  useEffect(() => {
    if (quizInProgress && !resultsVisible) {
      setTimeLeft(10);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowCorrectAnswer(true);
            setTimeout(() => handleOptionClick(false, null), 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizInProgress, resultsVisible, questionIndex]);

  const addNewQuiz = () => {
    if (editMode) {
      saveEditedQuiz();
      return;
    }
    fetch("http://localhost:5000/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(currentQuiz),
    })
      .then((response) => response.json())
      .then((data) => {
        setQuizData([...quizData, data]);
        resetQuizForm();
      })
      .catch((error) => console.error("Error adding quiz:", error));
  };

  const deleteQuiz = (id) => {
    fetch(`http://localhost:5000/questions/${id}`, {
      method: "DELETE",
    })
      .then(() => {
        setQuizData(quizData.filter((quiz) => quiz.id !== id));
      })
      .catch((error) => console.error("Error deleting quiz:", error));
  };

  const startQuiz = () => {
    setQuizInProgress(true);
    setResultsVisible(false);
    setQuestionIndex(0);
    setUserScore(0);
    setSelectedOptionId(null);
    setShowCorrectAnswer(false);
  };

  const handleOptionClick = (isCorrect, optionId) => {
    setSelectedOptionId(optionId);
    setShowCorrectAnswer(true);

    if (isCorrect) {
      setUserScore(userScore + 1);
    }

    setTimeout(() => {
      setShowCorrectAnswer(false);
      if (questionIndex + 1 < quizData.length) {
        setQuestionIndex(questionIndex + 1);
        setSelectedOptionId(null);
      } else {
        setResultsVisible(true);
        setQuizInProgress(false);
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setResultsVisible(false);
    setQuizInProgress(false);
    setQuestionIndex(0);
    setUserScore(0);
    setSelectedOptionId(null);
    setShowCorrectAnswer(false);
  };

  const markCorrectOption = (index) => {
    const updatedOptions = currentQuiz.options.map((option, i) => ({
      ...option,
      isCorrect: i === index,
    }));
    setCurrentQuiz({ ...currentQuiz, options: updatedOptions });
  };

  const editQuiz = (quiz) => {
    setEditMode(quiz);
    setCurrentQuiz(quiz);
  };

  const saveEditedQuiz = () => {
    fetch(`http://localhost:5000/questions/${editMode.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(currentQuiz),
    })
      .then(() => {
        setQuizData(
          quizData.map((q) => (q.id === editMode.id ? { ...editMode, ...currentQuiz } : q))
        );
        resetQuizForm();
      })
      .catch((error) => console.error("Error updating quiz:", error));
  };

  const resetQuizForm = () => {
    setEditMode(null);
    setCurrentQuiz({
      text: "",
      options: [
        { id: 0, text: "", isCorrect: false },
        { id: 1, text: "", isCorrect: false },
        { id: 2, text: "", isCorrect: false },
        { id: 3, text: "", isCorrect: false },
      ],
    });
  };

  return (
    <div className="App">
      <header>
        <h1>Quiz Application</h1>
        <nav>
          <button
            className={currentTab === "play" ? "active-tab" : ""}
            onClick={() => setCurrentTab("play")}
          >
            Play Quiz
          </button>
          <button
            className={currentTab === "manage" ? "active-tab" : ""}
            onClick={() => setCurrentTab("manage")}
          >
            Manage Questions
          </button>
          <button
            className={currentTab === "about" ? "active-tab" : ""}
            onClick={() => setCurrentTab("about")}
          >
            About Us
          </button>
        </nav>
      </header>

      {currentTab === "play" ? (
        <div>
          {resultsVisible ? (
            <div className="results">
              <h1>Quiz Results</h1>
              <h2>
                {userScore} out of {quizData.length} correct - (
                {((userScore / quizData.length) * 100).toFixed(2)}%)
              </h2>
              <button onClick={resetQuiz}>Restart Quiz</button>
            </div>
          ) : quizInProgress ? (
            <div className="quiz-card">
              <h2>
                Question {questionIndex + 1} of {quizData.length}
              </h2>
              <h3>{quizData[questionIndex]?.text}</h3>
              <div className="timer">Time Left: {timeLeft}s</div>
              <ul>
                {quizData[questionIndex]?.options.map((option) => (
                  <li
                    key={option.id}
                    onClick={() =>
                      !selectedOptionId &&
                      handleOptionClick(option.isCorrect, option.id)
                    }
                    className={
                      showCorrectAnswer && option.isCorrect
                        ? "correct"
                        : selectedOptionId === option.id
                        ? option.isCorrect
                          ? "correct"
                          : "incorrect"
                        : ""
                    }
                  >
                    {option.text}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="start-quiz">
              <h2>Are you ready?</h2>
              <button
                onClick={startQuiz}
                disabled={quizData.length === 0}
                className={quizData.length === 0 ? "disabled" : ""}
              >
                {quizData.length === 0 ? "Add Questions First" : "Start Quiz"}
              </button>
            </div>
          )}
        </div>
      ) : currentTab === "manage" ? (
        <div className="quiz-form">
          <h2>{editMode ? "Edit Quiz" : "Add New Question"}</h2>
          <input
            type="text"
            placeholder="Quiz Question"
            value={currentQuiz.text}
            onChange={(e) =>
              setCurrentQuiz({ ...currentQuiz, text: e.target.value })
            }
          />
          {currentQuiz.options.map((option, index) => (
            <div key={index} className="option-input">
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option.text}
                onChange={(e) => {
                  const updatedOptions = [...currentQuiz.options];
                  updatedOptions[index].text = e.target.value;
                  setCurrentQuiz({ ...currentQuiz, options: updatedOptions });
                }}
              />
              <input
                type="radio"
                name="correctOption"
                checked={option.isCorrect}
                onChange={() => markCorrectOption(index)}
              />
              Correct
            </div>
          ))}
          <button onClick={addNewQuiz}>
  {editMode ? "Save Changes" : "Add Question"}
</button>
{editMode && <button onClick={resetQuizForm}>Cancel</button>}


          <h3>All Questions</h3>
          <ul>
            {quizData.map((quiz, idx) => (
              <li key={idx}>
                <p>{quiz.text}</p>
                <div className="buttons">
                  <button onClick={() => editQuiz(quiz)}>Edit</button>
                  <button onClick={() => deleteQuiz(quiz.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="about-us">
          <h2>About Us</h2>
          <h3>Meet the team behind the Quiz Application:</h3>
          <ul>
            <li><small>Avula Sri Sai Koushik | AP22110011645</small></li>
            <li><small>Ch Hima Varshini | AP22110011571</small></li>
            <li><small>B Ganesh Naik | AP22110011598</small></li>
            <li><small>M Pramod | AP22110011271</small></li>
            <li><small>K Durga Prasad | AP22110011460</small></li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default QuizApplication;
