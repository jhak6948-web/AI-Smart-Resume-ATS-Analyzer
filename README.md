# AI Smart Resume & ATS Analyzer

AI Smart Resume & ATS Analyzer is a web-based application that compares a resume with a given job description and provides an estimated ATS match analysis.

## About the Project

The project is designed mainly for students, freshers, and job seekers who want to understand how closely their resume matches a particular job description.

The application can accept resume text directly or extract text from PDF and DOCX files. It then uses the Google Gemini API to analyze the resume and provides useful feedback.

## Features

- Paste resume directly into the application
- Upload PDF and DOCX resumes
- Extract text from uploaded resumes
- Enter job description
- Generate an estimated overall ATS score
- Display category-wise ATS scores
- Show strengths and weaknesses
- Identify missing keywords
- Provide resume improvement suggestions
- Display results using progress bars
- Generate a downloadable HTML report
- Basic file validation and error handling

## Technologies Used

- HTML5
- Tailwind CSS
- JavaScript
- Python
- Flask
- Google Gemini API
- pypdf
- python-docx
- python-dotenv

## Project Structure

```text
AI-Smart-Resume-ATS-Analyzer/
│
├── app.py
├── .env
├── .gitignore
├── requirements.txt
│
├── templates/
│   └── index.html
│
├── static/
│   └── js/
│       └── script.js
│
└── venv/
```
> Note: `.env` and `venv/` are excluded from Git using `.gitignore`.

## How It Works

1. User enters or uploads a resume.
2. PDF/DOCX text is extracted if a file is uploaded.
3. User enters the job description.
4. The browser sends the information to the Flask backend.
5. Flask prepares the AI analysis request.
6. Google Gemini analyzes the resume against the job description.
7. The analysis is returned in structured form.
8. The results are displayed on the dashboard.
9. The user can download the analysis report.

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/` | GET | Opens the main application |
| `/upload-resume` | POST | Uploads and extracts PDF/DOCX resume text |
| `/analyze` | POST | Performs AI-based resume analysis |

## Security

The Gemini API key is stored in the `.env` file and is not included in the source code. The `.env` file is included in `.gitignore` to prevent accidental exposure of the API key.

The application accepts PDF and DOCX files with a maximum upload size of 5 MB.

## Limitations

- ATS score is an AI-based estimate and is not a guarantee of job selection.
- Internet connection is required for Gemini API communication.
- The current version supports PDF and DOCX files.
- Analysis depends on the quality of the resume and job description.
- The current version does not include user accounts or analysis history.

## Future Scope

Future versions can include:

- User login and accounts
- Analysis history
- Database integration
- Resume builder
- More file formats
- Job portal integration
- PDF report generation
- Online cloud deployment
- Improved mobile support

## Project Status

The main features of the project have been implemented and tested locally, including resume upload, text extraction, AI analysis, ATS scoring, result display, and report generation.
