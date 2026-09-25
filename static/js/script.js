console.log("ATS Analyzer JavaScript loaded!");


/* =========================================================
   ELEMENTS
   ========================================================= */

const resumeFile = document.getElementById("resumeFile");

const uploadStatus = document.getElementById("uploadStatus");

const resumeInput = document.getElementById("resume");

const jobDescriptionInput =
    document.getElementById("jobDescription");

const analyzeBtn =
    document.getElementById("analyzeBtn");


/* =========================================================
   UPLOAD RESUME
   ========================================================= */

resumeFile.addEventListener("change", async function () {

    const file = resumeFile.files[0];

    if (!file) {
        return;
    }


    uploadStatus.innerText =
        "⏳ Reading resume...";


    const formData = new FormData();

    formData.append(
        "resume_file",
        file
    );


    try {

        const response = await fetch(
            "/upload-resume",
            {
                method: "POST",
                body: formData
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Upload failed."
            );

        }


        resumeInput.value =
            data.text;


        uploadStatus.innerText =
            "✅ " +
            data.filename +
            " uploaded successfully.";


    } catch (error) {

        console.error(error);


        uploadStatus.innerText =
            "❌ " +
            error.message;

    }

});


/* =========================================================
   ANALYZE RESUME
   ========================================================= */

analyzeBtn.addEventListener(
    "click",
    async function () {


        const resume =
            resumeInput.value.trim();


        const jobDescription =
            jobDescriptionInput.value.trim();


        /* -------------------------------------------------
           VALIDATION
           ------------------------------------------------- */

        if (!resume) {

            alert(
                "Please upload or paste your resume."
            );

            return;

        }


        if (!jobDescription) {

            alert(
                "Please enter the job description."
            );

            return;

        }


        /* -------------------------------------------------
           BUTTON LOADING STATE
           ------------------------------------------------- */

        analyzeBtn.disabled = true;

        analyzeBtn.innerText =
            "⏳ Analyzing...";


        try {


            /* ---------------------------------------------
               SEND REQUEST TO FLASK
               --------------------------------------------- */

            const response = await fetch(
                "/analyze",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        resume: resume,

                        job_description:
                            jobDescription

                    })
                }
            );


            const data =
                await response.json();


            /* ---------------------------------------------
               ERROR
               --------------------------------------------- */

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "AI analysis failed."
                );

            }


            /* ---------------------------------------------
               OVERALL SCORE
               --------------------------------------------- */

            document.getElementById(
                "atsScore"
            ).innerText =
                data.ats_score + "/100";


            /* ---------------------------------------------
               CATEGORY SCORES
               --------------------------------------------- */

            const scores =
                data.category_scores || {};


            document.getElementById(
                "keywordMatch"
            ).innerText =
                (scores.keyword_match ?? 0) +
                "/100";


            document.getElementById(
                "technicalSkills"
            ).innerText =
                (scores.technical_skills ?? 0) +
                "/100";


            document.getElementById(
                "experienceScore"
            ).innerText =
                (scores.experience ?? 0) +
                "/100";


            document.getElementById(
                "educationScore"
            ).innerText =
                (scores.education ?? 0) +
                "/100";


            document.getElementById(
                "resumeQuality"
            ).innerText =
                (scores.resume_quality ?? 0) +
                "/100";

            // Category progress bars

            document.getElementById("keywordBar").style.width =
                (scores.keyword_match || 0) + "%";

            document.getElementById("technicalBar").style.width =
                (scores.technical_skills || 0) + "%";

            document.getElementById("experienceBar").style.width =
                (scores.experience || 0) + "%";

            document.getElementById("educationBar").style.width =
                (scores.education || 0) + "%";

            document.getElementById("qualityBar").style.width =
                (scores.resume_quality || 0) + "%";

            /* ---------------------------------------------
               STRENGTHS
               --------------------------------------------- */

            displayList(
                "strengths",
                data.strengths
            );


            /* ---------------------------------------------
               WEAKNESSES
               --------------------------------------------- */

            displayList(
                "weaknesses",
                data.weaknesses
            );


            /* ---------------------------------------------
               MISSING KEYWORDS
               --------------------------------------------- */

            displayList(
                "missingKeywords",
                data.missing_keywords
            );


            /* ---------------------------------------------
               IMPROVEMENTS
               --------------------------------------------- */

            displayList(
                "improvements",
                data.improvements
            );


            /* ---------------------------------------------
               SCROLL TO RESULTS
               --------------------------------------------- */

            document.getElementById(
                "results"
            ).scrollIntoView({
                behavior: "smooth"
            });


        } catch (error) {

            console.error(
                "Analysis Error:",
                error
            );


            alert(
                "Error: " +
                error.message
            );


        } finally {

            /* ---------------------------------------------
               RESTORE BUTTON
               --------------------------------------------- */

            analyzeBtn.disabled = false;

            analyzeBtn.innerText =
                "🔍 Analyze Resume";

        }

    }
);


