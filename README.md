# AVT Studio — Story & Image Prompt Tool

A responsive Burmese-first website. It creates **text stories** and **image-generation prompts** only. It does not generate video or images.

## Requirements
- Node.js 18 or newer
- An API key from an AI provider that supports the OpenAI-compatible Chat Completions API

## Run locally
1. Extract this ZIP.
2. Copy `.env.example` to `.env`.
3. Set `API_BASE_URL`, `API_KEY`, and `MODEL` in `.env`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

Example configuration format (replace with values from your provider):
```
API_BASE_URL=https://provider-api.example/v1
API_KEY=your-secret-key
MODEL=your-model-id
PORT=3000
```

## Deploy
Deploy this Node.js project to a host that supports Node 18+ and environment variables. Set the same three API variables in the host's environment settings. Do not commit `.env` or expose the API key in frontend JavaScript.

## Cost note
The website source code is free. API calls may cost money depending on the provider, model, free-tier limits, and your usage. Check your provider's current pricing and free-tier policy before using it. This starter does not promise unlimited free API usage.

## Security note
The API key is read only by `server.js`; it is never sent to the browser. Add authentication and rate limiting before making a public website available to everyone.
