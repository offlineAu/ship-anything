# Catalog: agents ↔ skills

Canonical names. The validator checks every reference against `agents/` and `skills/`.

## Skills by category (63)

| Category | Skills |
|---|---|
| product-intelligence | product-discovery, product-research, reverse-engineering, requirements-analysis, architecture-planning, competitive-product-analysis, existing-project-audit, rust-modernization, craft-anything-analysis, spec-driven-development |
| software-engineering | frontend-development, backend-development, fullstack-development, database-engineering, api-development, integration-engineering, authentication-and-authorization, mobile-development, desktop-development, cross-platform-development, library-docs-lookup |
| design | ui-ux-design, design-system-engineering, accessibility-engineering, frontend-polish, interaction-design, responsive-design, motion-design, visual-regression |
| creative-production | threejs-production, blender-production, 3d-product-production, remotion-production, video-editing, sound-design, visual-effects, asset-pipeline, creative-direction |
| quality | testing-and-qa, browser-automation, api-testing, security-audit, performance-optimization, regression-prevention, production-readiness, code-review, chrome-devtools-debugging, playwright-cli-testing, systematic-debugging |
| delivery | infrastructure-engineering, deployment, release-management, documentation, environment-management, ci-cd, observability |
| efficiency | token-optimization, context-management, persistent-project-memory, parallel-agent-coordination, codebase-intelligence, repository-mapping, terminal-output-optimization |

`rust-modernization` and `observability` were added beyond the bootstrap brief: section 13
(Rust modernisation) and the monitoring-agent each need a dedicated, non-placeholder skill.

## Agents → skills

| Agent | Required | Optional |
|---|---|---|
| orchestrator | parallel-agent-coordination, context-management, requirements-analysis, code-review | token-optimization, persistent-project-memory, codebase-intelligence, repository-mapping, existing-project-audit, production-readiness, terminal-output-optimization, spec-driven-development |
| product-director | product-discovery, requirements-analysis | competitive-product-analysis, product-research, spec-driven-development |
| research-agent | product-research, competitive-product-analysis | reverse-engineering, codebase-intelligence, craft-anything-analysis |
| architecture-agent | architecture-planning, api-development | database-engineering, cross-platform-development, rust-modernization, existing-project-audit, spec-driven-development |
| ux-agent | ui-ux-design, design-system-engineering, accessibility-engineering | interaction-design, responsive-design, creative-direction, visual-regression |
| frontend-agent | frontend-development, responsive-design, accessibility-engineering | frontend-polish, interaction-design, fullstack-development, browser-automation, playwright-cli-testing, chrome-devtools-debugging, library-docs-lookup, systematic-debugging |
| backend-agent | backend-development, api-development, authentication-and-authorization | fullstack-development, database-engineering, rust-modernization, library-docs-lookup, systematic-debugging |
| mobile-agent | mobile-development, cross-platform-development | accessibility-engineering, responsive-design, library-docs-lookup |
| desktop-agent | desktop-development, cross-platform-development | rust-modernization |
| database-agent | database-engineering | performance-optimization, regression-prevention |
| integration-agent | integration-engineering, api-development | authentication-and-authorization, api-testing, library-docs-lookup |
| threejs-agent | threejs-production, 3d-product-production | asset-pipeline, performance-optimization, motion-design |
| blender-agent | blender-production, asset-pipeline | 3d-product-production, creative-direction |
| motion-agent | motion-design, interaction-design | visual-effects, accessibility-engineering |
| video-agent | remotion-production, video-editing | sound-design, visual-effects, creative-direction, asset-pipeline |
| infrastructure-agent | infrastructure-engineering, ci-cd, environment-management | deployment |
| monitoring-agent | observability | production-readiness, performance-optimization |
| security-agent | security-audit, authentication-and-authorization | code-review, reverse-engineering, craft-anything-analysis |
| performance-agent | performance-optimization | rust-modernization, browser-automation, chrome-devtools-debugging, systematic-debugging |
| qa-agent | testing-and-qa, browser-automation, regression-prevention | api-testing, visual-regression, accessibility-engineering, playwright-cli-testing, chrome-devtools-debugging, systematic-debugging, craft-anything-analysis |
| release-agent | release-management, deployment, production-readiness | ci-cd |
| documentation-agent | documentation | repository-mapping |
