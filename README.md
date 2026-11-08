# AVT Story & Video Studio v2

A Burmese-first AI story planning website. It generates story concepts, character bibles, dialogue, image prompts, and exactly 10-second video prompts for each scene. It does not render actual video files.

## Render deployment
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `API_BASE_URL=https://api.groq.com/openai/v1`
  - `API_KEY=your_private_provider_key`
  - `MODEL=your_provider_model_id`

The API key must only be entered in Render environment variables, never in browser code or GitHub.
Free hosting may sleep when inactive. AI provider usage may have rate limits.
