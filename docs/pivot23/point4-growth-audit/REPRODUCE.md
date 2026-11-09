# Riproduzione (Node24, dipendenze app già installate)

Da apps/pivot23:
```sh
node --import=tsx --test scripts/point4/causal-contract.test.mjs
node --import=tsx scripts/point4/causal-audit.mjs . /workspace/repro-point4-a
node --import=tsx scripts/point4/causal-audit.mjs . /workspace/repro-point4-b
python3 scripts/point4/analyze.py /workspace/repro-point4-a
# solo i 4 profili policy dopo la correzione preview (9nov): stessi 120 seed
node --import=tsx scripts/point4/causal-audit.mjs . /workspace/repro-point4-policies --policies-only
cmp /workspace/repro-point4-a/careers.json /workspace/repro-point4-b/careers.json
cmp /workspace/repro-point4-a/sensitivity.json /workspace/repro-point4-b/sensitivity.json
pnpm test
pnpm test:stats
pnpm typecheck
pnpm lint
pnpm build
E2E_PORT=5314 pnpm exec playwright test e2e/engine-224-career.spec.ts e2e/native-lifecycle-protection.spec.ts e2e/future-save-protection.spec.ts --workers=2
```
Non eseguire in browser con storage reale. Gli script non installano dipendenze, non cambiano coefficienti, non chiamano API né localStorage. Archive di source fisse materializzate da Git per i confronti legacy; dipendenze condivise soltanto come node_modules read-only.

Legacy full-state (stesso harness committed in154/155/157):
```sh
node --import=tsx scripts/compatibility/worker.ts BASE157_APP /workspace/repro-base157.jsonl.gz
node --import=tsx scripts/compatibility/worker.ts . /workspace/repro-final.jsonl.gz
node scripts/compatibility/compare.mjs /workspace/repro-base157.jsonl.gz /workspace/repro-final.jsonl.gz /workspace/repro-157-final
node --import=tsx scripts/compatibility/worker.ts MAIN33810f7_APP /workspace/repro-main.jsonl.gz
node scripts/compatibility/compare.mjs /workspace/repro-main.jsonl.gz /workspace/repro-final.jsonl.gz /workspace/repro-main-final --allow-diagnostic-changes
```
L’ultimo flag è il modo preesistente del comparatore: segnala separatamente differenze diagnostiche della protezione155 già approvata, NON consente differenze di gameplay nelle13versioni212–224. I fallimenti resume full-memory sono riportati, non ignorati o trasformati in PASS. I raw legacy sono grandi (~362MB gzip ciascuno); manifest ne conserva SHA256 e path box.
