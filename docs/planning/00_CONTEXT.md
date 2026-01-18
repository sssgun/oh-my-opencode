# 00_CONTEXT.md - 프로젝트 개요 및 맥락

## 프로젝트 개요

**프로젝트명**: oh-my-opencode
**설명**: Claude Code/AmpCode 기능 구현을 위한 OpenCode 플러그인. AI 에이전트 오케스트레이션 (GPT-5.2, Claude, Gemini, Grok), LSP 도구 (11개), AST-Grep 검색, MCP 통합
**형식**: "oh-my-zsh for OpenCode"
**기술 스택**: TypeScript, Bun, Node.js, ESM 빌드

## 프로젝트 구조

```
oh-my-opencode/
├── src/
│   ├── agents/           # AI 에이전트 (Sisyphus, Oracle, Librarian 등 10+개)
│   ├── hooks/           # 22+개 라이프사이클 훅
│   ├── tools/           # LSP, AST-Grep, 세션 관리 도구
│   ├── features/        # Claude Code 호환 레이어
│   ├── shared/          # 크로스컷팅 유틸리티
│   ├── cli/            # CLI 설치 및 도구
│   ├── config/         # Zod 스키마, TypeScript 타입
│   └── index.ts        # 메인 플러그인 (580줄)
├── script/             # 빌드 스크립트
├── assets/            # JSON 스키마
└── dist/              # ESM 빌드 출력
```

## 이전 대화 및 요청 요약

### 원본 요청 (2025년 1월 17일)
```
# Sisyphus 라우팅 결정 표시 방안 분석

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.
```

### 첨부된 계획 내용 (cursor-plan://plan.md)
- **현재 구조 분석**: Sisyphus Router가 `route_sisyphus` → `delegate_task` 플로우로 작동
- **라우팅 결정 구조**: agent, complexity, confidence, reason, signals 포함 JSON
- **표시 방안 제안**:
  1. Router 응답에 라우팅 정보 포함
  2. UI 표시 도구 생성
  3. Hook을 통한 자동 표시
  4. 로깅 시스템 활용
  5. Toast/Notification 시스템

### 권장 구현 우선순위
1. **우선순위 1**: Router 응답에 라우팅 정보 포함 (가장 간단하고 즉각적)
2. **우선순위 2**: 전용 표시 도구
3. **우선순위 3**: Hook 기반 자동 표시

## CLAUDE.md 핵심 제약 요약

### TDD (Test-Driven Development) - 필수 준수
- **RED-GREEN-REFACTOR** 워크플로우 강제 적용
- 테스트 먼저 작성 → 실패 확인 → 최소 코드로 통과 → 리팩토링
- `bun test`로 검증, 80+ 테스트 파일 존재

### 안전 규칙 (CRITICAL)
- **파일 삭제 금지**: 어떠한 경우에도 프로젝트 파일 직접 삭제 불가
- **Git 안전 프로토콜**: 커밋/푸시/리셋 전 사용자 승낙 필수
- **백업 우선 정책**: 모든 위험 작업 전 tmp/backup/ 백업

### Python/Pythonic 개발 원칙
- **uv 패키지 매니저** 우선 사용
- **가상환경**: .venv 디렉토리 사용
- **RORO 패턴**: Receive an Object, Return an Object
- **Guard clauses**: 함수 시작부 에러 처리
- **Type hints**: 모든 함수 시그니처에 적용

### 프로젝트별 규칙
- **패키지 매니저**: Bun 전용 (`bun run`, `bun build`, `bunx`)
- **타입**: bun-types (not @types/node)
- **빌드**: `bun build` (ESM) + `tsc --emitDeclarationOnly`
- **배포**: GitHub Actions workflow_dispatch 전용 (OIDC 증명서)

## 절대 규칙

1. **TDD 준수**: 모든 기능 구현 및 버그 수정 시 RED-GREEN-REFACTOR 필수
2. **안전 우선**: 파일 삭제, Git 조작, 데이터베이스 조작 전 사용자 승낙
3. **품질 보증**: PEP 8, Ruff 린팅, 타입 힌트 필수
4. **문서화**: 연속성 있는 경우에만 문서 작성 (일회성 작업 제외)
5. **테스트 우선**: 테스트 코드로 검증 후 실제 코드 적용
6. **근본 원인 해결**: 증상 치료가 아닌 근본 원인 식별 및 해결

## 현재 작업 상태

Sisyphus 라우팅 결정 표시 기능 구현이 완료됨:
- ✅ Router 응답에 라우팅 정보 포함 (Priority 1)
- ✅ 전용 표시 도구 생성 (Priority 2)
- ✅ Hook 기반 자동 표시 (Priority 3)
- ✅ 모든 테스트 통과 (9/9)
- ✅ 기존 기능 영향 없음

다음 단계: 작업 종료 및 핸드오프 절차 실행 중