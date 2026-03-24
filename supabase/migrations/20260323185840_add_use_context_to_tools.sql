-- AIC-64: Add use_context to tools table
-- Classifies each tool as dev-productivity, app-infrastructure, or both.
-- Used by the Genome to detect stack archetype and apply the correct
-- slot priority model (so dev tooling stacks are not penalised for
-- missing LLM providers, and vice versa).

ALTER TABLE tools
  ADD COLUMN use_context text NOT NULL DEFAULT 'both'
    CHECK (use_context IN ('dev-productivity', 'app-infrastructure', 'both'));

-- Back-fill from the classification in tools.json.
-- Categories that map cleanly to a single context:
UPDATE tools SET use_context = 'dev-productivity'
  WHERE category IN (
    'coding-assistants',
    'autonomous-agents',
    'design',
    'devops',
    'docs',
    'product-mgmt',
    'specifications'
  );

UPDATE tools SET use_context = 'app-infrastructure'
  WHERE category IN (
    'agent-frameworks',
    'pipelines-rag',
    'llm-infra',
    'prompt-eval',
    'fine-tuning',
    'voice-ai',
    'multimodal',
    'observability'
  );

-- mcp and browser-automation default to 'both' (already the column default).

-- Individual overrides — llm-infra tools that span both contexts:
UPDATE tools SET use_context = 'both'
  WHERE id IN (
    'huggingface',
    'litellm',
    'modal',
    'ollama',
    'ray',
    'replicate',
    'vercel-ai-sdk',
    'llama-cpp',
    'vllm'
  );

-- pipelines-rag override:
UPDATE tools SET use_context = 'both' WHERE id = 'n8n';

-- browser-automation override (Skyvern is purely app infrastructure):
UPDATE tools SET use_context = 'app-infrastructure' WHERE id = 'skyvern';

-- observability override:
UPDATE tools SET use_context = 'both' WHERE id = 'mlflow';
