# Aaryash Bhagankar

**Applied machine learning · software development · data analysis**

Portfolio: [ab07folio.vercel.app](https://ab07folio.vercel.app).

I am a B.Tech Computer Science and Engineering student at SRMIST, KTR Campus, with expected graduation in 2029 and a current CGPA of 8.42/10. I build tools for hand-gesture input, local AI workflows and data analysis. My Nashik Cyber Police internship is supporting experience in fund-flow tracing and digital evidence.

## Selected work

- **MORSELAB:** Turns webcam hand gestures into Morse code using an Arduino LED. Implements KNN, SVM, Random Forest and MLP, saved experiments and separate-session evaluation workflows.
- **Luminary:** Records light-sensor signals and trains local models for optical-gesture experiments. Sample-data results are explicitly synthetic demonstrations.
- **RadixOS:** Runs multiple AI assistants on separate copies of a coding project, with 2-8 parallel assistant tasks and locally saved project history.
- **RED Justice:** Links people, documents and bank transactions to help trace fraud. It grew from an internal fund-flow tracing tool built during my Nashik Cyber Police internship.

The circular browser contains 18 further entries and shows up to eight cards per page. Keyboard navigation, pause/resume and project dialogs work across all 22 entries. Archive revisions are consolidated. VoiceStudio is a third-party application and is not listed as an authored project.

## Research preparation

Under Dr. Preethiya at SRMIST, I prepared an 81-reference literature review on predicting supercapacitor capacitance from electrode composition and checked 22 electrochemical measurement curves for missing or invalid data. These are review and data-audit outputs.

## Evaluation scope

RED Justice's score is an **alias-linking component test**, not end-to-end extraction performance. On 172 synthetic name pairs, including nine positives: TP 9, FP 4, FN 0, TN 159; precision 69.2%, recall 100%, F1 0.818. Input names come from benchmark ground truth, so extraction errors are outside this result. The four false links involve ambiguous names.

No within-session perfect gesture score is presented as cross-session performance. Prototype stages and synthetic demonstrations are identified in project dialogs.

## Certificates and resumes

- H7CTF 2026 finalist, team rank 9th. The 722-team field is for the **qualifiers**; the displayed certificate records qualifier participation.
- kBxAc CTF 2026: rank 23 of 290 teams.
- Securinets CTF 2026 qualifiers: 77th International and 87th overall, seven challenges and 2,435 points.
- SIH 2026 internal hackathon finalist; Yukthi CTF finalist.

[ML research resume](assets/documents/Aaryash_Bhagankar_AI_ML_Resume_2026.pdf) · [Engineering/security resume](assets/documents/Aaryash_Bhagankar_Engineering_Security_Resume_2026.pdf)

The legacy resume URL also serves the current ML version. Certificates are under `assets/credentials/`.

## Interactive visuals

Open **Neural Lab** from the terminal footer or command palette. It trains a deterministic logistic classifier on synthetic toy points locally in the browser. The rings preset and radial-feature control show why feature choice matters. Its loss values belong only to this demonstration. Reduced motion switches training to manual steps.

The hero signal mesh can be held. The music stage contains one original wireframe dragon, rendered with native WebGL and a projected-canvas fallback. It breathes and moves its wings before audio starts; drag, keyboard rotation and zoom controls work directly. Music adds frequency-driven pulses. Motion pauses when hidden, held, offscreen or under reduced-motion settings; sound starts only through its controls. New MORSELAB and Luminary PNG marks and their generation prompts are in `assets/logos/`.

## Run and check

This static site uses Node.js 24 and built-in modules; no runtime package installation is required.

```sh
node scripts/dev.mjs . 3000
node --check app.js
node --check assets/data/projects.js
node scripts/validate.mjs
node scripts/test-projects.mjs
node scripts/test-ml-lab.mjs
node scripts/test-ambience.mjs
node scripts/test-dragon.mjs
node scripts/build.mjs
node scripts/dev.mjs dist 4173
```

The build writes `dist/`, which Vercel serves using `vercel.json`. Browser checks cover project dialogs, all circle pages, mobile navigation, certificate previews and resume downloads.

## Contact

[aaryashbh@gmail.com](mailto:aaryashbh@gmail.com) · [GitHub](https://github.com/automatedcatso) · [LinkedIn](https://www.linkedin.com/in/aaryash-bhagankar-50079230a/)
