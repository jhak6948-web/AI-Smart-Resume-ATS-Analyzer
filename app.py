import os
import json
import traceback

from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from pypdf import PdfReader
from docx import Document
from werkzeug.utils import secure_filename


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)

# Maximum upload size = 5 MB
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024


# =========================================================
# GEMINI API
# =========================================================

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

client = genai.Client(api_key=api_key)


# =========================================================
# FILE SETTINGS
# =========================================================

ALLOWED_EXTENSIONS = {"pdf", "docx"}


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    return render_template("index.html")


# =========================================================
# RESUME UPLOAD
# =========================================================

@app.route("/upload-resume", methods=["POST"])
def upload_resume():

    if "resume_file" not in request.files:
        return jsonify({
            "error": "No file selected."
        }), 400

    file = request.files["resume_file"]

    if file.filename == "":
        return jsonify({
            "error": "No file selected."
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            "error": "Only PDF and DOCX files are allowed."
        }), 400

    filename = secure_filename(file.filename)

    try:

        # PDF
        if filename.lower().endswith(".pdf"):

            reader = PdfReader(file)

            text = ""

            for page in reader.pages:

                page_text = page.extract_text()

                if page_text:
                    text += page_text + "\n"

        # DOCX
        elif filename.lower().endswith(".docx"):

            document = Document(file)

            text = "\n".join(
                paragraph.text
                for paragraph in document.paragraphs
                if paragraph.text.strip()
            )

        if not text.strip():

            return jsonify({
                "error": "Could not extract text from this file."
            }), 400

        return jsonify({
            "success": True,
            "filename": filename,
            "text": text.strip()
        })

    except Exception as e:

        print("\n========== FILE ERROR ==========")
        print(repr(e))
        traceback.print_exc()
        print("================================\n")

        return jsonify({
            "error": "Could not read the uploaded file."
        }), 500


# =========================================================
# GEMINI AI FUNCTION WITH FALLBACK
# =========================================================

def generate_ai_analysis(prompt):

    models = [
        "gemini-3.8-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite"
    ]

    for model in models:

        try:

            print(f"\nTrying Gemini model: {model}")

            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )

            print(f"SUCCESS: {model}")

            return response

        except Exception as e:

            error_text = str(e)

            print("\n========== GEMINI ERROR ==========")
            print("MODEL:", model)
            print(repr(e))
            print("==================================")

            temporary_error = (
                "503" in error_text
                or "UNAVAILABLE" in error_text
                or "429" in error_text
                or "RESOURCE_EXHAUSTED" in error_text
                or "500" in error_text
                or "502" in error_text
                or "504" in error_text
            )

            if temporary_error:

                print("Trying next model...")
                continue

            raise e

    raise RuntimeError(
        "All Gemini models are temporarily unavailable. "
        "Please try again later."
    )


# =========================================================
# AI RESUME ANALYSIS
# =========================================================

@app.route("/analyze", methods=["POST"])
def analyze():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received."
            }), 400

        resume = data.get(
            "resume",
            ""
        ).strip()

        job_description = data.get(
            "job_description",
            ""
        ).strip()

        if not resume:
            return jsonify({
                "error": "Resume is required."
            }), 400

        if not job_description:
            return jsonify({
                "error": "Job Description is required."
            }), 400


        # =====================================================
        # AI PROMPT
        # =====================================================

        prompt = f"""
You are an expert ATS resume analyzer.

Analyze the resume against the job description.

================ RESUME ================

{resume}

================ JOB DESCRIPTION ================

{job_description}

================================================

Return ONLY valid JSON.

Use EXACTLY this structure:

{{
    "ats_score": 0,

    "category_scores": {{
        "keyword_match": 0,
        "technical_skills": 0,
        "experience": 0,
        "education": 0,
        "resume_quality": 0
    }},

    "strengths": [
        "strength 1",
        "strength 2",
        "strength 3"
    ],

    "weaknesses": [
        "weakness 1",
        "weakness 2",
        "weakness 3"
    ],

    "missing_keywords": [
        "keyword 1",
        "keyword 2",
        "keyword 3"
    ],

    "improvements": [
        "improvement 1",
        "improvement 2",
        "improvement 3"
    ]
}}

RULES:

1. ats_score must be an integer from 0 to 100.

2. Every category score must be an integer from 0 to 100.

3. keyword_match measures how well important job-description
   keywords appear in the resume.

4. technical_skills measures the match between technical skills
   required by the job and skills shown in the resume.

5. experience measures how well the candidate's experience
   matches the job requirements.

6. education measures the match between educational requirements
   and the candidate's education.

7. resume_quality measures clarity, structure, readability,
   relevance and professional presentation.

8. strengths must contain useful positive observations.

9. weaknesses must contain actual gaps or weaknesses found
   in the resume compared with the job description.

10. missing_keywords must contain relevant terms from the
    job description that are absent or insufficiently represented
    in the resume.

11. improvements must provide practical suggestions.

12. Do not invent qualifications, skills, education,
    experience or achievements.

13. The ATS score is an estimate and is not a guarantee
    of an employer's ATS result.

14. Return ONLY JSON.

15. Do not use Markdown.

16. Do not put the JSON inside ``` blocks.
"""


        # =====================================================
        # CALL GEMINI
        # =====================================================

        response = generate_ai_analysis(prompt)

        if not response.text:
            raise ValueError(
                "Gemini returned an empty response."
            )


        # =====================================================
        # PARSE JSON
        # =====================================================

        result = json.loads(response.text)


        # =====================================================
        # DEFAULT VALUES
        # =====================================================

        if "ats_score" not in result:
            result["ats_score"] = 0

        if "category_scores" not in result:
            result["category_scores"] = {}

        if "strengths" not in result:
            result["strengths"] = []

        if "weaknesses" not in result:
            result["weaknesses"] = []

        if "missing_keywords" not in result:
            result["missing_keywords"] = []

        if "improvements" not in result:
            result["improvements"] = []


        category_defaults = {
            "keyword_match": 0,
            "technical_skills": 0,
            "experience": 0,
            "education": 0,
            "resume_quality": 0
        }

        for key, default in category_defaults.items():

            if key not in result["category_scores"]:
                result["category_scores"][key] = default


        # =====================================================
        # KEEP SCORES BETWEEN 0 AND 100
        # =====================================================

        result["ats_score"] = max(
            0,
            min(
                100,
                int(result["ats_score"])
            )
        )

        for key in category_defaults:

            result["category_scores"][key] = max(
                0,
                min(
                    100,
                    int(result["category_scores"][key])
                )
            )


        # =====================================================
        # SEND RESULT
        # =====================================================

        return jsonify(result)


    except Exception as e:

        print("\n========================================")
        print("             ANALYZE ERROR")
        print("========================================")
        print(repr(e))
        traceback.print_exc()
        print("========================================\n")

        return jsonify({
            "error": str(e)
        }), 500


# =========================================================
# RUN APP
# =========================================================

if __name__ == "__main__":
    app.run(debug=True)