/* =========================================================
   DISPLAY LIST
   ========================================================= */

function displayList(
    elementId,
    items
) {

    const element =
        document.getElementById(
            elementId
        );


    element.innerHTML = "";


    if (
        !items ||
        items.length === 0
    ) {

        const li =
            document.createElement("li");

        li.innerText =
            "No major points found.";

        li.className =
            "p-3 bg-slate-50 rounded-lg";

        element.appendChild(li);

        return;

    }


    items.forEach(
        function (item) {

            const li =
                document.createElement("li");


            li.innerText =
                "• " + item;


            li.className =
                "p-3 bg-slate-50 rounded-lg";


            element.appendChild(li);

        }
    );

}
/* =========================================================
   DOWNLOAD ATS REPORT
   ========================================================= */

const downloadReportBtn =
    document.getElementById("downloadReportBtn");


downloadReportBtn.addEventListener(
    "click",
    function () {

        const score =
            document.getElementById("atsScore").innerText;

        const keyword =
            document.getElementById("keywordMatch").innerText;

        const technical =
            document.getElementById("technicalSkills").innerText;

        const experience =
            document.getElementById("experienceScore").innerText;

        const education =
            document.getElementById("educationScore").innerText;

        const quality =
            document.getElementById("resumeQuality").innerText;


        const strengths =
            getListItems("strengths");

        const weaknesses =
            getListItems("weaknesses");

        const keywords =
            getListItems("missingKeywords");

        const improvements =
            getListItems("improvements");


        const report = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>ATS Resume Analysis Report</title>

<style>

body {
    font-family: Arial, sans-serif;
    background: #f1f5f9;
    margin: 0;
    padding: 40px;
    color: #1e293b;
}

.container {
    max-width: 900px;
    margin: auto;
    background: white;
    padding: 40px;
    border-radius: 15px;
}

h1 {
    text-align: center;
    color: #4338ca;
}

.subtitle {
    text-align: center;
    color: #64748b;
}

.score {
    text-align: center;
    font-size: 55px;
    font-weight: bold;
    color: #4f46e5;
    margin: 30px;
}

.grid {
    display: grid;
    grid-template-columns:
        repeat(5, 1fr);
    gap: 15px;
}

.card {
    background: #f8fafc;
    padding: 15px;
    border-radius: 10px;
    text-align: center;
}

.card h3 {
    font-size: 14px;
    color: #64748b;
}

.card p {
    font-size: 25px;
    font-weight: bold;
    color: #4f46e5;
}

.section {
    margin-top: 30px;
}

.section h2 {
    color: #4338ca;
}

li {
    margin: 10px 0;
}

.footer {
    margin-top: 40px;
    text-align: center;
    color: #64748b;
    font-size: 13px;
}

</style>

</head>


<body>

<div class="container">

<h1>
AI Smart Resume & ATS Analyzer
</h1>

<p class="subtitle">
AI-Powered Resume Analysis Report
</p>


<div class="score">
${score}
</div>


<div class="grid">

<div class="card">
<h3>Keyword Match</h3>
<p>${keyword}</p>
</div>

<div class="card">
<h3>Technical Skills</h3>
<p>${technical}</p>
</div>

<div class="card">
<h3>Experience</h3>
<p>${experience}</p>
</div>

<div class="card">
<h3>Education</h3>
<p>${education}</p>
</div>

<div class="card">
<h3>Resume Quality</h3>
<p>${quality}</p>
</div>

</div>


<div class="section">

<h2>Strengths</h2>

<ul>
${strengths}
</ul>

</div>


<div class="section">

<h2>Weaknesses</h2>

<ul>
${weaknesses}
</ul>

</div>


<div class="section">

<h2>Missing Keywords</h2>

<ul>
${keywords}
</ul>

</div>


<div class="section">

<h2>Recommended Improvements</h2>

<ul>
${improvements}
</ul>

</div>


<div class="footer">

Generated by AI Smart Resume & ATS Analyzer

</div>

</div>

</body>

</html>
`;


        const blob =
            new Blob(
                [report],
                {
                    type: "text/html"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;

        link.download =
            "ATS_Resume_Analysis_Report.html";


        link.click();


        URL.revokeObjectURL(url);

    }
);


/* =========================================================
   GET LIST ITEMS
   ========================================================= */

function getListItems(elementId) {

    const element =
        document.getElementById(
            elementId
        );


    const items =
        element.querySelectorAll("li");


    return Array.from(items)
        .map(
            item => `<li>${item.innerText}</li>`
        )
        .join("");

}