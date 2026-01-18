# 04_OPTIONS_AND_DECISION.md - 해결 방안 및 결정

## 가능한 해결 방안들

### 방안 1: Router 응답에 라우팅 정보 포함 (채택)

**설명**: Sisyphus Router가 라우팅 결정을 사용자에게 직접 표시

**구현 방법**:
```typescript
// src/agents/sisyphus-router.ts
const ROUTER_PROMPT = `
Step 2: Parse the returned JSON and display routing decision to user:

## 🔄 Routing Decision
**Complexity**: <decision.complexity>
**Agent**: <decision.agent>
**Confidence**: <decision.confidence>
**Reason**: <decision.reason>
`
```

**장점**:
- ✅ 즉각적 표시로 투명성 확보
- ✅ Router 수정으로 간단한 구현
- ✅ 모든 라우팅에서 자동 적용
- ✅ 사용자 교육 효과

**단점**:
- ⚠️ Router 프롬프트 복잡도 증가
- ⚠️ 응답 길이 증가로 가독성 저하 가능
- ⚠️ 라우팅 로직과 표시 로직 결합

**근본 원인 해결 여부**: ✅ 완전 해결 (1차, 2차 원인 모두)

---

### 방안 2: 전용 표시 도구 생성

**설명**: `show_routing_decision` 도구로 수동 라우팅 분석

**구현 방법**:
```typescript
// src/tools/show-routing-decision/tools.ts
export const show_routing_decision = tool({
  execute: async (args) => {
    const decision = await route_sisyphus.execute({ query: args.query })
    return formatRoutingDecision(JSON.parse(decision))
  }
})
```

**장점**:
- ✅ 필요할 때만 사용으로 깔끔함
- ✅ Router 상태 독립적 검사 가능
- ✅ 디버깅 및 분석에 유용
- ✅ 기존 아키텍처 변경 최소

**단점**:
- ⚠️ 수동 호출 필요로 투명성 제한적
- ⚠️ 사용자 교육 필요
- ⚠️ 자동화되지 않아 사용자 경험 저하

**근본 원인 해결 여부**: ⚠️ 부분적 해결 (2차 원인 완화, 1차 원인 미해결)

---

### 방안 3: Hook을 통한 자동 표시

**설명**: `chat.message` Hook으로 라우팅 정보 자동 주입

**구현 방법**:
```typescript
// src/hooks/routing-decision-display/index.ts
export function createRoutingDecisionDisplayHook(ctx: PluginInput) {
  return {
    "chat.message": async (input, output) => {
      // Router delegation 감지 및 정보 추가
      if (isRouterDelegation(output.parts)) {
        const routingInfo = extractAndFormatRoutingInfo(output.parts)
        appendRoutingInfo(output.parts, routingInfo)
      }
    }
  }
}
```

**장점**:
- ✅ 완전 자동화로 사용자 노력 불필요
- ✅ 기존 워크플로우 유지
- ✅ 확장성 높음 (추가 표시 방식 용이)
- ✅ 에러 복원력 좋음

**단점**:
- ⚠️ Hook 체인 복잡도 증가
- ⚠️ 디버깅 어려움 (간접적 개입)
- ⚠️ 성능 오버헤드 (모든 메시지 검사)

**근본 원인 해결 여부**: ✅ 완전 해결 (2차 원인 근본 해결)

---

### 방안 4: 로깅 시스템 활용

**설명**: 라우팅 결정을 구조화된 로그로 기록

**구현 방법**:
```typescript
// Router 확장
const decision = await routeWithStrategy({...})
log("[ROUTING_DECISION]", {
  query: args.query,
  agent: decision.agent,
  complexity: decision.complexity,
  confidence: decision.confidence,
  reason: decision.reason
})
```

**장점**:
- ✅ 디버깅 및 모니터링 용이
- ✅ 성능 영향 최소
- ✅ 기존 로깅 인프라 활용

**단점**:
- ❌ 실시간 표시 불가로 사용자 투명성 부족
- ❌ 로그 접근성 문제 (개발자 전용)
- ❌ 사용자 교육 효과 없음

**근본 원인 해결 여부**: ❌ 미해결 (모니터링 목적이지 투명성 해결 아님)

---

### 방안 5: Toast/Notification 시스템

