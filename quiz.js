import { supabase } from "./supabase.js";

function generateQuizQuestions() {
    const quizContent = document.getElementById("quiz-content");
    if (!quizContent || typeof QUIZ_QUESTIONS === 'undefined') {
        console.error("Critical: QUIZ_QUESTIONS data is not accessible.");
        if (quizContent) quizContent.innerHTML = "Error loading quiz. Data missing.";
        return;
    }
    let html = '';

    const currentLang = sessionStorage.getItem('lang') || 'en';
    const dict = translations[currentLang];

    QUIZ_QUESTIONS.forEach((q, index) => {
        const questionNumber = index + 1;
        // const questionTextKey = q.textKey;
        const questionText = dict[q.textKey] || q.textKey;
        
        let optionsHtml = '';
        for (const [value, optionKey] of Object.entries(q.options)) { 
            const optionText = dict[optionKey] || optionKey; 
            
            optionsHtml += `
                <li class="option-item">
                    <label class="option-label">
                        <input type="radio" name="${q.name}" value="${value}" />
                        <span class="option-text">${optionText}</span>
                    </label>
                </li>
            `;
        }

        html += `
            <div class="question-block" data-question="${questionNumber}">
                <span class="question-number">Question ${questionNumber}</span>
                <div class="question-text">${questionText}</div>
                <ul class="options-list">${optionsHtml}</ul>
            </div>
        `;
    });

    quizContent.innerHTML = html;

    // const quizActions = quizContent.querySelector('.quiz-actions');
    // if (quizActions) {
    //     quizActions.insertAdjacentHTML('beforebegin', html);
    // } else {
    //     // Fallback insertion if .quiz-actions isn't found
    //     quizContent.insertAdjacentHTML('beforeend', html);
    // }
    applyLanguage(currentLang);
}


// async function submitQuiz() {
//     const visitorID = document.getElementById("user-id-input").value.trim() || `anon-${Math.floor(Math.random() * 1000000)}`;

//     const answers = {
//       q1: document.querySelector("input[name='q1']:checked")?.value || null,
//       q2: document.querySelector("input[name='q2']:checked")?.value || null,
//       q3: document.querySelector("input[name='q3']:checked")?.value || null,
//       q4: document.querySelector("input[name='q4']:checked")?.value || null
//     };

//     if (!answers.q1 || !answers.q2 || !answers.q3 || !answers.q4) {
//       alert("Please answer all questions before submitting.");
//       return;
//     }

//     let score = 0;
//     for (let q in CORRECT_ANSWERS) {
//       if (answers[q] === CORRECT_ANSWERS[q]) score++;
//     }

//     const percentage = (score / 4) * 100;
//     // Send to server
//     const payload = {
//       visitorID,
//       question1: answers.q1.toUpperCase(),
//       question2: answers.q2.toUpperCase(),
//       question3: answers.q3.toUpperCase(),
//       question4: answers.q4.toUpperCase(),
//       score,
//       percentage,
//     };

//   // try {
//   //   const response = await fetch("/submit-quiz", {
//   //     method: "POST",
//   //     headers: { "Content-Type": "application/json" },
//   //     body: JSON.stringify(payload)
//   //   });
//   //   const data = await response.json();
//   //   console.log("Saved:", data);
//   //   showResults(score, answers);
//   // } catch (err) {
//   //   console.error("Error submitting quiz:", err);
//   //   alert("Failed to submit quiz. Please try again.");
//   // }

//   try {
//   // 1️⃣ Save submission
//   await supabase.from("submissions").insert([
//     {
//       submission_index: payload.submissionIndex,
//       visitor_id: payload.visitorID,
//       score: payload.score,
//       percentage: payload.percentage,
//       question1: payload.question1,
//       question2: payload.question2,
//       question3: payload.question3,
//       question4: payload.question4,
//       submitted_at: new Date().toISOString()
//     }
//   ]);

//   // 2️⃣ Update quiz stats
//   const { data: stats } = await supabase
//     .from("quiz_stats")
//     .select("*")
//     .eq("id", 1)
//     .single();

//   const newTotal = stats.total_submissions + 1;
//   const newSum = stats.sum_of_percentages + payload.percentage;

//   await supabase
//     .from("quiz_stats")
//     .update({
//       total_submissions: newTotal,
//       sum_of_percentages: newSum,
//       average_percentage: newSum / newTotal,
//       updated_at: new Date().toISOString()
//     })
//     .eq("id", 1);

//   console.log("Quiz submitted successfully");
//   showResults(score, answers);

// } catch (err) {
//   console.error("Error submitting quiz:", err);
//   alert("Failed to submit quiz. Please try again.");
// }

