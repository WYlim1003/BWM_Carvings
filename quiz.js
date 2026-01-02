import { supabase } from "./supabase.js";

// async function trackQuizOpen() {
//     try {
//         await supabase
//             .from("clicks_carvings")
//             .insert([{ action: "quiz_page_open" }]);
//         console.log("Quiz page open tracked.");
//     } catch (err) {
//         console.error("Failed to track quiz page open:", err);
//     }
// }

// Call on page load
document.addEventListener("DOMContentLoaded", trackQuizOpen);

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
    timestamp: new Date().toISOString(),
    visitor_id: visitorID,
    score: score,
    percentage: percentage,
    question1: answers.q1.toUpperCase(),
    question2: answers.q2.toUpperCase(),
    question3: answers.q3.toUpperCase(),
    question4: answers.q4.toUpperCase()
  };

    // try {
    //     // 1️⃣ Save submission
    //     await supabase.from("submissions").insert([payload]);

    //     // 2️⃣ Update quiz stats (optional)
    //      const { data: totalSubmissionsData } = await supabase
    //         .from("submissions")
    //         .select("*", { count: "exact" });

    //     const totalSubmissions = totalSubmissionsData?.length || 0;

    //     const { count: totalClicks, error: clicksError } =
    //     await supabase
    //         .from("clicks_carvings")
    //         .select("*", { count: "exact", head: true })
    //         .eq("action", "quiz_page_open");

    //     if (clicksError) throw clicksError;

    //     const completionRate =
    //     totalClicks > 0 ? (totalSubmissions / totalClicks) * 100 : 100;


    //     // Sum and average of percentages
    //     const { data: allPercentages } = await supabase
    //         .from("submissions")
    //         .select("percentage");

    //     const sum_of_percentages = allPercentages
    //         .map(row => Number(row.percentage) || 0)
    //         .reduce((a, b) => a + b, 0);

    //     const average_percentage =
    //         allPercentages.length > 0 ? sum_of_percentages / allPercentages.length : 0;

    //     // Update stats table
    //     await supabase.from("quiz_stats").upsert([
    //         {
    //             id: 1,
    //             total_submissions: totalSubmissions,
    //             sum_of_percentages,
    //             average_percentage,
    //             completion_rate: completionRate,
    //             updated_at: new Date().toISOString(),
    //         },
    //     ]);

    //     console.log("Quiz submitted successfully");
    //     showResults(score, answers);
    // } catch (err) {
    //     console.error("Error submitting quiz:", err);
    //     alert("Failed to submit quiz. Please try again.");
    // }

        try {
            // 1️⃣ Save submission
            const { error: insertError } = await supabase
                .from("submissions")
                .insert([payload]);

            if (insertError) throw insertError;

            // 2️⃣ Total submissions
            const { data: existingClick } = await supabase
            .from("clicks_carvings")
            .select("*")
            .eq("action", "quiz_page_open")
            .limit(1);

        if (!existingClick.length) {
            const { error: clickError } = await supabase.from("clicks_carvings")
                .insert([{ action: "quiz_page_open" }]);
            if (clickError) throw clickError;
        }

        // 3️⃣ Recalculate stats
        const { count: totalSubmissions } = await supabase.from("submissions")
            .select("*", { count: "exact", head: true });

        const { count: totalClicks } = await supabase.from("clicks_carvings")
            .select("*", { count: "exact", head: true })
            .eq("action", "quiz_page_open");

        const completionRate = totalClicks > 0 ? (totalSubmissions / totalClicks) * 100 : 0;

        const { data: allPercentages } = await supabase.from("submissions").select("percentage");
        const sum_of_percentages = allPercentages.map(r => Number(r.percentage) || 0).reduce((a, b) => a + b, 0);
        const average_percentage = totalSubmissions > 0 ? sum_of_percentages / totalSubmissions : 0;

        const { error: statsError } = await supabase.from("quiz_stats").upsert([{
            id: 1,
            total_submissions: totalSubmissions,
            sum_of_percentages,
            average_percentage,
            completion_rate: completionRate,
            updated_at: new Date().toISOString()
        }]);
        if (statsError) throw statsError;

        console.log("Quiz submitted successfully ✅");
        showResults(score, answers);

    } catch (err) {
        console.error("Error submitting quiz:", err);
        alert("Failed to submit quiz. Please try again.");
    }
}

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

async function resetQuiz() {
    try {
        await supabase.from("clicks_carvings").insert([{ action: "quiz_retake" }]);
    } catch (err) {
        console.error("Failed to register retake click:", err);
    }

    document.getElementById("results-container").classList.add("hidden");
    document.getElementById("quizForm").classList.remove("hidden");

    document.querySelectorAll("input[type=radio]").forEach(r => r.checked = false);
    document.getElementById("user-id-input").value = "";
}

function convertToCSV(objArray) {
    if (!objArray || !objArray.length) return "";

    const keys = Object.keys(objArray[0]);
    const csvRows = [
        keys.join(","), // header row
        ...objArray.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(","))
    ];
    return csvRows.join("\n");
}

// Trigger download of CSV file
function downloadCSV(filename, csv) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert("CSV download not supported in this browser.");
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    try {
        await supabase
          .from("clicks_carvings")
          .insert([
            { 
              action: "quiz_page_open" // required
              // created_at will auto-fill with default NOW()
            }
          ]);
        console.log("Quiz page open tracked.");
    } catch (err) {
        console.error("Failed to track quiz page open:", err);
    }

    generateQuizQuestions();

    const quizForm = document.getElementById("quizForm");
    quizForm.addEventListener("submit", submitQuiz);

    const retakeBtn = document.getElementById("retake-btn");
    retakeBtn.addEventListener("click", resetQuiz);

    // ===== Export buttons =====
    const exportSubmissionsBtn = document.getElementById("export-submissions-btn");
    const exportStatsBtn = document.getElementById("export-stats-btn");

    // Only attach if the buttons exist (they may be hidden)
    if (exportSubmissionsBtn) {
        exportSubmissionsBtn.addEventListener("click", async () => {
    
            try {
                const { data, error } = await supabase.from("submissions").select("*");
                if (error) throw error;
                const csv = convertToCSV(data);
                downloadCSV("submissions.csv", csv);
            } catch (err) {
                console.error("Error exporting submissions:", err);
                alert("Failed to export submissions.");
            }
        });
    }

    if (exportStatsBtn) {
        exportStatsBtn.addEventListener("click", async () => {
         
            try {
                const { data, error } = await supabase.from("quiz_stats").select("*");
                if (error) throw error;
                const csv = convertToCSV(data);
                downloadCSV("quiz_stats.csv", csv);
            } catch (err) {
                console.error("Error exporting quiz stats:", err);
                alert("Failed to export quiz stats.");
            }
        });
    }
});