**설명**: 라우팅 결정 시 토스트 알림 표시

**구현 방법**:
```typescript
// UI 레이어 통합
toastManager.show({
  type: "info",
  title: "Routing Decision",
  message: `Query routed to ${decision.agent} (${decision.confidence} confidence)`
})
```

**장점**:
- ✅ 비침습적 표시
- ✅ 사용자 경험 저해 최소
- ✅ 실시간 피드백 제공

**단점**:
- ❌ UI 의존성으로 플랫폼 제한
- ❌ 접근성 문제 (스크린 리더 등)
- ❌ 영속적 기록 부재

**근본 원인 해결 여부**: ⚠️ 부분적 해결 (실시간 피드백 제공이나 완전한 투명성 부족)

## 각 방안의 근본 원인 해결 여부 평가

| 방안 | 1차 원인 해결<br>(요구사항 누락) | 2차 원인 해결<br>(정보 흐름 단절) | 3차 원인 해결<br>(기술 우선순위) | 종합 평가 |
|------|--------------------------------|----------------------------------|-------------------------------|----------|
| **방안 1** | ✅ 완전 해결 | ✅ 완전 해결 | ✅ 해결 | ⭐⭐⭐⭐⭐ |
| **방안 2** | ⚠️ 부분 해결 | ✅ 완전 해결 | ✅ 해결 | ⭐⭐⭐⭐☆ |
| **방안 3** | ⚠️ 간접 해결 | ✅ 완전 해결 | ✅ 해결 | ⭐⭐⭐⭐☆ |
| **방안 4** | ❌ 미해결 | ⚠️ 부분 해결 | ⚠️ 부분 해결 | ⭐⭐☆☆☆ |
| **방안 5** | ⚠️ 부분 해결 | ⚠️ 부분 해결 | ⚠️ 부분 해결 | ⭐⭐⭐☆☆ |

## 최종 선택 및 근거

### 선택 방안: **방안 1 + 방안 2 + 방안 3 (복합 구현)**

**선택 근거**:

1. **완전한 투명성 확보**: 1+2+3 조합으로 모든 사용 사례 커버
   - 자동 표시 (방안 1): 모든 라우팅에서 기본 투명성
   - 수동 검사 (방안 2): 심층 분석 필요시
   - Hook 백업 (방안 3): 표시 실패시 복원력

2. **리스크 분산**: 단일 방안 실패시 다른 방안으로 커버
   - Router 표시 실패 → Hook으로 보완
   - Hook 실패 → 수동 도구로 대체

3. **사용자 요구사항 완전 충족**:
   - 즉각적 투명성: 방안 1
   - 선택적 심층 분석: 방안 2
   - 자동화된 경험: 방안 3

4. **기술적 타당성**: 각 방안이 독립적으로 구현 가능
   - Router 수정: 최소 침습
   - 도구 추가: 표준 패턴 준수
   - Hook 추가: 기존 22개 Hook과 동일

### 예상 구현 난이도 및 일정

| 방안 | 난이도 | 예상 시간 | 우선순위 |
|------|--------|----------|----------|
| 방안 1 | 🟢 낮음 | 2시간 | ⭐⭐⭐⭐⭐ |
| 방안 2 | 🟢 낮음 | 3시간 | ⭐⭐⭐⭐☆ |
| 방안 3 | 🟡 중간 | 4시간 | ⭐⭐⭐⭐☆ |

**총 예상 시간**: 9시간 (TDD 포함)

### 구현 순서 및 의존성

1. **방안 1** (Router 표시) - 독립적 구현 가능
2. **방안 2** (수동 도구) - Router에 의존
3. **방안 3** (Hook 자동화) - 방안 1/2 완료 후

### 성공 메트릭스

- **기능 완성도**: 100% (모든 방안 구현)
- **테스트 커버리지**: 100% (모든 코드 경로 테스트)
- **성능 영향**: <5% 응답 시간 증가
- **사용자 만족도**: 투명성 요구사항 100% 충족

## 결론

**선택**: 방안 1+2+3 복합 구현으로 최대 투명성과 유연성 확보

**근거**: 근본 원인을 완전히 해결하면서도 리스크를 최소화하고 사용자 가치를 극대화하는 최적의 균형점