// }
let submissionCounter = 0;
async function submitQuiz(event) {
    event.preventDefault();

    const visitorID = document.getElementById("user-id-input").value.trim() || `anon-${Math.floor(Math.random()*1000000)}`;
    
    // Collect answers dynamically based on QUIZ_QUESTIONS
    const answers = {};
    QUIZ_QUESTIONS.forEach(q => {
        answers[q.name] = document.querySelector(`input[name="${q.name}"]:checked`)?.value || null;
    });

    // Check if all answered
    if (Object.values(answers).some(v => v === null)) {
        alert("Please answer all questions before submitting.");
        return;
    }

    // Calculate score
    let score = 0;
    for (let q in CORRECT_ANSWERS) {
        if (answers[q] === CORRECT_ANSWERS[q]) score++;
    }
    const percentage = (score / QUIZ_QUESTIONS.length) * 100;

    // Prepare payload
   const payload = {
    submissionindex: submissionCounter++, // lowercase
    timestamp: new Date().toISOString(),
    visitorid: visitorID,
    score: score,
    percentage: percentage,
    question1: answers.q1.toUpperCase(),
    question2: answers.q2.toUpperCase(),
    question3: answers.q3.toUpperCase(),
    question4: answers.q4.toUpperCase()
  };

    try {
        // 1️⃣ Save submission
        await supabase.from("submissions").insert([payload]);

        // 2️⃣ Update quiz stats (optional)
        const { data: stats, error: statsError } = await supabase
            .from("quiz_stats")
            .select("*")
            .eq("id", 1)
            .single();

        if (statsError) {
            console.warn("Stats row missing or table issue:", statsError.message);
            // Optionally insert first row here
        } else if (stats) {
            const newTotal = stats.total_submissions + 1;
            const newSum = stats.sum_of_percentages + percentage;
            const newAvg = newSum / newTotal;

            await supabase.from("quiz_stats")
                .update({
                    total_submissions: newTotal,
                    sum_of_percentages: newSum,
                    average_percentage: newAvg,
                    updated_at: new Date().toISOString()
                })
                .eq("id", 1);
        }

        console.log("Quiz submitted successfully");
        showResults(score, answers);

    } catch (err) {
        console.error("Error submitting quiz:", err);
        alert("Failed to submit quiz. Please try again.");
    }
}

// function showResults(score, answers) {
//   document.getElementById("quiz-content").classList.add("hidden");
//   document.getElementById("results-container").classList.remove("hidden");

//   document.getElementById("score-display").textContent = `${score}/4`;

//   const message =
//     score === 4 ? "Excellent! You got all correct!" :
//     score === 3 ? "Great job!" :
//     score === 2 ? "Good try!" :
//     score === 1 ? "Keep learning!" :
//     "Try again!";

//   document.getElementById("results-message").textContent = message;

//   const answersList = document.getElementById("answers-list");

//   answersList.innerHTML = `
//     <p><strong>Q1:</strong> Your answer: ${answers.q1.toUpperCase()} —
//       ${answers.q1 === CORRECT_ANSWERS.q1 ? "✔ Correct" : "✖ Wrong (Correct: B)"}
//     </p>

//     <p><strong>Q2:</strong> Your answer: ${answers.q2.toUpperCase()} —
//       ${answers.q2 === CORRECT_ANSWERS.q2 ? "✔ Correct" : "✖ Wrong (Correct: B)"}
//     </p>

//     <p><strong>Q3:</strong> Your answer: ${answers.q3.toUpperCase()} —
//       ${answers.q3 === CORRECT_ANSWERS.q3 ? "✔ Correct" : "✖ Wrong (Correct: A)"}
//     </p>

//     <p><strong>Q4:</strong> Your answer: ${answers.q4.toUpperCase()} —
//       ${answers.q4 === CORRECT_ANSWERS.q4 ? "✔ Correct" : "✖ Wrong (Correct: C)"}
//     </p>
//   `;
// }

function showResults(score, answers) {
    document.getElementById("quizForm").classList.add("hidden");
    document.getElementById("results-container").classList.remove("hidden");

    document.getElementById("score-display").textContent = `${score}/${QUIZ_QUESTIONS.length}`;

    const message =
        score === QUIZ_QUESTIONS.length ? "Excellent! You got all correct!" :
        score >= QUIZ_QUESTIONS.length - 1 ? "Great job!" :
        score >= QUIZ_QUESTIONS.length / 2 ? "Good try!" :
        "Keep learning!";

    document.getElementById("results-message").textContent = message;

    const answersList = document.getElementById("answers-list");
    answersList.innerHTML = '';

    QUIZ_QUESTIONS.forEach((q, index) => {
        const userAnswer = answers[q.name];
        const correctAnswer = CORRECT_ANSWERS[q.name];
        const isCorrect = userAnswer.toUpperCase() === correctAnswer.toUpperCase();
        answersList.innerHTML += `
            <p><strong>Q${index+1}:</strong> Your answer: ${userAnswer.toUpperCase()} — 
              ${isCorrect ? "✔ Correct" : `✖ Wrong (Correct: ${correctAnswer.toUpperCase()})`}
            </p>
          `;
    });
}

// async function resetQuiz() {
//   try {
//     await supabase.from("clicks").insert([
//       { action: "quiz_retake" }
//     ]);
//     console.log("Retake click saved");
//   } catch (err) {
//     console.error("Failed to register retake click:", err);
//   }

//   document.getElementById("results-container").classList.add("hidden");
//   document.getElementById("quiz-content").classList.remove("hidden");

//   document.querySelectorAll("input[type=radio]").forEach(r => r.checked = false);
//   document.getElementById("user-id-input").value = "";
// }

async function resetQuiz() {
    try {
        await supabase.from("clicks").insert([{ action: "quiz_retake" }]);
    } catch (err) {
        console.error("Failed to register retake click:", err);
    }

    document.getElementById("results-container").classList.add("hidden");
    document.getElementById("quizForm").classList.remove("hidden");

    document.querySelectorAll("input[type=radio]").forEach(r => r.checked = false);
    document.getElementById("user-id-input").value = "";
}


// document.addEventListener("DOMContentLoaded", () => {
//     if (document.getElementById("submit-btn")) {
//         generateQuizQuestions();
//         document.getElementById("submit-btn").addEventListener("click", submitQuiz);
//         document.getElementById("retake-btn").addEventListener("click", resetQuiz);
//     }
// });

document.addEventListener("DOMContentLoaded", () => {
    generateQuizQuestions();

    const quizForm = document.getElementById("quizForm");
    quizForm.addEventListener("submit", submitQuiz);

    const retakeBtn = document.getElementById("retake-btn");
    retakeBtn.addEventListener("click", resetQuiz);
});
