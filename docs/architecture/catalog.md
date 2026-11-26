# Catalog: agents ↔ skills

Canonical names. The validator checks every reference against `agents/` and `skills/`.

## Skills by category (57)

| Category | Skills |
|---|---|
| product-intelligence | product-discovery, product-research, reverse-engineering, requirements-analysis, architecture-planning, competitive-product-analysis, existing-project-audit, rust-modernization |
| software-engineering | frontend-development, backend-development, fullstack-development, database-engineering, api-development, integration-engineering, authentication-and-authorization, mobile-development, desktop-development, cross-platform-development |
| design | ui-ux-design, design-system-engineering, accessibility-engineering, frontend-polish, interaction-design, responsive-design, motion-design, visual-regression |
| creative-production | threejs-production, blender-production, 3d-product-production, remotion-production, video-editing, sound-design, visual-effects, asset-pipeline, creative-direction |
| quality | testing-and-qa, browser-automation, api-testing, security-audit, performance-optimization, regression-prevention, production-readiness, code-review |
| delivery | infrastructure-engineering, deployment, release-management, documentation, environment-management, ci-cd, observability |
| efficiency | token-optimization, context-management, persistent-project-memory, parallel-agent-coordination, codebase-intelligence, repository-mapping, terminal-output-optimization |

`rust-modernization` and `observability` were added beyond the bootstrap brief: section 13
(Rust modernisation) and the monitoring-agent each need a dedicated, non-placeholder skill.

## Agents → skills

| Agent | Required | Optional |
|---|---|---|
| orchestrator | parallel-agent-coordination, context-management, requirements-analysis, code-review | token-optimization, persistent-project-memory, codebase-intelligence, repository-mapping, existing-project-audit, production-readiness, terminal-output-optimization |
| product-director | product-discovery, requirements-analysis | competitive-product-analysis, product-research |
| research-agent | product-research, competitive-product-analysis | reverse-engineering, codebase-intelligence |
| architecture-agent | architecture-planning, api-development | database-engineering, cross-platform-development, rust-modernization, existing-project-audit |
| ux-agent | ui-ux-design, design-system-engineering, accessibility-engineering | interaction-design, responsive-design, creative-direction, visual-regression |
| frontend-agent | frontend-development, responsive-design, accessibility-engineering | frontend-polish, interaction-design, fullstack-development, browser-automation |
| backend-agent | backend-development, api-development, authentication-and-authorization | fullstack-development, database-engineering, rust-modernization |
| mobile-agent | mobile-development, cross-platform-development | accessibility-engineering, responsive-design |
| desktop-agent | desktop-development, cross-platform-development | rust-modernization |
| database-agent | database-engineering | performance-optimization, regression-prevention |
| integration-agent | integration-engineering, api-development | authentication-and-authorization, api-testing |
| threejs-agent | threejs-production, 3d-product-production | asset-pipeline, performance-optimization, motion-design |
| blender-agent | blender-production, asset-pipeline | 3d-product-production, creative-direction |
| motion-agent | motion-design, interaction-design | visual-effects, accessibility-engineering |
| video-agent | remotion-production, video-editing | sound-design, visual-effects, creative-direction, asset-pipeline |
| infrastructure-agent | infrastructure-engineering, ci-cd, environment-management | deployment |
| monitoring-agent | observability | production-readiness, performance-optimization |
| security-agent | security-audit, authentication-and-authorization | code-review, reverse-engineering |
| performance-agent | performance-optimization | rust-modernization, browser-automation |
| qa-agent | testing-and-qa, browser-automation, regression-prevention | api-testing, visual-regression, accessibility-engineering |
| release-agent | release-management, deployment, production-readiness | ci-cd |
| documentation-agent | documentation | repository-mapping |
